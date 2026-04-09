import { apiFetch } from '../api';
import { JobPostingData } from '../../contexts/JobPostingContext';

// ─── Response Types ─────────────────────────────────────────────────────────

export interface JobAPIResponse {
  success: boolean;
  message: string;
  id: string;
}

export interface JobDraftResponse {
  success: boolean;
  message: string;
  draftId: string;
}

// ─── Payload Builder ─────────────────────────────────────────────────────────
// Maps the frontend form state to the exact shape the backend expects.
// Update this function when the API contract changes — nowhere else needs to change.

export function buildJobPayload(data: JobPostingData) {
  return {
    title: data.title.trim(),
    category: data.category,
    workMode: data.workMode,               // 'Remote' | 'Hybrid' | 'On-site'
    jobType: data.jobType,                 // 'Full-time' | 'Contract' | 'Freelance'
    salary: data.undisclosedSalary
      ? { disclosed: false }
      : {
          disclosed: true,
          min: data.salaryMin ? Number(data.salaryMin) : null,
          max: data.salaryMax ? Number(data.salaryMax) : null,
          currency: data.currency,
        },
    description: data.description.trim(),
    responsibilities: data.responsibilities.trim(),
    qualifications: data.qualifications.trim(),
    experience: data.experience || null,
    seniority: data.seniority || null,
    certifications: data.certifications,
    niceToHave: data.niceToHave.trim() || null,
  };
}

// ─── API Functions ────────────────────────────────────────────────────────────
// Each function is commented out with the real call ready to uncomment.
// The mock resolves with the same shape the real API will return.

/**
 * Create a new job posting.
 * Backend: POST /jobs
 */
export async function createJobAPI(data: JobPostingData): Promise<JobAPIResponse> {
  // return apiFetch<JobAPIResponse>('/jobs', {
  //   method: 'POST',
  //   body: JSON.stringify(buildJobPayload(data)),
  // });

  void buildJobPayload(data); // validates shape; remove when real call is uncommented
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: 'Job created successfully', id: 'job_' + Date.now() });
    }, 1200);
  });
}

/**
 * Publish a job directly — status set to ACTIVE immediately (no review queue).
 * Backend: POST /jobs  with body: { ...payload, status: 'ACTIVE' }
 */
export async function publishJobAPI(data: JobPostingData): Promise<JobAPIResponse> {
  // return apiFetch<JobAPIResponse>('/jobs', {
  //   method: 'POST',
  //   body: JSON.stringify({ ...buildJobPayload(data), status: 'ACTIVE' }),
  // });

  void buildJobPayload(data); // validates shape; remove when real call is uncommented
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: 'Job published successfully', id: 'job_' + Date.now() });
    }, 1200);
  });
}

/**
 * @deprecated — kept for backwards compatibility. Use publishJobAPI instead.
 */
export async function submitJobAPI(data: JobPostingData): Promise<JobAPIResponse> {
  return publishJobAPI(data);
}

/**
 * Save the current form state as a draft (status: DRAFT).
 * Backend: POST /jobs/drafts  or  POST /jobs with status=DRAFT
 */
export async function saveJobDraftAPI(data: JobPostingData): Promise<JobDraftResponse> {
  // return apiFetch<JobDraftResponse>('/jobs/drafts', {
  //   method: 'POST',
  //   body: JSON.stringify(buildJobPayload(data)),
  // });

  void buildJobPayload(data); // validates shape; remove when real call is uncommented
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: 'Draft saved', draftId: 'draft_' + Date.now() });
    }, 400);
  });
}

/**
 * Load an existing draft by ID.
 * Backend: GET /jobs/drafts/:draftId
 */
export async function getJobDraftAPI(draftId: string): Promise<JobPostingData | null> {
  // return apiFetch<JobPostingData>(`/jobs/drafts/${draftId}`);
  void draftId;
  return null;
}

/**
 * Delete a draft (e.g. after successful publish).
 * Backend: DELETE /jobs/drafts/:draftId
 */
export async function deleteJobDraftAPI(draftId: string): Promise<void> {
  // return apiFetch<void>(`/jobs/drafts/${draftId}`, { method: 'DELETE' });
  void draftId;
}

// Re-export apiFetch so callers don't need a separate import
export { apiFetch };
