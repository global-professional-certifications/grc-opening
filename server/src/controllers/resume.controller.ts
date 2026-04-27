import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { enqueueResumeParse } from '../queues/resume.queue';

const prisma = new PrismaClient();

// =====================================
// UPLOAD RESUME
// =====================================

/**
 * POST /resume/upload
 * 
 * Handles resume file upload for job seekers.
 * 
 * Flow:
 * 1. Multer middleware stores file on disk
 * 2. Create Resume record in DB (status: PENDING)
 * 3. Enqueue parsing job to BullMQ
 * 4. Return 202 Accepted with resumeId
 * 
 * The actual parsing happens asynchronously in the worker process.
 */
export const uploadResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id!;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No file uploaded. Please upload a PDF resume.' });
      return;
    }

    // Find the seeker profile
    const profile = await prisma.seekerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      res.status(404).json({ error: 'Seeker profile not found. Please complete registration first.' });
      return;
    }

    // Create Resume record
    const resume = await prisma.resume.create({
      data: {
        seekerId: profile.id,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        status: 'PENDING',
      },
    });

    // Enqueue parsing job
    await enqueueResumeParse({
      resumeId: resume.id,
      userId,
      seekerId: profile.id,
      fileUrl: file.path,
    });

    res.status(202).json({
      message: 'Resume uploaded successfully. Parsing in progress.',
      resumeId: resume.id,
      status: 'PENDING',
    });

  } catch (error: any) {
    console.error('[ResumeController] Upload error:', error);

    // Handle multer-specific errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: 'File too large. Maximum size is 5MB.' });
      return;
    }

    res.status(500).json({ error: 'Failed to upload resume. Please try again.' });
  }
};

// =====================================
// GET RESUME STATUS
// =====================================

/**
 * GET /resume/:id/status
 * 
 * Check the parsing status of a resume.
 * Returns status + parsed data if completed.
 */
export const getResumeStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id!;
    const id = req.params.id as string;

    const profile = await prisma.seekerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      res.status(404).json({ error: 'Seeker profile not found' });
      return;
    }

    const resume = await prisma.resume.findFirst({
      where: {
        id,
        seekerId: profile.id,
      },
    });

    if (!resume) {
      res.status(404).json({ error: 'Resume not found' });
      return;
    }

    const response: Record<string, any> = {
      id: resume.id,
      originalName: resume.originalName,
      status: resume.status,
      createdAt: resume.createdAt,
      processedAt: resume.processedAt,
    };

    if (resume.status === 'COMPLETED') {
      response.parsedData = resume.parsedData;
    }

    if (resume.status === 'FAILED') {
      response.errorMessage = resume.errorMessage;
      response.retryCount = resume.retryCount;
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('[ResumeController] Status check error:', error);
    res.status(500).json({ error: 'Failed to fetch resume status' });
  }
};

// =====================================
// LIST RESUMES
// =====================================

/**
 * GET /resume
 * 
 * List all resumes for the authenticated seeker.
 */
export const listResumes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id!;

    const profile = await prisma.seekerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      res.status(404).json({ error: 'Seeker profile not found' });
      return;
    }

    const resumes = await prisma.resume.findMany({
      where: { seekerId: profile.id },
      select: {
        id: true,
        originalName: true,
        fileSize: true,
        status: true,
        createdAt: true,
        processedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ resumes });

  } catch (error) {
    console.error('[ResumeController] List error:', error);
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
};

// =====================================
// GET PARSED DATA
// =====================================

/**
 * GET /resume/:id/parsed
 * 
 * Get the full parsed data for a completed resume.
 */
export const getParsedData = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id!;
    const id = req.params.id as string;

    const profile = await prisma.seekerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      res.status(404).json({ error: 'Seeker profile not found' });
      return;
    }

    const resume = await prisma.resume.findFirst({
      where: {
        id,
        seekerId: profile.id,
        status: 'COMPLETED',
      },
    });

    if (!resume) {
      res.status(404).json({ error: 'Parsed resume not found. It may still be processing.' });
      return;
    }

    res.status(200).json({
      resumeId: resume.id,
      originalName: resume.originalName,
      parsedData: resume.parsedData,
      processedAt: resume.processedAt,
    });

  } catch (error) {
    console.error('[ResumeController] Get parsed data error:', error);
    res.status(500).json({ error: 'Failed to fetch parsed data' });
  }
};

// =====================================
// DELETE RESUME
// =====================================

/**
 * DELETE /resume/:id
 * 
 * Delete a resume record (and optionally the file).
 */
export const deleteResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id!;
    const id = req.params.id as string;

    const profile = await prisma.seekerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      res.status(404).json({ error: 'Seeker profile not found' });
      return;
    }

    const resume = await prisma.resume.findFirst({
      where: {
        id,
        seekerId: profile.id,
      },
    });

    if (!resume) {
      res.status(404).json({ error: 'Resume not found' });
      return;
    }

    // Delete file from disk
    try {
      const fs = await import('fs');
      if (fs.existsSync(resume.filePath)) {
        fs.unlinkSync(resume.filePath);
      }
    } catch (fsErr) {
      console.warn(`[ResumeController] Could not delete file: ${resume.filePath}`, fsErr);
    }

    // Delete DB record
    await prisma.resume.delete({ where: { id: id as string } });

    res.status(200).json({ message: 'Resume deleted successfully' });

  } catch (error) {
    console.error('[ResumeController] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
};
