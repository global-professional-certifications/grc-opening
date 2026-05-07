import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { createRedisConnection } from '../config/redis';
import { RESUME_QUEUE_NAME, ResumeParseJobPayload } from '../queues/resume.queue';
import { parseResume, validateParsedData, ParsedResumeData } from '../services/resume-parser.service';

const prisma = new PrismaClient();

// =====================================
// PROFILE MERGE LOGIC
// =====================================

/**
 * Merge parsed resume data into the seeker's profile.
 * 
 * Rules:
 * - Only fill empty/null fields — never overwrite existing data
 * - Append new skills (don't replace)
 * - Add experience/education entries from resume
 * - Update resumeUrl to point to the latest parsed resume
 */
async function mergeIntoProfile(
  seekerId: string,
  parsedData: ParsedResumeData,
  resumeFilePath: string,
): Promise<void> {
  const profile = await prisma.seekerProfile.findUnique({
    where: { id: seekerId },
    include: {
      skills: true,
      workExperiences: true,
      educations: true,
    },
  });

  if (!profile) {
    console.warn(`[ResumeWorker] SeekerProfile not found for id=${seekerId}, skipping profile merge`);
    return;
  }

  // Build partial update — only fill empty fields
  const profileUpdate: Record<string, any> = {};

  // Fill name parts if empty
  if (parsedData.name && !profile.firstName) {
    const nameParts = parsedData.name.split(/\s+/);
    if (nameParts.length >= 2) {
      profileUpdate.firstName = nameParts[0];
      profileUpdate.lastName = nameParts[nameParts.length - 1];
      if (nameParts.length >= 3) {
        profileUpdate.middleName = nameParts.slice(1, -1).join(' ');
      }
    } else if (nameParts.length === 1) {
      profileUpdate.firstName = nameParts[0];
    }
  }

  // Fill phone if empty
  if (parsedData.phone && !profile.phone) {
    profileUpdate.phone = parsedData.phone;
  }

  // Fill location if empty
  if (parsedData.location && !profile.location) {
    profileUpdate.location = parsedData.location;
  }

  // Fill linkedInUrl if empty
  if (parsedData.linkedInUrl && !profile.linkedInUrl) {
    profileUpdate.linkedInUrl = parsedData.linkedInUrl;
  }

  // Update resume URL to latest
  profileUpdate.resumeUrl = resumeFilePath;

  // Apply profile field updates
  if (Object.keys(profileUpdate).length > 0) {
    await prisma.seekerProfile.update({
      where: { id: seekerId },
      data: profileUpdate,
    });
    console.log(`[ResumeWorker] Updated profile fields: ${Object.keys(profileUpdate).join(', ')}`);
  }

  // Merge skills — add new ones, keep existing
  if (parsedData.skills.length > 0) {
    const existingSkillNames = new Set(profile.skills.map(s => s.name.toLowerCase()));
    const newSkills = parsedData.skills.filter(s => !existingSkillNames.has(s.toLowerCase()));

    if (newSkills.length > 0) {
      await prisma.seekerProfile.update({
        where: { id: seekerId },
        data: {
          skills: {
            connectOrCreate: newSkills.map(name => ({
              where: { name },
              create: { name },
            })),
          },
        },
      });
      console.log(`[ResumeWorker] Added ${newSkills.length} new skills to profile`);
    }
  }

  // Add education entries if profile has none
  if (parsedData.education.length > 0 && profile.educations.length === 0) {
    await prisma.education.createMany({
      data: parsedData.education.map((edu, idx) => ({
        seekerId,
        institution: edu.institution,
        degree: edu.degree || null,
        field: edu.field || null,
        startDate: edu.startDate || null,
        endDate: edu.endDate || null,
        description: edu.description || null,
        sortOrder: idx,
      })),
    });
    console.log(`[ResumeWorker] Added ${parsedData.education.length} education entries`);
  }

  // Note: We intentionally do NOT auto-add work experiences from resume parsing
  // because the existing work experience UI has a different data flow.
  // Instead, the parsed experience is stored in Resume.parsedData for the user to review.
}

// =====================================
// JOB PROCESSOR
// =====================================

/**
 * Process a single resume parsing job.
 * 
 * Steps:
 * 1. Update status to PROCESSING
 * 2. Parse the PDF
 * 3. Store parsed data in Resume record
 * 4. Merge into SeekerProfile (cautiously)
 * 5. Update status to COMPLETED
 * 
 * On failure: Update status to FAILED with error message
 */
async function processResumeJob(job: Job<ResumeParseJobPayload>): Promise<void> {
  const { resumeId, userId, seekerId, fileUrl } = job.data;
  
  console.log(`\n🔄 [ResumeWorker] Processing job ${job.id}`);
  console.log(`   Resume: ${resumeId}`);
  console.log(`   User: ${userId}`);
  console.log(`   File: ${fileUrl}`);
  console.log(`   Attempt: ${job.attemptsMade + 1}/${(job.opts?.attempts || 3)}`);

  // Step 1: Mark as PROCESSING
  await prisma.resume.update({
    where: { id: resumeId },
    data: {
      status: 'PROCESSING',
      retryCount: job.attemptsMade,
    },
  });

  // Step 2: Parse the resume
  const parsedData = await parseResume(fileUrl);

  // Step 3: Validate and log warnings
  const warnings = validateParsedData(parsedData);
  if (warnings.length > 0) {
    console.warn(`[ResumeWorker] Parsing warnings for ${resumeId}:`);
    warnings.forEach(w => console.warn(`   ⚠️ ${w}`));
  }

  // Step 4: Store parsed data
  await prisma.resume.update({
    where: { id: resumeId },
    data: {
      status: 'COMPLETED',
      parsedData: parsedData as any,
      errorMessage: warnings.length > 0 ? warnings.join('; ') : null,
      processedAt: new Date(),
    },
  });

  // Step 5: Merge into profile
  await mergeIntoProfile(seekerId, parsedData, fileUrl);

  console.log(`✅ [ResumeWorker] Job ${job.id} completed successfully`);
  console.log(`   Extracted: name="${parsedData.name}", skills=${parsedData.skills.length}, exp=${parsedData.experience.length}, edu=${parsedData.education.length}`);
}

// =====================================
// WORKER SETUP
// =====================================

/**
 * Start the BullMQ worker for resume parsing.
 * This should be run as a separate process from the API server.
 */
export function startResumeWorker(): Worker {
  const connection = createRedisConnection();

  const worker = new Worker<ResumeParseJobPayload>(
    RESUME_QUEUE_NAME,
    async (job) => {
      await processResumeJob(job);
    },
    {
      connection,
      skipVersionCheck: true,
      concurrency: 3, // Process up to 3 resumes simultaneously
      limiter: {
        max: 10,
        duration: 60000, // Max 10 jobs per minute to prevent overload
      },
    },
  );

  // Event handlers
  worker.on('completed', (job) => {
    console.log(`📗 [ResumeWorker] Job ${job.id} completed`);
  });

  worker.on('failed', async (job, err) => {
    console.error(`📕 [ResumeWorker] Job ${job?.id} failed:`, err.message);
    
    // Update resume status to FAILED if no more retries
    if (job && job.attemptsMade >= (job.opts?.attempts || 3)) {
      try {
        await prisma.resume.update({
          where: { id: job.data.resumeId },
          data: {
            status: 'FAILED',
            errorMessage: `Parsing failed after ${job.attemptsMade} attempts: ${err.message}`,
            retryCount: job.attemptsMade,
          },
        });
      } catch (dbErr) {
        console.error(`[ResumeWorker] Failed to update resume status:`, dbErr);
      }
    }
  });

  let lastWorkerError = 0;
  worker.on('error', (err) => {
    // Throttle error logging to once every 30 seconds
    const now = Date.now();
    if (now - lastWorkerError > 30_000) {
      console.error('📕 [ResumeWorker] Worker error:', err.message);
      lastWorkerError = now;
    }
  });

  worker.on('stalled', (jobId) => {
    console.warn(`📙 [ResumeWorker] Job ${jobId} stalled`);
  });

  console.log(`👷 Resume parsing worker started (queue: ${RESUME_QUEUE_NAME})`);
  return worker;
}

// =====================================
// STANDALONE ENTRY POINT
// =====================================

/**
 * If this file is run directly (not imported), start the worker process.
 * Usage: npx tsx src/worker/resume.worker.ts
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
if (require.main === module) {
  // Load environment
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config();
  
  console.log('🚀 Starting Resume Parsing Worker...');
  console.log(`   Redis: ${process.env.REDIS_URL || 'redis://127.0.0.1:6379'}`);
  console.log(`   Database: connected via Prisma`);
  
  const worker = startResumeWorker();

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n🛑 Shutting down worker...');
    await worker.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
