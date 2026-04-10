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
  experienceLevel: string;
  postedAtLabel: string;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  applicationWindowLabel: string;
  applyUrl: string;
  tags: string[];
  verified: boolean;
};

const MOCK_DISCOVERY_JOBS: DiscoveryJob[] = [
  {
    id: 'disc-1',
    companyName: 'Stripe',
    companyLogoText: 'S',
    title: 'Senior Risk & Compliance Manager',
    category: 'Risk Management',
    location: 'Dublin, IE',
    workMode: 'Remote',
    experienceLevel: 'Senior (5-8y)',
    postedAtLabel: 'Posted 2 days ago',
    salaryMin: 110000,
    salaryMax: 135000,
    salaryCurrency: 'USD',
    applicationWindowLabel: 'Closes Mar 15',
    applyUrl: '/dashboard/jobs/apply/disc-1',
    tags: ['CISA', 'SOX', 'GDPR'],
    verified: true,
  },
  {
    id: 'disc-2',
    companyName: 'Revolut',
    companyLogoText: 'R',
    title: 'Head of Information Security Audit',
    category: 'IT Audit',
    location: 'London, UK',
    workMode: 'Hybrid',
    experienceLevel: 'Manager (8y+)',
    postedAtLabel: 'Posted 5 hours ago',
    salaryMin: 145000,
    salaryMax: 180000,
    salaryCurrency: 'USD',
    applicationWindowLabel: 'Closes Apr 02',
    applyUrl: '/dashboard/jobs/apply/disc-2',
    tags: ['IT Audit', 'CRISC', 'PCI DSS'],
    verified: true,
  },
  {
    id: 'disc-3',
    companyName: 'Coinbase',
    companyLogoText: 'C',
    title: 'Global Compliance Analyst',
    category: 'Compliance',
    location: 'New York, US',
    workMode: 'Remote',
    experienceLevel: 'Senior (5-8y)',
    postedAtLabel: 'Posted 1 week ago',
    salaryMin: 95000,
    salaryMax: 115000,
    salaryCurrency: 'USD',
    applicationWindowLabel: 'Open indefinitely',
    applyUrl: '/dashboard/jobs/apply/disc-3',
    tags: ['AML/KYC', 'FINRA'],
    verified: false,
  },
  {
    id: 'disc-4',
    companyName: 'Notion',
    companyLogoText: 'N',
    title: 'Governance, Risk & Controls Lead',
    category: 'Risk Management',
    location: 'San Francisco, US',
    workMode: 'Hybrid',
    experienceLevel: 'Senior (5-8y)',
    postedAtLabel: 'Posted today',
    salaryMin: 130000,
    salaryMax: 162000,
    salaryCurrency: 'USD',
    applicationWindowLabel: 'Closes Apr 10',
    applyUrl: '/dashboard/jobs/apply/disc-4',
    tags: ['ERM', 'Controls Testing'],
    verified: true,
  },
  {
    id: 'disc-5',
    companyName: 'Atlassian',
    companyLogoText: 'A',
    title: 'Privacy & Regulatory Compliance Specialist',
    category: 'Compliance',
    location: 'Bengaluru, IN',
    workMode: 'Remote',
    experienceLevel: 'Senior (5-8y)',
    postedAtLabel: 'Posted 3 days ago',
    salaryMin: 85000,
    salaryMax: 110000,
    salaryCurrency: 'USD',
    applicationWindowLabel: 'Closes Apr 18',
    applyUrl: '/dashboard/jobs/apply/disc-5',
    tags: ['ISO 27701', 'GDPR'],
    verified: true,
  },
  {
    id: 'disc-6',
    companyName: 'Monzo',
    companyLogoText: 'M',
    title: 'Operational Risk Manager',
    category: 'Risk Management',
    location: 'Remote, UK',
    workMode: 'Remote',
    experienceLevel: 'Manager (8y+)',
    postedAtLabel: 'Posted 6 days ago',
    salaryMin: 105000,
    salaryMax: 140000,
    salaryCurrency: 'USD',
    applicationWindowLabel: 'Closes Apr 22',
    applyUrl: '/dashboard/jobs/apply/disc-6',
    tags: ['RCSA', 'Vendor Risk'],
    verified: false,
  },
  {
    id: 'disc-7',
    companyName: 'PwC',
    companyLogoText: 'P',
    title: 'Senior IT Audit Consultant',
    category: 'IT Audit',
    location: 'Mumbai, IN',
    workMode: 'On-site',
    experienceLevel: 'Senior (5-8y)',
    postedAtLabel: 'Posted yesterday',
    salaryMin: 70000,
    salaryMax: 98000,
    salaryCurrency: 'USD',
    applicationWindowLabel: 'Closes Apr 12',
    applyUrl: '/dashboard/jobs/apply/disc-7',
    tags: ['IT Audit', 'SOC 2', 'ISO 27001'],
    verified: true,
  },
  {
    id: 'disc-8',
    companyName: 'HSBC',
    companyLogoText: 'H',
    title: 'Director, Enterprise Compliance Oversight',
    category: 'Compliance',
    location: 'Singapore, SG',
    workMode: 'Hybrid',
    experienceLevel: 'Manager (8y+)',
    postedAtLabel: 'Posted 4 days ago',
    salaryMin: 165000,
    salaryMax: 220000,
    salaryCurrency: 'USD',
    applicationWindowLabel: 'Closes Apr 28',
    applyUrl: '/dashboard/jobs/apply/disc-8',
    tags: ['MAS', 'Conduct Risk'],
    verified: true,
  },
  {
    id: 'disc-9',
    companyName: 'Microsoft',
    companyLogoText: 'M',
    title: 'GRC & Security Architect',
    category: 'Risk Management',
    location: 'Redmond, US',
    workMode: 'Remote',
    experienceLevel: 'Senior (5-8y)',
    postedAtLabel: 'Posted 1 day ago',
    salaryMin: 155000,
    salaryMax: 190000,
    salaryCurrency: 'USD',
    applicationWindowLabel: 'Closes May 15',
    applyUrl: '/dashboard/jobs/apply/disc-9',
    tags: ['NIST', 'Azure', 'Zero Trust'],
    verified: true,
  },
  {
    id: 'disc-10',
    companyName: 'Google',
    companyLogoText: 'G',
    title: 'Privacy Engineering Lead',
    category: 'Compliance',
    location: 'Mountain View, US',
    workMode: 'Hybrid',
    experienceLevel: 'Manager (8y+)',
    postedAtLabel: 'Posted 3 hours ago',
    salaryMin: 170000,
    salaryMax: 215000,
    salaryCurrency: 'USD',
    applicationWindowLabel: 'Closes May 20',
    applyUrl: '/dashboard/jobs/apply/disc-10',
    tags: ['GDPR', 'Privacy by Design'],
    verified: true,
  },
  {
    id: 'disc-11',
    companyName: 'Meta',
    companyLogoText: 'M',
    title: 'Regulatory Compliance Counsel',
    category: 'Compliance',
    location: 'Berlin, DE',
    workMode: 'Remote',
    experienceLevel: 'Senior (5-8y)',
    postedAtLabel: 'Posted 1 week ago',
    salaryMin: 140000,
    salaryMax: 175000,
    salaryCurrency: 'USD',
    applicationWindowLabel: 'Open indefinitely',
    applyUrl: '/dashboard/jobs/apply/disc-11',
    tags: ['Digital Services Act', 'Legal'],
    verified: true,
  },
  {
    id: 'disc-12',
    companyName: 'KPMG',
    companyLogoText: 'K',
    title: 'IT Audit Senior Associate',
    category: 'IT Audit',
    location: 'Toronto, CA',
    workMode: 'On-site',
    experienceLevel: 'Senior (5-8y)',
    postedAtLabel: 'Posted 5 days ago',
    salaryMin: 85000,
    salaryMax: 115000,
    salaryCurrency: 'USD',
    applicationWindowLabel: 'Closes Jun 01',
    applyUrl: '/dashboard/jobs/apply/disc-12',
    tags: ['IT Audit', 'SOC 1', 'ISO 27001'],
    verified: true,
  },
  {
    id: 'disc-13',
    companyName: 'Deloitte',
    companyLogoText: 'D',
    title: 'Risk Transformation Director',
    category: 'Risk Management',
    location: 'London, UK',
    workMode: 'Hybrid',
    experienceLevel: 'Manager (8y+)',
    postedAtLabel: 'Posted 2 days ago',
    salaryMin: 160000,
    salaryMax: 205000,
    salaryCurrency: 'USD',
    applicationWindowLabel: 'Closes May 10',
    applyUrl: '/dashboard/jobs/apply/disc-13',
    tags: ['ERM', 'Digital Risk'],
    verified: true,
  },
  {
    id: 'disc-14',
    companyName: 'Amazon',
    companyLogoText: 'A',
    title: 'Cloud Compliance Specialist',
    category: 'Compliance',
    location: 'Seattle, US',
    workMode: 'Remote',
    experienceLevel: 'Senior (5-8y)',
    postedAtLabel: 'Posted today',
    salaryMin: 130000,
    salaryMax: 165000,
    salaryCurrency: 'USD',
    applicationWindowLabel: 'Open indefinitely',
    applyUrl: '/dashboard/jobs/apply/disc-14',
    tags: ['AWS', 'FedRAMP', 'HIPAA'],
    verified: true,
  },
  {
    id: 'disc-15',
    companyName: 'Goldman Sachs',
    companyLogoText: 'G',
    title: 'AML/KYC Compliance Manager',
    category: 'Compliance',
    location: 'New York, US',
    workMode: 'Hybrid',
    experienceLevel: 'Manager (8y+)',
    postedAtLabel: 'Posted 1 week ago',
    salaryMin: 150000,
    salaryMax: 185000,
    salaryCurrency: 'USD',
    applicationWindowLabel: 'Closes May 30',
    applyUrl: '/dashboard/jobs/apply/disc-15',
    tags: ['FINRA', 'AML', 'KYC'],
    verified: true,
  },
  {
    id: 'disc-16',
    companyName: 'Shopify',
    companyLogoText: 'S',
    title: 'Data Governance Specialist',
    category: 'Risk Management',
    location: 'Ottawa, CA',
    workMode: 'Remote',
    experienceLevel: 'Senior (5-8y)',
    postedAtLabel: 'Posted 3 days ago',
    salaryMin: 95000,
    salaryMax: 125000,
    salaryCurrency: 'USD',
    applicationWindowLabel: 'Closes Jun 15',
    applyUrl: '/dashboard/jobs/apply/disc-16',
    tags: ['Data Privacy', 'Pipelines'],
    verified: true,
  },
  {
    id: 'disc-17',
    companyName: 'Spotify',
    companyLogoText: 'S',
    title: 'Content Risk & Integrity Lead',
    category: 'Risk Management',
    location: 'Stockholm, SE',
    workMode: 'Hybrid',
    experienceLevel: 'Manager (8y+)',
    postedAtLabel: 'Posted 4 days ago',
    salaryMin: 110000,
    salaryMax: 145000,
    salaryCurrency: 'USD',
    applicationWindowLabel: 'Closes Jun 20',
    applyUrl: '/dashboard/jobs/apply/disc-17',
    tags: ['Trust & Safety', 'Audit'],
    verified: true,
  },
  {
    id: 'disc-18',
    companyName: 'Tesla',
    companyLogoText: 'T',
    title: 'Environmental & Safety Compliance Manager',
    category: 'Compliance',
    location: 'Austin, US',
    workMode: 'On-site',
    experienceLevel: 'Manager (8y+)',
    postedAtLabel: 'Posted 6 days ago',
    salaryMin: 120000,
    salaryMax: 155000,
    salaryCurrency: 'USD',
    applicationWindowLabel: 'Closes Jul 01',
    applyUrl: '/dashboard/jobs/apply/disc-18',
    tags: ['OSHA', 'EPA'],
    verified: false,
  },
  {
    id: 'disc-19',
    companyName: 'TikTok',
    companyLogoText: 'T',
    title: 'Global Trust & Safety Policy Analyst',
    category: 'Risk Management',
    location: 'Singapore, SG',
    workMode: 'Hybrid',
    experienceLevel: 'Senior (5-8y)',
    postedAtLabel: 'Posted yesterday',
    salaryMin: 105000,
    salaryMax: 135000,
    salaryCurrency: 'USD',
    applicationWindowLabel: 'Closes Jul 05',
    applyUrl: '/dashboard/jobs/apply/disc-19',
    tags: ['Policy', 'Governance'],
    verified: true,
  },
  {
    id: 'disc-20',
    companyName: 'Binance',
    companyLogoText: 'B',
    title: 'Crypto Regulatory Compliance Officer',
    category: 'Compliance',
    location: 'Dubai, AE',
    workMode: 'Remote',
    experienceLevel: 'Senior (5-8y)',
    postedAtLabel: 'Posted 2 days ago',
    salaryMin: 140000,
    salaryMax: 180000,
    salaryCurrency: 'USD',
    applicationWindowLabel: 'Open indefinitely',
    applyUrl: '/dashboard/jobs/apply/disc-20',
    tags: ['VARA', 'Crypto Compliance'],
    verified: true,
  },
  {
    id: 'disc-21',
    companyName: 'JPMorgan Chase',
    companyLogoText: 'J',
    title: 'Technology Audit Manager',
    category: 'IT Audit',
    location: 'Hong Kong, HK',
    workMode: 'Hybrid',
    experienceLevel: 'Manager (8y+)',
    postedAtLabel: 'Posted 1 day ago',
    salaryMin: 125000,
    salaryMax: 160000,
    salaryCurrency: 'USD',
    applicationWindowLabel: 'Closes Jun 30',
    applyUrl: '/dashboard/jobs/apply/disc-21',
    tags: ['IT Audit', 'Cloud Security', 'FinTech'],
    verified: true,
  },
  {
    id: 'disc-22',
    companyName: 'EY',
    companyLogoText: 'E',
    title: 'Senior Manager - IT Risk & Audit',
    category: 'IT Audit',
    location: 'Sydney, AU',
    workMode: 'On-site',
    experienceLevel: 'Manager (8y+)',
    postedAtLabel: 'Posted 2 days ago',
    salaryMin: 145000,
    salaryMax: 185000,
    salaryCurrency: 'USD',
    applicationWindowLabel: 'Closes Jul 15',
    applyUrl: '/dashboard/jobs/apply/disc-22',
    tags: ['IT Audit', 'CISA', 'GRC Tech'],
    verified: true,
  },
];

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

export const getDiscoveryJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = Array.from(new Set(MOCK_DISCOVERY_JOBS.map((job) => job.category)));
    const workModes = Array.from(new Set(MOCK_DISCOVERY_JOBS.map((job) => job.workMode)));
    const experienceLevels = Array.from(new Set(MOCK_DISCOVERY_JOBS.map((job) => job.experienceLevel)));

    res.status(200).json({
      jobs: MOCK_DISCOVERY_JOBS,
      filters: {
        categories,
        workModes,
        experienceLevels,
        salaryRange: {
          min: Math.min(...MOCK_DISCOVERY_JOBS.map((job) => job.salaryMin)),
          max: Math.max(...MOCK_DISCOVERY_JOBS.map((job) => job.salaryMax)),
        },
      },
      meta: {
        totalJobs: MOCK_DISCOVERY_JOBS.length,
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
