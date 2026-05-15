import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { apiFetch } from '../lib/api';
import { buildJobPayload } from '../lib/api/jobs';
import { JobPostingData } from './JobPostingContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmployerJobStatus = 'ACTIVE' | 'CLOSED' | 'DRAFT' | 'PENDING_REVIEW' | 'REJECTED';

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
  experience: string;
  seniority: string;
  certifications: string[];
  niceToHave: string;
  status: EmployerJobStatus;
  adminNote?: string | null;
  applicantCount: number;
  createdAt: string;
}

interface EmployerJobsContextType {
  jobs: EmployerJob[];
  loading: boolean;
  addJob: (data: JobPostingData, force?: boolean) => Promise<EmployerJob>;
  editJob: (id: string, data: JobPostingData) => Promise<EmployerJob>;
  closeJob: (id: string) => Promise<void>;
  activeCount: number;
  closedCount: number;
  totalApplicants: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WORKMODE_FROM_API: Record<string, string> = {
  'REMOTE': 'Remote',
  'HYBRID': 'Hybrid',
  'ON_SITE': 'On-site',
};

function mapApiJob(j: any): EmployerJob {
  return {
    id:               j.id,
    title:            j.title,
    category:         j.category ?? '',
    workMode:         WORKMODE_FROM_API[j.workMode] ?? j.workMode,
    jobType:          j.jobType ?? '',
    salaryMin:        String(j.salaryMin ?? ''),
    salaryMax:        String(j.salaryMax ?? ''),
    currency:         j.currency ?? 'USD',
    undisclosedSalary: j.undisclosedSalary ?? false,
    description:      j.description ?? '',
    experience:       j.experience ?? '',
    seniority:        j.seniority ?? '',
    certifications:   j.certifications?.map((c: any) => c.name) ?? [],
    niceToHave:       j.niceToHave ?? '',
    status:           j.status === 'PUBLISHED' ? 'ACTIVE' : j.status === 'CLOSED' ? 'CLOSED' : j.status === 'PENDING_REVIEW' ? 'PENDING_REVIEW' : j.status === 'REJECTED' ? 'REJECTED' : 'DRAFT',
    adminNote:        j.adminNote ?? null,
    applicantCount:   j._count?.applications ?? 0,
    createdAt:        j.createdAt,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const EmployerJobsContext = createContext<EmployerJobsContextType | undefined>(undefined);

export function EmployerJobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ jobs: any[] }>('/jobs/my-postings')
      .then(res => setJobs(res.jobs.map(mapApiJob)))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const addJob = useCallback(async (data: JobPostingData, force = false): Promise<EmployerJob> => {
    const payload = buildJobPayload(data);
    const res = await apiFetch<{ job: any }>('/jobs', {
      method: 'POST',
      body: JSON.stringify({ ...payload, force }),
    });
    const newJob = mapApiJob({ ...res.job, _count: { applications: 0 } });
    setJobs(prev => [newJob, ...prev]);
    return newJob;
  }, []);

  const editJob = useCallback(async (id: string, data: JobPostingData): Promise<EmployerJob> => {
    const payload = buildJobPayload(data);
    const res = await apiFetch<{ job: any }>(`/jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    setJobs(prev => prev.map(j => {
      if (j.id !== id) return j;
      const merged = mapApiJob({ ...res.job, _count: { applications: j.applicantCount } });
      return merged;
    }));
    return mapApiJob({ ...res.job, _count: { applications: 0 } });
  }, []);

  const closeJob = useCallback(async (id: string): Promise<void> => {
    await apiFetch(`/jobs/${id}/close`, { method: 'PATCH' });
    setJobs(prev =>
      prev.map(j => (j.id === id ? { ...j, status: 'CLOSED' as EmployerJobStatus } : j))
    );
  }, []);

  const activeCount = jobs.filter(j => j.status === 'ACTIVE').length;
  const closedCount = jobs.filter(j => j.status === 'CLOSED').length;
  const totalApplicants = jobs.reduce((sum, j) => sum + j.applicantCount, 0);

  return (
    <EmployerJobsContext.Provider
      value={{ jobs, loading, addJob, editJob, closeJob, activeCount, closedCount, totalApplicants }}
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
