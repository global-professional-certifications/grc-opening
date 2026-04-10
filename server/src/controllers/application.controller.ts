import { Request, Response } from 'express';
import { PrismaClient, ApplicationStatus } from '@prisma/client';

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

    // 2. Enforce Resume Upload requirement
    if (!seekerProfile.resumeUrl) {
      res.status(400).json({ error: 'You must upload a resume before applying to jobs' });
      return;
    }

    // 3. Verify the Job exists and is OPEN
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    if (job.status !== 'PUBLISHED') {
      res.status(400).json({ error: 'This job is no longer accepting applications' });
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

    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (error) {
    console.error('Error applying to job:', error);
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
      include: { job: true }
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

    res.status(200).json({ 
      message: 'Application status updated', 
      application: updatedApplication 
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
