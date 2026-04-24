import { Queue } from 'bullmq';
import { getRedisConnection, isRedisAvailable } from '../config/redis';

// =====================================
// QUEUE DEFINITIONS
// =====================================

export const RESUME_QUEUE_NAME = 'resume.parse';

let _resumeQueue: Queue | null = null;

/**
 * Get the BullMQ queue instance (lazy — only creates when Redis is available).
 */
function getResumeQueue(): Queue | null {
  if (_resumeQueue) return _resumeQueue;

  const connection = getRedisConnection();
  if (!connection) return null;

  _resumeQueue = new Queue(RESUME_QUEUE_NAME, {
    connection,
    skipVersionCheck: true,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // 5s → 10s → 20s
      },
      removeOnComplete: {
        count: 1000,  // Keep last 1000 completed jobs for debugging
        age: 86400,   // Remove completed jobs after 24h
      },
      removeOnFail: {
        count: 5000,  // Keep more failed jobs for analysis
        age: 604800,  // 7 days
      },
    },
  });

  return _resumeQueue;
}

// =====================================
// JOB PRODUCER
// =====================================

export interface ResumeParseJobPayload {
  resumeId: string;
  userId: string;
  seekerId: string;
  fileUrl: string;
}

/**
 * Enqueues a resume parsing job.
 * Called by the API after file upload and DB record creation.
 * 
 * Returns the BullMQ job if Redis is available, or null if not.
 * When Redis is unavailable, the resume stays in PENDING status
 * and can be retried when Redis comes online.
 */
export async function enqueueResumeParse(payload: ResumeParseJobPayload) {
  const available = await isRedisAvailable();
  if (!available) {
    console.warn(`⚠️  Redis unavailable — resume ${payload.resumeId} saved but not queued for parsing.`);
    console.warn(`   Start Redis and the job will be processed when the resume is re-uploaded or manually queued.`);
    return null;
  }

  const queue = getResumeQueue();
  if (!queue) return null;

  const job = await queue.add('parse', payload, {
    jobId: `resume-${payload.resumeId}`, // Prevents duplicate processing
  });

  console.log(`📋 Resume parse job enqueued: ${job.id} for resume ${payload.resumeId}`);
  return job;
}
