import { Request, Response } from 'express';
import { PrismaClient, Role, JobStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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

    // Generic message — do not reveal whether email exists
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

    const [totalUsers, activeJobs, pendingJobs, totalApplications, recentUsers, recentCompanies, rawRegistrations, jobsByCategory] = await Promise.all([
      prisma.user.count(),
      prisma.job.count({ where: { status: JobStatus.PUBLISHED } }),
      prisma.job.count({ where: { status: 'PENDING_REVIEW' as JobStatus } }),
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
    ]);

    // Build 30-day registration trend
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

    res.json({
      totalUsers, activeJobs, pendingJobs, totalApplications,
      recentUsers, recentCompanies,
      registrationTrend, categoryStats,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// GET /admin/users?role=&status=&page=&limit=
// ==========================================
export const getAdminUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, status, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (role && typeof role === 'string') where.role = role;
    if (status && typeof status === 'string') where.status = status;

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
    const { id } = req.params;
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
      return;
    }
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) { res.status(404).json({ error: 'User not found' }); return; }
    if (target.role === Role.ADMIN) { res.status(400).json({ error: 'Cannot change status of admin accounts' }); return; }
    const user = await prisma.user.update({ where: { id }, data: { status } as any });
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
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) { res.status(404).json({ error: 'User not found' }); return; }
    if (target.role === Role.ADMIN) { res.status(400).json({ error: 'Cannot disable admin accounts' }); return; }
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { status: 'BANNED' } as any });
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
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) { res.status(404).json({ error: 'User not found' }); return; }
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { status: 'ACTIVE' } as any });
    res.json({ message: 'User enabled', user });
  } catch (error) {
    console.error('Error enabling user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// GET /admin/companies?page=&limit=
// ==========================================
export const getAdminCompanies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [companies, total] = await Promise.all([
      prisma.employerProfile.findMany({
        skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        select: {
          id: true, companyName: true, isVerified: true, industry: true,
          city: true, country: true, createdAt: true,
          user: { select: { id: true, email: true, status: true } },
          _count: { select: { jobs: true } },
        },
      }),
      prisma.employerProfile.count(),
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
    const { verified } = req.body;
    if (typeof verified !== 'boolean') { res.status(400).json({ error: '`verified` must be a boolean' }); return; }
    const company = await prisma.employerProfile.findUnique({ where: { id: req.params.id } });
    if (!company) { res.status(404).json({ error: 'Company not found' }); return; }
    const updated = await prisma.employerProfile.update({
      where: { id: req.params.id },
      data: { isVerified: verified } as any,
    });
    res.json({ message: verified ? 'Company verified' : 'Verification revoked', company: updated });
  } catch (error) {
    console.error('Error updating company verification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// GET /admin/jobs?status=&page=&limit=
// ==========================================
export const getAdminJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status = 'PENDING_REVIEW', page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status && typeof status === 'string') where.status = status;

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
          _count: { select: { applications: true } },
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
// PATCH /admin/jobs/:id/approve
// ==========================================
export const approveJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job) { res.status(404).json({ error: 'Job not found' }); return; }

    const updated = await prisma.job.update({
      where: { id: req.params.id },
      data: { status: JobStatus.PUBLISHED, adminNote: null },
    });
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
    const { reason } = req.body;
    if (!reason || !String(reason).trim()) {
      res.status(400).json({ error: 'Rejection reason is required' });
      return;
    }
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job) { res.status(404).json({ error: 'Job not found' }); return; }

    const updated = await prisma.job.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED' as JobStatus, adminNote: String(reason).trim() },
    });
    res.json({ message: 'Job rejected', job: updated });
  } catch (error) {
    console.error('Error rejecting job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
