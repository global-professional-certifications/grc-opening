import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { EmployerDashboardLayout } from '../../../components/layout/EmployerDashboardLayout';
import { JobPostingProvider, useJobPosting, JobPostingData, WorkMode, JobType } from '../../../contexts/JobPostingContext';
import { apiFetch } from '@/lib/api';
import { PostJobProgress } from '../../../modules/employer/post-job/PostJobProgress';
import { Step1Details } from '../../../modules/employer/post-job/Step1Details';
import { Step2Requirements } from '../../../modules/employer/post-job/Step2Requirements';
import { Step3Preview } from '../../../modules/employer/post-job/Step3Preview';

const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const SYNE = { fontFamily: "'Syne', sans-serif" };

// ─── Inner flow (has access to context) ──────────────────────────────────────

function PostJobFlow() {
  const { currentStep, isDirty, setData, setEditId, editId } = useJobPosting();
  const router = useRouter();
  const prevStepRef = useRef(currentStep);
  const prefillAttemptedRef = useRef<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    apiFetch<{ profile: { isVerified?: boolean } }>('/profile/employer')
      .then(r => setIsVerified(r.profile?.isVerified ?? false))
      .catch(() => setIsVerified(false));
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    const qEditId = typeof router.query.editId === 'string' ? router.query.editId : null;
    if (!qEditId) {
      if (editId) setEditId(null);
      return;
    }
    if (prefillAttemptedRef.current === qEditId) return;
    prefillAttemptedRef.current = qEditId;
    setEditId(qEditId);
    apiFetch<{ job: {
      title: string; description: string; location: string | null; workMode: string;
      category: string | null; jobType: string | null; seniority: string | null; experience: string | null;
      responsibilities: string | null; qualifications: string | null; niceToHave: string | null;
      currency: string | null; undisclosedSalary: boolean;
      salaryMin: number | null; salaryMax: number | null;
      deadline: string | null;
      certifications: { name: string }[];
    } }>(`/jobs/${qEditId}`).then(res => {
      const j = res.job;
      const wmMap: Record<string, WorkMode> = { REMOTE: 'Remote', HYBRID: 'Hybrid', ON_SITE: 'On-site' };
      const prefilled: JobPostingData = {
        title:              j.title,
        category:           j.category ?? '',
        workMode:           (wmMap[j.workMode] ?? '') as WorkMode | '',
        location:           j.location ?? '',
        jobType:            (j.jobType as JobType) ?? '',
        deadline:           j.deadline ? j.deadline.slice(0, 10) : '',
        salaryMin:          j.salaryMin != null ? String(j.salaryMin) : '',
        salaryMax:          j.salaryMax != null ? String(j.salaryMax) : '',
        currency:           j.currency ?? 'USD',
        undisclosedSalary:  j.undisclosedSalary,
        description:        j.description,
        responsibilities:   j.responsibilities ?? '',
        qualifications:     j.qualifications ?? '',
        experience:         j.experience ?? '',
        seniority:          j.seniority ?? '',
        certifications:     j.certifications.map(c => c.name),
        niceToHave:         j.niceToHave ?? '',
        jdRole:             '',
      };
      setData(prefilled);
    }).catch(err => console.error('Failed to prefill job for edit:', err));
  }, [router.isReady, router.query.editId, setData, setEditId, editId]);

  // Warn on browser close / tab navigate away when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Track step for animation direction
  useEffect(() => {
    prevStepRef.current = currentStep;
  }, [currentStep]);

  const showProgress = currentStep < 3;

  if (isVerified === false) {
    return (
      <div className="w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif", color: 'var(--db-text)' }}>
            Post a Job
          </h1>
        </div>
        <div className="max-w-2xl mx-auto rounded-2xl border border-amber-200 bg-amber-50 p-8 flex flex-col items-center gap-4 text-center">
          <span className="material-symbols-outlined text-amber-500" style={{ fontSize: 48 }}>verified_user</span>
          <h2 className="text-[18px] font-bold text-amber-900">Company Verification Required</h2>
          <p className="text-[14px] text-amber-800 max-w-md leading-relaxed">
            Your company has not been verified yet. An admin must verify your company before you can post jobs.
            Please contact support or check back later.
          </p>
          <a href="mailto:admin@grcopenings.com" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white font-semibold text-[14px] hover:bg-amber-700 transition-all">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>mail</span>
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      {/* ── Page title row ── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "'Syne', sans-serif", color: 'var(--db-text)' }}
          >
            Post a Job
          </h1>
          <p className="text-[11px] mt-0.5" style={{ ...MONO, color: 'var(--db-text-muted)' }}>
            GRC Openings · Employer Portal
          </p>
        </div>

        {isDirty && currentStep < 3 && (
          <span
            className="text-[10px] px-2.5 py-1 rounded-full border animate-pulse"
            style={{
              ...MONO,
              color: '#eab308',
              borderColor: 'rgba(234,179,8,0.3)',
              backgroundColor: 'rgba(234,179,8,0.06)',
            }}
          >
            Unsaved changes
          </span>
        )}
      </div>

      {/* ── Step progress indicator ── */}
      {showProgress && <PostJobProgress currentStep={currentStep} />}

      {/* ── Step panels ── */}
      <div
        key={currentStep}
        style={{ animation: 'stepFadeIn 0.25s ease-out both' }}
      >
        {currentStep === 1 && <Step1Details />}
        {currentStep === 2 && <Step2Requirements />}
        {currentStep === 3 && <Step3Preview />}
      </div>

      {/* ── Watermark ── */}
      {showProgress && (
        <div
          className="text-center mt-10 mb-4 text-[10px] tracking-widest uppercase"
          style={{ ...MONO, color: 'var(--db-text-muted)', opacity: 0.5 }}
        >
          Built for Governance Professionals · Secure Recruitment Portal
        </div>
      )}

      {/* Keyframe animation */}
      <style>{`
        @keyframes stepFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function PostJobPage() {
  useEffect(() => {
    const toggle = document.querySelector<HTMLElement>('.theme-toggle');
    if (toggle) toggle.style.display = 'none';
    return () => {
      if (toggle) toggle.style.display = '';
    };
  }, []);

  return (
    <EmployerDashboardLayout>
      <Head>
        <title>Post a Job | GRC Openings</title>
        <meta name="description" content="Create a new GRC job posting for your organisation." />
      </Head>
      <JobPostingProvider>
        <PostJobFlow />
      </JobPostingProvider>
    </EmployerDashboardLayout>
  );
}
