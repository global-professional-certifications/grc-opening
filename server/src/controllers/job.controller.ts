import { Request, Response } from 'express';
import { PrismaClient, JobStatus, WorkMode, ApplicationStatus } from '@prisma/client';

const prisma = new PrismaClient();

type DiscoveryJob = {
  id: string;
  companyName: string;
  companyLogoText: string;
  title: string;
  category: string;
  location: string;
  workMode: 'Remote' | 'Hybrid' | 'On-site';
  jobType: string;
  seniority: string;
  experienceLevel: string;
  postedAtLabel: string;
  deadline: string | null;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  undisclosedSalary: boolean;
  applicationWindowLabel: string;
  applyUrl: string;
  tags: string[];
  verified: boolean;
  description: string;
  responsibilities: string;
  qualifications: string;
  niceToHave: string;
  isSaved: boolean;
  isApplied: boolean;
  applicationId: string | null;
};



function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDateOnlyToEndOfDay(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Accept YYYY-MM-DD from <input type="date">
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
    const dt = new Date(year, month - 1, day, 23, 59, 59, 999);
    if (Number.isNaN(dt.getTime())) return null;
    return dt;
  }

  const dt = new Date(trimmed);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function applicationWindowLabel(deadline: Date | null): string {
  if (!deadline) return 'Open indefinitely';
  const fmt = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: '2-digit' });
  return `Apply by ${fmt.format(deadline)}`;
}

export const createJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      title, description, location, workMode,
      category, jobType, seniority, experience,
      responsibilities, qualifications, niceToHave,
      currency, undisclosedSalary,
      salaryMin, salaryMax,
      certifications,
      deadline,
    } = req.body;

    // 1. Ensure the Employer Profile exists before creating a job
    const employerProfile = await prisma.employerProfile.findUnique({
      where: { userId }
    });

    if (!employerProfile) {
      res.status(403).json({ error: 'You must complete your Employer Profile before creating a job' });
      return;
    }

    if (!(employerProfile as any).isVerified) {
      res.status(403).json({ error: 'Company not verified. Contact admin to get your company verified before posting jobs.' });
      return;
    }

    // 2. Validate essential fields
    if (!title || !description) {
      res.status(400).json({ error: 'Title and description are required' });
      return;
    }

    const parsedDeadline = parseDateOnlyToEndOfDay(deadline);
    if (!parsedDeadline) {
      res.status(400).json({ error: 'Deadline is required (YYYY-MM-DD)' });
      return;
    }
    if (parsedDeadline.getTime() < startOfToday().getTime()) {
      res.status(400).json({ error: 'Deadline must be today or later' });
      return;
    }

    const workModeKey = String(workMode ?? '').toUpperCase().replace('-', '_');
    const workModeMap: Record<string, WorkMode> = {
      'REMOTE': WorkMode.REMOTE,
      'HYBRID': WorkMode.HYBRID,
      'ON_SITE': WorkMode.ON_SITE,
    };
    const parsedWorkMode: WorkMode = workModeMap[workModeKey] ?? WorkMode.ON_SITE;

    // 3. Store certifications as provided (free-form tags, e.g. CISA, CIA)
    const validCerts: { name: string }[] = Array.isArray(certifications)
      ? certifications.map((name: string) => ({ name }))
      : [];

    // 4. Record new JobPosting in database
    const job = await prisma.job.create({
      data: {
        employerId: employerProfile.id,
        title,
        description,
        location:         location        ?? null,
        workMode:         parsedWorkMode,
        status:           JobStatus.PUBLISHED,
        deadline:         parsedDeadline,
        category:         category        ?? null,
        jobType:          jobType         ?? null,
        seniority:        seniority       ?? null,
        experience:       experience      ?? null,
        responsibilities: responsibilities ?? null,
        qualifications:   qualifications  ?? null,
        niceToHave:       niceToHave      ?? null,
        currency:         currency        ?? 'USD',
        undisclosedSalary: undisclosedSalary === true || undisclosedSalary === 'true',
        salaryMin:        (!undisclosedSalary && salaryMin) ? parseInt(salaryMin) : null,
        salaryMax:        (!undisclosedSalary && salaryMax) ? parseInt(salaryMax) : null,
        certifications: { create: validCerts },
      },
      include: { certifications: true },
    });

    res.status(201).json({ message: 'Job created successfully', job });
  } catch (error) {
    console.error('Error creating job posting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const {
      title, description, location, workMode,
      category, jobType, seniority, experience,
      responsibilities, qualifications, niceToHave,
      currency, undisclosedSalary,
      salaryMin, salaryMax,
      certifications,
      deadline,
    } = req.body;

    const employerProfile = await prisma.employerProfile.findUnique({ where: { userId } });
    if (!employerProfile) { res.status(403).json({ error: 'Employer profile required' }); return; }

    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ error: 'Job not found' }); return; }
    if (existing.employerId !== employerProfile.id) {
      res.status(403).json({ error: 'Unauthorized to edit this job' });
      return;
    }
    if (existing.status === JobStatus.CLOSED) {
      res.status(409).json({ error: 'Closed job postings cannot be edited or republished' });
      return;
    }

    if (!title || !description) {
      res.status(400).json({ error: 'Title and description are required' });
      return;
    }

    const workModeKey = String(workMode ?? '').toUpperCase().replace('-', '_');
    const workModeMap: Record<string, WorkMode> = {
      'REMOTE': WorkMode.REMOTE,
      'HYBRID': WorkMode.HYBRID,
      'ON_SITE': WorkMode.ON_SITE,
    };
    const parsedWorkMode: WorkMode = workModeMap[workModeKey] ?? existing.workMode;

    const undisclosed = undisclosedSalary === true || undisclosedSalary === 'true';
    const validCerts: { name: string }[] = Array.isArray(certifications)
      ? certifications.map((name: string) => ({ name }))
      : [];

    const parsedDeadline = deadline === undefined ? undefined : parseDateOnlyToEndOfDay(deadline);
    if (deadline !== undefined && !parsedDeadline) {
      res.status(400).json({ error: 'Invalid deadline (expected YYYY-MM-DD)' });
      return;
    }
    if (parsedDeadline && parsedDeadline.getTime() < startOfToday().getTime()) {
      res.status(400).json({ error: 'Deadline must be today or later' });
      return;
    }

    const job = await prisma.$transaction(async (tx) => {
      await tx.jobCertification.deleteMany({ where: { jobId: id } });
      return tx.job.update({
        where: { id },
        data: {
          title,
          description,
          location:         location        ?? null,
          workMode:         parsedWorkMode,
          category:         category        ?? null,
          jobType:          jobType         ?? null,
          seniority:        seniority       ?? null,
          experience:       experience      ?? null,
          responsibilities: responsibilities ?? null,
          qualifications:   qualifications  ?? null,
          niceToHave:       niceToHave      ?? null,
          currency:         currency        ?? 'USD',
          undisclosedSalary: undisclosed,
          salaryMin:        (!undisclosed && salaryMin) ? parseInt(salaryMin) : null,
          salaryMax:        (!undisclosed && salaryMax) ? parseInt(salaryMax) : null,
          ...(parsedDeadline !== undefined ? { deadline: parsedDeadline } : {}),
          certifications: { create: validCerts },
        },
        include: { certifications: true },
      });
    });

    res.status(200).json({ message: 'Job updated successfully', job });
  } catch (error) {
    console.error('Error updating job posting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

function workModeToLabel(wm: WorkMode): 'Remote' | 'Hybrid' | 'On-site' {
  if (wm === WorkMode.REMOTE) return 'Remote';
  if (wm === WorkMode.HYBRID) return 'Hybrid';
  return 'On-site';
}

function getPostedAtLabel(createdAt: Date): string {
  const hours = (Date.now() - createdAt.getTime()) / 3600000;
  if (hours < 1) return 'Posted just now';
  if (hours < 24) return `Posted ${Math.floor(hours)} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Posted yesterday';
  if (days < 7) return `Posted ${days} days ago`;
  return `Posted ${Math.floor(days / 7)} weeks ago`;
}

export const getDiscoveryJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const loc = typeof req.query.location === 'string' ? req.query.location.trim() : '';
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
    const pageSizeRaw = Number.parseInt(String(req.query.page_size ?? '100'), 10) || 100;
    const pageSize = Math.min(200, Math.max(1, pageSizeRaw));
    const skip = (page - 1) * pageSize;

    const andFilters: any[] = [
      // Keep existing jobs (deadline=null) visible, but enforce deadline gating for new jobs.
      { OR: [{ deadline: null }, { deadline: { gte: startOfToday() } }] },
    ];

    if (q) {
      andFilters.push({
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { location: { contains: q, mode: 'insensitive' } },
          { employer: { companyName: { contains: q, mode: 'insensitive' } } },
        ],
      });
    }

    if (loc) {
      andFilters.push({ location: { contains: loc, mode: 'insensitive' } });
    }

    const where = {
      status: JobStatus.PUBLISHED,
      AND: andFilters,
    };

    const [totalCount, dbJobs, seekerProfile] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        include: { employer: true, certifications: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.seekerProfile.findUnique({ where: { userId } }),
    ]);

    let savedJobIds = new Set<string>();
    let appliedJobIds = new Set<string>();
    let applicationIdByJobId = new Map<string, string>();
    if (seekerProfile) {
      const [saved, applied] = await Promise.all([
        prisma.savedJob.findMany({
          where: { seekerId: seekerProfile.id },
          select: { jobId: true },
        }),
        prisma.application.findMany({
          where: { seekerId: seekerProfile.id, status: { not: ApplicationStatus.WITHDRAWN } },
          select: { jobId: true, id: true },
        }),
      ]);
      savedJobIds = new Set(saved.map(s => s.jobId));
      appliedJobIds = new Set(applied.map(a => a.jobId));
      applicationIdByJobId = new Map(applied.map(a => [a.jobId, a.id]));
    }

    const realJobs: DiscoveryJob[] = dbJobs.map(job => ({
      id:                   job.id,
      companyName:          job.employer.companyName,
      companyLogoText:      job.employer.companyName.charAt(0).toUpperCase(),
      title:                job.title,
      category:             job.category ?? job.certifications[0]?.name ?? '',
      location:             job.location ?? '',
      workMode:             workModeToLabel(job.workMode),
      jobType:              job.jobType ?? '',
      seniority:            job.seniority ?? '',
      experienceLevel:      job.experience ?? '',
      postedAtLabel:        getPostedAtLabel(job.createdAt),
      deadline:             job.deadline ? job.deadline.toISOString() : null,
      salaryMin:            job.salaryMin ?? 0,
      salaryMax:            job.salaryMax ?? 0,
      salaryCurrency:       job.currency ?? 'USD',
      undisclosedSalary:    job.undisclosedSalary,
      applicationWindowLabel: applicationWindowLabel(job.deadline ?? null),
      applyUrl:             '#',
      tags:                 job.certifications.map(c => c.name),
      verified:             true,
      description:          job.description,
      responsibilities:     job.responsibilities ?? '',
      qualifications:       job.qualifications ?? '',
      niceToHave:           job.niceToHave ?? '',
      isSaved:              savedJobIds.has(job.id),
      isApplied:            appliedJobIds.has(job.id),
      applicationId:        applicationIdByJobId.get(job.id) ?? null,
    }));

    const [categoryRows, experienceRows] = await Promise.all([
      prisma.job.findMany({
        where,
        select: { category: true },
        distinct: ['category'],
        take: 200,
      }),
      prisma.job.findMany({
        where,
        select: { experience: true },
        distinct: ['experience'],
        take: 200,
      }),
    ]);

    const categories = categoryRows
      .map((r) => r.category ?? '')
      .map((v) => v.trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    const experienceLevels = experienceRows
      .map((r) => r.experience ?? '')
      .map((v) => v.trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    const workModes: Array<'Remote' | 'Hybrid' | 'On-site'> = ['Remote', 'Hybrid', 'On-site'];

    // Normalize salary bounds to USD so the slider works with mixed-currency postings
    const CURRENCY_TO_USD: Record<string, number> = {
      USD: 1, EUR: 1 / 0.92, GBP: 1 / 0.79, INR: 1 / 83.1, CAD: 1 / 1.36, AUD: 1 / 1.52,
    };
    const salaryValuesUSD = realJobs
      .flatMap(j => [
        { v: j.salaryMin, c: j.salaryCurrency },
        { v: j.salaryMax, c: j.salaryCurrency },
      ])
      .filter(x => x.v > 0)
      .map(x => x.v * (CURRENCY_TO_USD[x.c] ?? 1));

    res.status(200).json({
      jobs: realJobs,
      filters: {
        categories,
        workModes,
        experienceLevels,
        salaryRange: {
          min: salaryValuesUSD.length ? Math.min(...salaryValuesUSD) : 0,
          max: salaryValuesUSD.length ? Math.max(...salaryValuesUSD) : 250000,
        },
      },
      meta: {
        totalJobs: totalCount, // backwards compatible
        totalCount,
        page,
        pageSize,
      },
    });
  } catch (error) {
    console.error('Error fetching discovery jobs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEmployerJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    // Find matching employer profile
    const employerProfile = await prisma.employerProfile.findUnique({
      where: { userId }
    });

    if (!employerProfile) {
      res.status(404).json({ error: 'Employer profile not found' });
      return;
    }

    const jobs = await prisma.job.findMany({
      where: { employerId: employerProfile.id },
      include: {
        certifications: true,
        _count: {
          select: { applications: true } // Return number of applications per job
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ jobs });
  } catch (error) {
    console.error('Error fetching employer jobs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// GET /jobs/stats — Employer Dashboard KPIs
// ==========================================
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const employerProfile = await prisma.employerProfile.findUnique({ where: { userId } });
    if (!employerProfile) {
      res.status(404).json({ error: 'Employer profile not found' });
      return;
    }

    const employerId = employerProfile.id;

    // Total jobs by status
    const allJobs = await prisma.job.findMany({
      where: { employerId },
      include: { _count: { select: { applications: true } } },
    });

    const activeJobs = allJobs.filter(j => j.status === JobStatus.PUBLISHED);
    const closedJobs = allJobs.filter(j => j.status === JobStatus.CLOSED);
    const totalApplicants = allJobs.reduce((sum, j) => sum + j._count.applications, 0);

    // Shortlisted = applications with status REVIEWING or INTERVIEWING
    const shortlisted = await prisma.application.count({
      where: {
        job: { employerId },
        status: { in: [ApplicationStatus.REVIEWING, ApplicationStatus.INTERVIEWING] },
      },
    });

    res.status(200).json({
      stats: {
        activeJobCount: activeJobs.length,
        closedJobCount: closedJobs.length,
        totalApplicants,
        shortlisted,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// GET /jobs/recent-applicants — Latest 6 applicants
// ==========================================
export const getRecentApplicants = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const employerProfile = await prisma.employerProfile.findUnique({ where: { userId } });
    if (!employerProfile) {
      res.status(404).json({ error: 'Employer profile not found' });
      return;
    }

    const applications = await prisma.application.findMany({
      where: { job: { employerId: employerProfile.id } },
      orderBy: { appliedAt: 'desc' },
      take: 6,
      include: {
        seeker: {
          include: {
            certifications: true,
          },
        },
        job: { select: { title: true } },
      },
    });

    const result = applications.map(a => ({
      id: a.id,
      seekerName: `${a.seeker.firstName} ${a.seeker.lastName}`.trim(),
      jobTitle: a.job.title,
      status: a.status,
      appliedAt: a.appliedAt,
      certifications: a.seeker.certifications.map(c => c.name),
    }));

    res.status(200).json({ applicants: result });
  } catch (error) {
    console.error('Error fetching recent applicants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const closeJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string; // Job ID
    
    // 1. Get employer profile
    const employerProfile = await prisma.employerProfile.findUnique({
      where: { userId }
    });

    if (!employerProfile) {
      res.status(404).json({ error: 'Employer profile not found' });
      return;
    }

    // 2. Fetch job and verify ownership
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    if (job.employerId !== employerProfile.id) {
      res.status(403).json({ error: 'Unauthorized to modify this job' });
      return;
    }

    // 3. Issue #23 Soft Delete -> simply change status to CLOSED
    const closedJob = await prisma.job.update({
      where: { id },
      data: { status: JobStatus.CLOSED }
    });

    res.status(200).json({ message: 'Job posting closed successfully', job: closedJob });
  } catch (error) {
    console.error('Error closing job posting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// GET /jobs/:id — Job detail (any authenticated user)
// ==========================================
export const getJobById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const job = await prisma.job.findUnique({
      where: { id: String(id) },
      include: {
        employer: true,
        certifications: true,
        _count: { select: { applications: true } },
      },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    let hasApplied = false;
    let isSaved = false;
    if (userRole === 'JOB_SEEKER') {
      const seekerProfile = await prisma.seekerProfile.findUnique({ where: { userId } });
      if (seekerProfile) {
        const [existing, saved] = await Promise.all([
          prisma.application.findFirst({ where: { jobId: String(id), seekerId: seekerProfile.id } }),
          prisma.savedJob.findFirst({ where: { jobId: String(id), seekerId: seekerProfile.id } }),
        ]);
        hasApplied = !!existing;
        isSaved = !!saved;
      }
    }

    res.status(200).json({ job: { ...job, hasApplied, isSaved } });
  } catch (error) {
    console.error('Error fetching job by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// POST /jobs/:id/save — Seeker saves a job
// ==========================================
export const saveJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const jobId = String(req.params.id);

    const seekerProfile = await prisma.seekerProfile.findUnique({ where: { userId } });
    if (!seekerProfile) { res.status(404).json({ error: 'Seeker profile not found' }); return; }

    await prisma.savedJob.upsert({
      where: { seekerId_jobId: { seekerId: seekerProfile.id, jobId } },
      create: { seekerId: seekerProfile.id, jobId },
      update: {},
    });

    res.status(200).json({ message: 'Job saved' });
  } catch (error) {
    console.error('Error saving job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// DELETE /jobs/:id/save — Seeker unsaves a job
// ==========================================
// ==========================================
// GET /jobs/saved — Seeker's saved jobs
// ==========================================
export const getSavedJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const seekerProfile = await prisma.seekerProfile.findUnique({ where: { userId } });
    if (!seekerProfile) { res.status(404).json({ error: 'Seeker profile not found' }); return; }

    const [saved, applied] = await Promise.all([
      prisma.savedJob.findMany({
        where: { seekerId: seekerProfile.id },
        orderBy: { savedAt: 'desc' },
        include: { job: { include: { employer: true, certifications: true } } },
      }),
      prisma.application.findMany({
        where: { seekerId: seekerProfile.id, status: { not: ApplicationStatus.WITHDRAWN } },
        select: { jobId: true, id: true },
      }),
    ]);
    const appliedJobIdsSaved = new Set(applied.map(a => a.jobId));
    const applicationIdByJobIdSaved = new Map(applied.map(a => [a.jobId, a.id]));

    const jobs: DiscoveryJob[] = saved.map(({ job }) => ({
      id:                   job.id,
      companyName:          job.employer.companyName,
      companyLogoText:      job.employer.companyName.charAt(0).toUpperCase(),
      title:                job.title,
      category:             job.category ?? job.certifications[0]?.name ?? '',
      location:             job.location ?? '',
      workMode:             workModeToLabel(job.workMode),
      jobType:              job.jobType ?? '',
      seniority:            job.seniority ?? '',
      experienceLevel:      job.experience ?? '',
      postedAtLabel:        getPostedAtLabel(job.createdAt),
      deadline:             job.deadline ? job.deadline.toISOString() : null,
      salaryMin:            job.salaryMin ?? 0,
      salaryMax:            job.salaryMax ?? 0,
      salaryCurrency:       job.currency ?? 'USD',
      undisclosedSalary:    job.undisclosedSalary,
      applicationWindowLabel: 'Open indefinitely',
      applyUrl:             '#',
      tags:                 job.certifications.map(c => c.name),
      verified:             true,
      description:          job.description,
      responsibilities:     job.responsibilities ?? '',
      qualifications:       job.qualifications ?? '',
      niceToHave:           job.niceToHave ?? '',
      isSaved:              true,
      isApplied:            appliedJobIdsSaved.has(job.id),
      applicationId:        applicationIdByJobIdSaved.get(job.id) ?? null,
    }));

    res.status(200).json({ jobs });
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const withdrawJobApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const jobId = String(req.params.id);

    const seekerProfile = await prisma.seekerProfile.findUnique({ where: { userId } });
    if (!seekerProfile) { res.status(404).json({ error: 'Seeker profile not found' }); return; }

    const application = await prisma.application.findFirst({
      where: { jobId, seekerId: seekerProfile.id },
    });
    if (!application) { res.status(404).json({ error: 'Application not found' }); return; }
    if (application.status !== ApplicationStatus.PENDING) {
      res.status(400).json({ error: 'Only pending applications can be withdrawn' });
      return;
    }

    await prisma.application.delete({ where: { id: application.id } });

    res.status(200).json({ message: 'Application withdrawn successfully' });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const unsaveJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const jobId = String(req.params.id);

    const seekerProfile = await prisma.seekerProfile.findUnique({ where: { userId } });
    if (!seekerProfile) { res.status(404).json({ error: 'Seeker profile not found' }); return; }

    await prisma.savedJob.deleteMany({
      where: { seekerId: seekerProfile.id, jobId },
    });

    res.status(200).json({ message: 'Job unsaved' });
  } catch (error) {
    console.error('Error unsaving job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
