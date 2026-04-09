import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type WorkMode = 'Remote' | 'Hybrid' | 'On-site';
export type JobType = 'Full-time' | 'Contract' | 'Freelance';

export interface JobPostingData {
  title: string;
  category: string;
  workMode: WorkMode | '';
  jobType: JobType | '';
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
}

interface JobPostingContextType {
  data: JobPostingData;
  updateData: (updates: Partial<JobPostingData>) => void;
  currentStep: number;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  // Draft system
  saveDraft: () => void;
  clearDraft: () => void;
  draftSavedAt: Date | null;
  isDirty: boolean;
}

const defaultData: JobPostingData = {
  title: '',
  category: '',
  workMode: '',
  jobType: '',
  salaryMin: '',
  salaryMax: '',
  currency: 'USD',
  undisclosedSalary: false,
  description: '',
  responsibilities: '',
  qualifications: '',
  experience: '',
  seniority: '',
  certifications: [],
  niceToHave: '',
};

const DRAFT_STORAGE_KEY = 'grc_job_draft';
const DRAFT_TS_KEY = 'grc_job_draft_ts';

function loadDraft(): JobPostingData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as JobPostingData;
  } catch {
    return null;
  }
}

function loadDraftTimestamp(): Date | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_TS_KEY);
    if (!raw) return null;
    return new Date(raw);
  } catch {
    return null;
  }
}

const JobPostingContext = createContext<JobPostingContextType | undefined>(undefined);

export function JobPostingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<JobPostingData>(defaultData);
  const [currentStep, setCurrentStep] = useState(1);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Restore draft from localStorage on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setData(draft);
      setDraftSavedAt(loadDraftTimestamp());
      setIsDirty(false);
    }
  }, []);

  const updateData = useCallback((updates: Partial<JobPostingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  const saveDraft = useCallback(() => {
    setData((current) => {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(current));
        const now = new Date();
        localStorage.setItem(DRAFT_TS_KEY, now.toISOString());
        setDraftSavedAt(now);
        setIsDirty(false);
      } catch {
        // Storage full or unavailable — fail silently
      }
      return current;
    });
  }, []);

  const clearDraft = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      localStorage.removeItem(DRAFT_TS_KEY);
    }
    setDraftSavedAt(null);
    setIsDirty(false);
  }, []);

  const goToStep = (step: number) => setCurrentStep(step);
  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const reset = useCallback(() => {
    clearDraft();
    setData(defaultData);
    setCurrentStep(1);
  }, [clearDraft]);

  return (
    <JobPostingContext.Provider
      value={{
        data,
        updateData,
        currentStep,
        goToStep,
        nextStep,
        prevStep,
        reset,
        saveDraft,
        clearDraft,
        draftSavedAt,
        isDirty,
      }}
    >
      {children}
    </JobPostingContext.Provider>
  );
}

export function useJobPosting() {
  const context = useContext(JobPostingContext);
  if (context === undefined) {
    throw new Error('useJobPosting must be used within a JobPostingProvider');
  }
  return context;
}
