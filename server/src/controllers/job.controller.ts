import { Request, Response } from 'express';
import { PrismaClient, JobStatus, WorkMode, ApplicationStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration for validating GRC related category tags (Issue #22)
const VALID_GRC_CATEGORIES = [
  'Risk Management',
  'Compliance',
  'Audit',
  'Information Security',
  'Data Privacy',
  'Corporate Governance',
  'Regulatory Affairs'
];

export const createJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { title, description, location, workMode, salaryMin, salaryMax, certifications } = req.body;

    // 1. Ensure the Employer Profile exists before creating a job
    const employerProfile = await prisma.employerProfile.findUnique({
      where: { userId }
    });

    if (!employerProfile) {
      res.status(403).json({ error: 'You must complete your Employer Profile before creating a job' });
      return;
    }

    // 2. Validate essential fields
    if (!title || !description) {
      res.status(400).json({ error: 'Title and description are required' });
      return;
    }

    let parsedWorkMode: WorkMode = WorkMode.ON_SITE;
    if (workMode && Object.values(WorkMode).includes(workMode as WorkMode)) {
      parsedWorkMode = workMode as WorkMode;
    }

    // 3. Process categories/certifications (Issue #22 - Enforce GRC categories)
    // If certifications array is provided, validate each one against the whitelist
    const validCerts: { name: string }[] = [];
    if (Array.isArray(certifications)) {
      for (const cert of certifications) {
        if (!VALID_GRC_CATEGORIES.includes(cert)) {
          res.status(400).json({ error: `Invalid GRC category provided: ${cert}. Valid categories are: ${VALID_GRC_CATEGORIES.join(', ')}` });
          return;
        }
        validCerts.push({ name: cert });
      }
    }

    // 4. Record new JobPosting in database
    const job = await prisma.job.create({
      data: {
        employerId: employerProfile.id,
        title,
        description,
        location,
        workMode: parsedWorkMode,
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
        status: JobStatus.PUBLISHED, // Draft by default unless indicated? Let's make it published
        certifications: {
          create: validCerts
        }
      },
      include: {
        certifications: true
      }
    });

    res.status(201).json({ message: 'Job created successfully', job });
  } catch (error) {
    console.error('Error creating job posting:', error);
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
