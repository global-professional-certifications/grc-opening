import { Request, Response } from 'express';
import { PrismaClient, ApplicationStatus } from '@prisma/client';
import { notifyNewApplication, notifyApplicationStatusChange } from '../services/notification.service';

const prisma = new PrismaClient();

// ==========================================
// SEEKER: Apply to Job
// ==========================================
export const applyToJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const jobId = req.params.id as string; // Job ID
    const { notes } = req.body;

    // 1. Get Seeker Profile
    const seekerProfile = await prisma.seekerProfile.findUnique({
      where: { userId }
    });

    if (!seekerProfile) {
      res.status(404).json({ error: 'Seeker profile not found' });
      return;
    }

    // 2. Verify the Job exists and is OPEN
    const job = await prisma.job.findUnique({ 
      where: { id: jobId },
      include: { employer: true }
    });
    
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    if (job.status !== 'PUBLISHED') {
      res.status(400).json({ error: 'This job is no longer accepting applications' });
      return;
    }

    if (job.deadline && job.deadline.getTime() < Date.now()) {
      res.status(400).json({ error: 'This job is no longer accepting applications (deadline passed)' });
      return;
    }

    // 4. Ensure Seeker hasn't already applied (Handled automatically by Prisma unique constraint, but we can catch it here cleanly)
    const existingApplication = await prisma.application.findFirst({
      where: {
        jobId: job.id,
        seekerId: seekerProfile.id
      }
    });

    if (existingApplication) {
      res.status(409).json({ error: 'You have already applied to this job' });
      return;
    }

    // 5. Create the Application
    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        seekerId: seekerProfile.id,
        notes,
        status: ApplicationStatus.PENDING
      }
    });

    const seekerFullName = `${seekerProfile.firstName} ${seekerProfile.lastName}`.trim();
    notifyNewApplication(job.employer.userId, seekerFullName, job.id, job.title).catch(console.error);

    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (error) {
    console.error('Error applying to job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// SEEKER: View Stats
// ==========================================
export const getSeekerStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const seekerProfile = await prisma.seekerProfile.findUnique({
      where: { userId }
    });

    if (!seekerProfile) {
      res.status(404).json({ error: 'Seeker profile not found' });
      return;
    }

    const [applicationsCount, savedJobsCount, positiveCount] = await Promise.all([
      prisma.application.count({ where: { seekerId: seekerProfile.id } }),
      prisma.savedJob.count({ where: { seekerId: seekerProfile.id } }),
      prisma.application.count({
        where: {
          seekerId: seekerProfile.id,
          status: { in: [ApplicationStatus.REVIEWING, ApplicationStatus.INTERVIEWING, ApplicationStatus.HIRED] },
        },
      }),
    ]);

    const responseRate = applicationsCount > 0
      ? Math.round((positiveCount / applicationsCount) * 100)
      : 0;

    res.status(200).json({
      stats: {
        applicationsSent: applicationsCount,
        profileViews: 0,
        savedJobs: savedJobsCount,
        responseRate,
      },
    });
  } catch (error) {
    console.error('Error fetching seeker stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// SEEKER: View My Applications
// ==========================================
export const getMyApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // 1. Get Seeker Profile
    const seekerProfile = await prisma.seekerProfile.findUnique({
      where: { userId }
    });

    if (!seekerProfile) {
      res.status(404).json({ error: 'Seeker profile not found' });
      return;
    }

    // 2. Fetch applications with job and employer info
    const applications = await prisma.application.findMany({
      where: { seekerId: seekerProfile.id },
      include: {
        job: {
          select: {
            title: true,
            employer: {
              select: {
                companyName: true
              }
            }
          }
        }
      },
      orderBy: { appliedAt: 'desc' },
      take: 20 // Reasonable limit for recent applications
    });

    res.status(200).json({ applications });
  } catch (error) {
    console.error('Error fetching my applications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// EMPLOYER: View All Applications Across All Jobs
// ==========================================
export const getEmployerApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const employerProfile = await prisma.employerProfile.findUnique({ where: { userId } });
    if (!employerProfile) {
      res.status(404).json({ error: 'Employer profile not found' });
      return;
    }

    const jobIdFilter = typeof req.query.jobId === 'string' ? req.query.jobId : undefined;

    const applications = await prisma.application.findMany({
      where: {
        job: { employerId: employerProfile.id },
        ...(jobIdFilter ? { jobId: jobIdFilter } : {}),
      },
      orderBy: { appliedAt: 'desc' },
      take: 50,
      include: {
        job: { select: { id: true, title: true } },
        seeker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            headline: true,
            location: true,
            phone: true,
            certifications: { select: { name: true } },
            user: { select: { email: true } },
          } as any,
        },
      },
    });

    const result = (applications as any[]).map((a: any) => ({
      id: a.id,
      status: a.status,
      appliedAt: a.appliedAt,
      notes: a.notes,
      jobId: a.job.id,
      jobTitle: a.job.title,
      seekerId: a.seeker.id,
      seekerName: `${a.seeker.firstName} ${a.seeker.lastName}`.trim(),
      seekerEmail: a.seeker.user.email,
      seekerPhone: a.seeker.phone ?? '',
      seekerHeadline: a.seeker.headline ?? '',
      seekerLocation: a.seeker.location ?? '',
      certifications: a.seeker.certifications.map((c: any) => c.name),
    }));

    res.status(200).json({ applications: result });
  } catch (error) {
    console.error('Error fetching employer applications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// EMPLOYER: View Single Applicant Detail
// ==========================================
export const getApplicationDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const applicationId = req.params.id as string;

    const employerProfile = await prisma.employerProfile.findUnique({ where: { userId } });
    if (!employerProfile) {
      res.status(404).json({ error: 'Employer profile not found' });
      return;
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: { select: { id: true, title: true, employerId: true } },
        seeker: {
          include: {
            user:            { select: { email: true, createdAt: true, role: true } },
            skills:          { select: { name: true } },
            certifications:  { select: { name: true }, orderBy: { sortOrder: 'asc' } },
            workExperiences: { orderBy: { sortOrder: 'asc' } },
            educations:      { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });

    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    if (application.job.employerId !== employerProfile.id) {
      res.status(403).json({ error: 'Unauthorized to view this application' });
      return;
    }

    const s = application.seeker;
    const fullName = `${s.firstName} ${s.middleName ? s.middleName + ' ' : ''}${s.lastName}`.replace(/\s+/g, ' ').trim();

    res.status(200).json({
      application: {
        id:        application.id,
        status:    application.status,
        appliedAt: application.appliedAt,
        notes:     application.notes,
        jobId:     application.job.id,
        jobTitle:  application.job.title,
        seeker: {
          id:          s.id,
          fullName,
          firstName:   s.firstName,
          middleName:  s.middleName,
          lastName:    s.lastName,
          email:       s.user.email,
          phone:       (s as any).phone ?? '',
          headline:    s.headline ?? '',
          country:     s.country ?? '',
          location:    s.location ?? '',
          bio:         s.bio ?? '',
          resumeUrl:   s.resumeUrl ?? '',
          linkedInUrl: s.linkedInUrl ?? '',
          avatarUrl:   s.avatarUrl ?? '',
          memberSince: s.user.createdAt,
          skills:          s.skills.map(sk => sk.name),
          certifications:  s.certifications.map(c => c.name),
          workExperiences: s.workExperiences.map(w => ({
            id:          w.id,
            title:       w.title,
            company:     w.company,
            location:    w.location ?? '',
            startDate:   w.startDate,
            endDate:     w.endDate ?? '',
            current:     w.current,
            description: w.description ?? '',
          })),
          educations: (s as any).educations.map((e: any) => ({
            id:          e.id,
            institution: e.institution,
            degree:      e.degree ?? '',
            field:       e.field ?? '',
            gpa:         e.gpa ?? '',
            startDate:   e.startDate ?? '',
            endDate:     e.endDate ?? '',
            description: e.description ?? '',
          })),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching application detail:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// EMPLOYER: View Applications
// ==========================================
export const getJobApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const jobId = req.params.id as string; // Job ID

    // 1. Get Employer Profile
    const employerProfile = await prisma.employerProfile.findUnique({
      where: { userId }
    });

    if (!employerProfile) {
      res.status(404).json({ error: 'Employer profile not found' });
      return;
    }

    // 2. Ensure they own the Job
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    
    if (!job || job.employerId !== employerProfile.id) {
      res.status(403).json({ error: 'Unauthorized to view these applications' });
      return;
    }

    // 3. Fetch applications and include the seeker's profile
    const applications = await prisma.application.findMany({
      where: { jobId },
      include: {
        seeker: {
          include: {
            user: { select: { email: true } } // Allow employer to see applicant's email
          }
        }
      },
      orderBy: { appliedAt: 'desc' }
    });

    res.status(200).json({ applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// EMPLOYER: Update Application Status
// ==========================================
export const updateApplicationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const applicationId = req.params.id as string;
    const { status } = req.body;

    // 1. Validate status mapping
    if (!status || !Object.keys(ApplicationStatus).includes(status)) {
      res.status(400).json({ error: 'Invalid application status provided' });
      return;
    }

    // 2. Get Employer Profile
    const employerProfile = await prisma.employerProfile.findUnique({
      where: { userId }
    });

    if (!employerProfile) {
      res.status(404).json({ error: 'Employer profile not found' });
      return;
    }

    // 3. Find the application and ensure the employer owns the parent Job
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true, seeker: true }
    });

    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    if (application.job.employerId !== employerProfile.id) {
      res.status(403).json({ error: 'Unauthorized to modify this application' });
      return;
    }

    // 4. Update the state
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { status: status as ApplicationStatus }
    });

    notifyApplicationStatusChange(
      application.seeker.userId, 
      applicationId, 
      application.job.id,
      application.job.title, 
      employerProfile.companyName, 
      status
    ).catch(console.error);

    res.status(200).json({ 
      message: 'Application status updated', 
      application: updatedApplication 
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// SEEKER: Withdraw Application
// ==========================================
export const withdrawApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const applicationId = String(req.params.id);

    const seekerProfile = await prisma.seekerProfile.findUnique({ where: { userId } });
    if (!seekerProfile) {
      res.status(404).json({ error: 'Seeker profile not found' });
      return;
    }

    const application = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    if (application.seekerId !== seekerProfile.id) {
      res.status(403).json({ error: 'Not authorized to withdraw this application' });
      return;
    }
    if (application.status !== ApplicationStatus.PENDING) {
      res.status(400).json({ error: 'Only pending applications can be withdrawn' });
      return;
    }

    await prisma.application.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.WITHDRAWN },
    });

    res.status(200).json({ message: 'Application withdrawn successfully' });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// SEEKER: Report a Job
// ==========================================
export const reportJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const jobId = String(req.params.id);
    const { reason, description } = req.body;

    const validReasons = ['SPAM', 'MISLEADING', 'INAPPROPRIATE', 'OTHER'];
    if (!reason || !validReasons.includes(reason)) {
      res.status(400).json({ error: 'Invalid reason. Must be one of: ' + validReasons.join(', ') });
      return;
    }

    const seekerProfile = await prisma.seekerProfile.findUnique({ where: { userId } });
    if (!seekerProfile) {
      res.status(404).json({ error: 'Seeker profile not found' });
      return;
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    await prisma.jobReport.create({
      data: {
        jobId,
        seekerId: seekerProfile.id,
        reason,
        description: description ?? null,
      },
    });

    res.status(201).json({ message: 'Report submitted successfully' });
  } catch (error) {
    console.error('Error reporting job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

