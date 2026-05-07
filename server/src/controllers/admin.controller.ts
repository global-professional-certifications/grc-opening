import { Request, Response } from 'express';
import { PrismaClient, Role, JobStatus, ApplicationStatus, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { notifyAccountStatusChange, notifyCompanyVerificationChange, notifyJobForceClosed, notifyJobClosedToApplicants, broadcastNotification } from '../services/notification.service';
import { logAdminAction, AUDIT_ACTIONS } from '../services/audit.service';

const prisma = new PrismaClient();

const VALID_STATUSES = ['ACTIVE', 'SUSPENDED', 'BANNED'];

// ==========================================
// POST /admin/login  (public — no auth middleware)
// ==========================================
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (user.role !== Role.ADMIN) {
      res.status(403).json({ error: 'Access denied. Admin credentials required.' });
      return;
    }

    if ((user.status as string) === 'BANNED' || (user.status as string) === 'SUSPENDED') {
      res.status(403).json({ error: 'Account disabled. Contact support.' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      String(process.env.JWT_SECRET || 'dev_secret_keys_grc_2026'),
      { expiresIn: '8h', algorithm: 'HS256' }
    );

    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// GET /admin/stats
// ==========================================
export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      activeJobs,
      reportedJobs,
      totalApplications,
      recentUsers,
      recentCompanies,
      rawRegistrations,
      jobsByCategory,
      activeUsersCount,
      suspendedUsersCount,
      bannedUsersCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.job.count({ where: { status: JobStatus.PUBLISHED } }),
      prisma.job.count({ where: { reports: { some: {} } } }),
      prisma.application.count(),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true, email: true, role: true, status: true, createdAt: true,
          seekerProfile: { select: { firstName: true, lastName: true } },
          employerProfile: { select: { companyName: true } },
        },
      }),
      prisma.employerProfile.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true, companyName: true, isVerified: true, createdAt: true,
          user: { select: { id: true, email: true } },
        },
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.job.groupBy({
        by: ['category'],
        where: { category: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 6,
      }),
      prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
      prisma.user.count({ where: { status: UserStatus.BANNED } }),
    ]);

    const trendMap: Record<string, number> = {};
    rawRegistrations.forEach(u => {
      const day = u.createdAt.toISOString().slice(0, 10);
      trendMap[day] = (trendMap[day] || 0) + 1;
    });
    const registrationTrend = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const day = d.toISOString().slice(0, 10);
      return { date: day, count: trendMap[day] || 0 };
    });

    const categoryStats = jobsByCategory.map(j => ({
      category: j.category ?? 'Uncategorized',
      count: j._count.id,
    }));

    const userStatusBreakdown = {
      ACTIVE: activeUsersCount,
      SUSPENDED: suspendedUsersCount,
      BANNED: bannedUsersCount,
    };

    res.json({
      totalUsers, activeJobs, reportedJobs, totalApplications,
      userStatusBreakdown,
      recentUsers, recentCompanies,
      registrationTrend, categoryStats,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// GET /admin/users?role=&status=&search=&page=&limit=
// ==========================================
export const getAdminUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, status, search, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (role && typeof role === 'string') where.role = role;
    if (status && typeof status === 'string') where.status = status;
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { seekerProfile: { firstName: { contains: q, mode: 'insensitive' } } },
        { seekerProfile: { lastName: { contains: q, mode: 'insensitive' } } },
        { employerProfile: { companyName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, role: true, status: true, createdAt: true,
          seekerProfile: { select: { firstName: true, lastName: true, phone: true } },
          employerProfile: { select: { companyName: true, isVerified: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// PATCH /admin/users/:id/status
// ==========================================
export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user.id;
    const id = req.params.id as string;
    const { status } = req.body;
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
      return;
    }
    if (!reason) {
      res.status(400).json({ error: 'Reason is required for account status changes' });
      return;
    }
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) { res.status(404).json({ error: 'User not found' }); return; }
    if (target.role === Role.ADMIN) { res.status(400).json({ error: 'Cannot change status of admin accounts' }); return; }
    const user = await prisma.user.update({ where: { id }, data: { status } as any });
    notifyAccountStatusChange(id, status as any, reason).catch(console.error);
    logAdminAction({
      adminId,
      action: AUDIT_ACTIONS.USER_STATUS_CHANGED,
      targetType: 'USER',
      targetId: id,
      metadata: { newStatus: status, previousStatus: target.status, reason, email: target.email },
    }).catch(console.error);
    res.json({ message: 'Status updated', user });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// PATCH /admin/users/:id/disable
// ==========================================
export const disableUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user.id;
    const id = req.params.id as string;
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (!reason) {
      res.status(400).json({ error: 'Reason is required for disabling accounts' });
      return;
    }
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) { res.status(404).json({ error: 'User not found' }); return; }
    if (target.role === Role.ADMIN) { res.status(400).json({ error: 'Cannot disable admin accounts' }); return; }
    const user = await prisma.user.update({ where: { id }, data: { status: 'BANNED' } as any });
    notifyAccountStatusChange(id, 'BANNED', reason).catch(console.error);
    logAdminAction({
      adminId,
      action: AUDIT_ACTIONS.USER_DISABLED,
      targetType: 'USER',
      targetId: id,
      metadata: { reason, email: target.email, previousStatus: target.status },
    }).catch(console.error);
    res.json({ message: 'User disabled', user });
  } catch (error) {
    console.error('Error disabling user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// PATCH /admin/users/:id/enable
// ==========================================
export const enableUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user.id;
    const id = req.params.id as string;
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (!reason) {
      res.status(400).json({ error: 'Reason is required for enabling accounts' });
      return;
    }
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) { res.status(404).json({ error: 'User not found' }); return; }
    const user = await prisma.user.update({ where: { id }, data: { status: 'ACTIVE' } as any });
    notifyAccountStatusChange(id, 'ACTIVE', reason).catch(console.error);
    logAdminAction({
      adminId,
      action: AUDIT_ACTIONS.USER_ENABLED,
      targetType: 'USER',
      targetId: id,
      metadata: { reason, email: target.email, previousStatus: target.status },
    }).catch(console.error);
    res.json({ message: 'User enabled', user });
  } catch (error) {
    console.error('Error enabling user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// GET /admin/companies?search=&verified=&page=&limit=
// ==========================================
export const getAdminCompanies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', search, verified } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { companyName: { contains: q, mode: 'insensitive' } },
        { industry: { contains: q, mode: 'insensitive' } },
        { country: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }
    if (verified !== undefined && verified !== '') {
      where.isVerified = verified === 'true';
    }
    const [companies, total] = await Promise.all([
      prisma.employerProfile.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        select: {
          id: true, companyName: true, isVerified: true, industry: true,
          city: true, country: true, createdAt: true,
          user: { select: { id: true, email: true, status: true } },
          _count: { select: { jobs: true } },
        },
      }),
      prisma.employerProfile.count({ where }),
    ]);
    res.json({ companies, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Error fetching admin companies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// PATCH /admin/companies/:id/verify
// ==========================================
export const setCompanyVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user.id;
    const { verified } = req.body;
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (typeof verified !== 'boolean') { res.status(400).json({ error: '`verified` must be a boolean' }); return; }
    if (!reason) { res.status(400).json({ error: 'Reason is required for company verification updates' }); return; }
    const id = req.params.id as string;
    const company = await prisma.employerProfile.findUnique({ where: { id } });
    if (!company) { res.status(404).json({ error: 'Company not found' }); return; }
    const updated = await prisma.employerProfile.update({
      where: { id },
      data: { isVerified: verified } as any,
    });
    notifyCompanyVerificationChange(company.userId, verified, reason).catch(console.error);
    logAdminAction({
      adminId,
      action: verified ? AUDIT_ACTIONS.COMPANY_VERIFIED : AUDIT_ACTIONS.COMPANY_VERIFICATION_REVOKED,
      targetType: 'COMPANY',
      targetId: id,
      metadata: { reason, companyName: company.companyName, verified },
    }).catch(console.error);
    res.json({ message: verified ? 'Company verified' : 'Verification revoked', company: updated });
  } catch (error) {
    console.error('Error updating company verification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// GET /admin/jobs?reported=true&status=&search=&category=&page=&limit=
// ==========================================
export const getAdminJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reported, status, search, category, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    if (reported === 'true') {
      where.reports = { some: {} };
    }
    if (status && typeof status === 'string' && status.trim()) {
      where.status = status;
    }

    if (category && typeof category === 'string') where.category = category;
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { employer: { companyName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: {
          employer: {
            select: {
              id: true, companyName: true, isVerified: true, createdAt: true,
              user: { select: { email: true, createdAt: true } },
            },
          },
          certifications: { select: { name: true } },
          reports: {
            orderBy: { createdAt: 'desc' },
            include: {
              seeker: { select: { firstName: true, lastName: true } },
            },
          },
          _count: { select: { applications: true, reports: true } },
        },
      }),
      prisma.job.count({ where }),
    ]);

    res.json({ jobs, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Error fetching admin jobs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// PATCH /admin/jobs/:id/close  (admin force-close any job)
// ==========================================
export const closeJobAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user.id;
    const id = req.params.id as string;
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (!reason) {
      res.status(400).json({ error: 'Close reason is required' });
      return;
    }

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const updated = await prisma.job.update({
      where: { id },
      data: { status: JobStatus.CLOSED, adminNote: reason },
      include: { employer: true }
    });
    notifyJobForceClosed(updated.employer.userId, updated.id, updated.title, reason).catch(console.error);
    notifyJobClosedToApplicants(updated.id, updated.title).catch(console.error);
    logAdminAction({
      adminId,
      action: AUDIT_ACTIONS.JOB_CLOSED,
      targetType: 'JOB',
      targetId: id,
      metadata: { reason, jobTitle: job.title, previousStatus: job.status },
    }).catch(console.error);
    res.json({ message: 'Job closed by admin', job: updated });
  } catch (error) {
    console.error('Error closing job (admin):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// GET /admin/applications?search=&status=&page=&limit=
// ==========================================
export const getAdminApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    if (status && typeof status === 'string' && status.trim()) {
      where.status = status as ApplicationStatus;
    }
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { seeker: { firstName: { contains: q, mode: 'insensitive' } } },
        { seeker: { lastName:  { contains: q, mode: 'insensitive' } } },
        { job: { title: { contains: q, mode: 'insensitive' } } },
        { job: { employer: { companyName: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { appliedAt: 'desc' },
        include: {
          seeker: {
            select: {
              id: true,
              firstName: true, lastName: true, headline: true, avatarUrl: true,
              user: { select: { email: true } },
            },
          },
          job: {
            select: {
              title: true, category: true, status: true,
              employer: { select: { companyName: true, isVerified: true } },
            },
          },
        },
      }),
      prisma.application.count({ where }),
    ]);

    res.json({ applications, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Error fetching admin applications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// PATCH /admin/jobs/:id/approve
// ==========================================
export const approveJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user.id;
    const id = req.params.id as string;
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) { res.status(404).json({ error: 'Job not found' }); return; }

    const updated = await prisma.job.update({
      where: { id },
      data: { status: JobStatus.PUBLISHED, adminNote: null },
    });
    logAdminAction({
      adminId,
      action: AUDIT_ACTIONS.JOB_APPROVED,
      targetType: 'JOB',
      targetId: id,
      metadata: { jobTitle: job.title, previousStatus: job.status },
    }).catch(console.error);
    res.json({ message: 'Job approved and published', job: updated });
  } catch (error) {
    console.error('Error approving job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// PATCH /admin/jobs/:id/reject
// ==========================================
export const rejectJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user.id;
    const { reason } = req.body;
    if (!reason || !String(reason).trim()) {
      res.status(400).json({ error: 'Rejection reason is required' });
      return;
    }
    const id = req.params.id as string;
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) { res.status(404).json({ error: 'Job not found' }); return; }

    const updated = await prisma.job.update({
      where: { id },
      data: { status: 'REJECTED' as JobStatus, adminNote: String(reason).trim() },
      include: { employer: true }
    });
    notifyJobForceClosed(updated.employer.userId, updated.id, updated.title, String(reason).trim()).catch(console.error);
    logAdminAction({
      adminId,
      action: AUDIT_ACTIONS.JOB_REJECTED,
      targetType: 'JOB',
      targetId: id,
      metadata: { reason: String(reason).trim(), jobTitle: job.title, previousStatus: job.status },
    }).catch(console.error);
    res.json({ message: 'Job rejected', job: updated });
  } catch (error) {
    console.error('Error rejecting job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// GET /admin/audit-logs?action=&targetType=&page=&limit=
// ==========================================
export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, targetType, page = '1', limit = '30' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (action && typeof action === 'string' && action.trim()) where.action = action.trim();
    if (targetType && typeof targetType === 'string' && targetType.trim()) where.targetType = targetType.trim();

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          admin: { select: { email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ logs, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// GET /admin/seekers/:seekerId  (full seeker profile for admin)
// ==========================================
export const getAdminSeekerProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const seekerId = req.params.seekerId as string;

    const seeker = await prisma.seekerProfile.findUnique({
      where: { id: seekerId },
      include: {
        user: { select: { email: true, status: true, createdAt: true, role: true } },
        skills: { select: { id: true, name: true } },
        workExperiences: { orderBy: { sortOrder: 'asc' } },
        educations: { orderBy: { sortOrder: 'asc' } },
        certifications: { orderBy: { sortOrder: 'asc' } },
        applications: {
          orderBy: { appliedAt: 'desc' },
          include: {
            job: {
              select: {
                id: true, title: true, status: true,
                employer: { select: { companyName: true, isVerified: true } },
              },
            },
          },
        },
      },
    });

    if (!seeker) {
      res.status(404).json({ error: 'Seeker profile not found' });
      return;
    }

    res.json({ seeker });
  } catch (error) {
    console.error('Error fetching seeker profile (admin):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// POST /admin/broadcast
// ==========================================
export const sendBroadcast = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user.id;
    const { title, message, targetRole } = req.body;

    if (!title || !String(title).trim()) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }
    if (!message || !String(message).trim()) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }
    const validTargets = ['ALL', 'JOB_SEEKER', 'EMPLOYER'];
    if (!validTargets.includes(targetRole)) {
      res.status(400).json({ error: `targetRole must be one of: ${validTargets.join(', ')}` });
      return;
    }

    const trimTitle = String(title).trim();
    const trimMsg = String(message).trim();

    const recipientCount = await broadcastNotification(trimTitle, trimMsg, targetRole);

    logAdminAction({
      adminId,
      action: AUDIT_ACTIONS.BROADCAST_SENT,
      targetType: 'BROADCAST',
      metadata: { title: trimTitle, targetRole, recipientCount },
    }).catch(console.error);

    res.json({ message: 'Broadcast sent', recipientCount });
  } catch (error) {
    console.error('Error sending broadcast:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
