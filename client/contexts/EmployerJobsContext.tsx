/**
 * EmployerJobsContext — Single source of truth for the employer's job list.
 *
 * ─ Frontend-only implementation ─
 * Jobs are stored in localStorage so they survive page reloads.
 * When the real backend is ready, replace the localStorage reads/writes
 * with apiFetch calls inside fetchJobs(), addJob(), and closeJob().
 *
 * API integration points are clearly marked with "// TODO: replace with apiFetch"
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { JobPostingData } from './JobPostingContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmployerJobStatus = 'ACTIVE' | 'CLOSED' | 'DRAFT';

export interface EmployerJob {
  id: string;
  title: string;
  category: string;
  workMode: string;
  jobType: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  undisclosedSalary: boolean;
  description: string;
  responsibilities: string;
  qualifications: string;
  experience: string;
  seniority: string;
  certifications: string[];
  niceToHave: string;
  status: EmployerJobStatus;
  applicantCount: number;
  createdAt: string; // ISO string
}

interface EmployerJobsContextType {
  jobs: EmployerJob[];
  loading: boolean;
  /** Add a newly published job to the list */
  addJob: (data: JobPostingData) => EmployerJob;
  /** Close an active job */
  closeJob: (id: string) => void;
  /** Derived stats */
  activeCount: number;
  closedCount: number;
  totalApplicants: number;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'grc_employer_jobs';

function loadJobsFromStorage(): EmployerJob[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as EmployerJob[];
  } catch {
    return [];
  }
}

function saveJobsToStorage(jobs: EmployerJob[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch {
    // Storage full — fail silently
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const EmployerJobsContext = createContext<EmployerJobsContextType | undefined>(undefined);

export function EmployerJobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount
  // TODO: replace with apiFetch<{ jobs: EmployerJob[] }>('/jobs/my-postings')
  useEffect(() => {
    const stored = loadJobsFromStorage();
    setJobs(stored);
    setLoading(false);
  }, []);

  // Persist whenever jobs change
  useEffect(() => {
    if (!loading) {
      saveJobsToStorage(jobs);
    }
  }, [jobs, loading]);

  /**
   * Converts raw JobPostingData (from the multi-step form) into a full EmployerJob
   * and prepends it to the list (newest first).
   *
   * TODO: when backend is ready:
   *   const res = await apiFetch<{ job: EmployerJob }>('/jobs', {
   *     method: 'POST',
   *     body: JSON.stringify({ ...payload, status: 'ACTIVE' }),
   *   });
   *   setJobs(prev => [res.job, ...prev]);
   */
  const addJob = useCallback((data: JobPostingData): EmployerJob => {
    const newJob: EmployerJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: data.title.trim(),
      category: data.category,
      workMode: data.workMode,
      jobType: data.jobType,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      currency: data.currency,
      undisclosedSalary: data.undisclosedSalary,
      description: data.description,
      responsibilities: data.responsibilities,
      qualifications: data.qualifications,
      experience: data.experience,
      seniority: data.seniority,
      certifications: data.certifications,
      niceToHave: data.niceToHave,
      status: 'ACTIVE',
      applicantCount: 0,
      createdAt: new Date().toISOString(),
    };

    setJobs((prev) => [newJob, ...prev]);
    return newJob;
  }, []);

  /**
   * Close a job by id.
   * TODO: replace with apiFetch(`/jobs/${id}/close`, { method: 'PATCH' })
   */
  const closeJob = useCallback((id: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: 'CLOSED' as EmployerJobStatus } : j))
    );
  }, []);

  const activeCount = jobs.filter((j) => j.status === 'ACTIVE').length;
  const closedCount = jobs.filter((j) => j.status === 'CLOSED').length;
  const totalApplicants = jobs.reduce((sum, j) => sum + j.applicantCount, 0);

  return (
    <EmployerJobsContext.Provider
      value={{ jobs, loading, addJob, closeJob, activeCount, closedCount, totalApplicants }}
    >
      {children}
    </EmployerJobsContext.Provider>
  );
}

export function useEmployerJobs() {
  const ctx = useContext(EmployerJobsContext);
  if (!ctx) throw new Error('useEmployerJobs must be used within EmployerJobsProvider');
  return ctx;
}
