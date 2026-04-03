import { Request, Response } from 'express';
import { PrismaClient, JobStatus, WorkMode } from '@prisma/client';

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
