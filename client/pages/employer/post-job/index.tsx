import { useEffect, useRef } from 'react';
import Head from 'next/head';
import { EmployerDashboardLayout } from '../../../components/layout/EmployerDashboardLayout';
import { JobPostingProvider, useJobPosting } from '../../../contexts/JobPostingContext';
import { PostJobProgress } from '../../../modules/employer/post-job/PostJobProgress';
import { Step1Details } from '../../../modules/employer/post-job/Step1Details';
import { Step2Requirements } from '../../../modules/employer/post-job/Step2Requirements';
import { Step3Preview } from '../../../modules/employer/post-job/Step3Preview';

const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const SYNE = { fontFamily: "'Syne', sans-serif" };

// ─── Inner flow (has access to context) ──────────────────────────────────────

function PostJobFlow() {
  const { currentStep, isDirty } = useJobPosting();
  const prevStepRef = useRef(currentStep);

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

  return (
    <div className="w-full relative">
      {/* ── Page title row ── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="text-base font-bold uppercase tracking-widest"
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
