import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useJobPosting } from '../../../contexts/JobPostingContext';
import { useEmployerProfile } from '../../../contexts/EmployerProfileContext';
import { useEmployerJobs } from '../../../contexts/EmployerJobsContext';

const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const SYNE = { fontFamily: "'Syne', sans-serif" };

const CATEGORY_LABELS: Record<string, string> = {
  audit:      'Internal Audit',
  compliance: 'Compliance',
  risk:       'Risk Management',
  privacy:    'Data Privacy',
  security:   'Information Security',
  governance: 'Corporate Governance',
  regulatory: 'Regulatory Affairs',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  label,
  onEdit,
}: {
  label: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h4
        className="text-[10px] font-bold tracking-widest uppercase"
        style={{ ...MONO, color: 'var(--db-text-muted)' }}
      >
        {label}
      </h4>
      <button
        type="button"
        onClick={onEdit}
        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md border transition-all hover:border-[var(--db-primary)] hover:text-[var(--db-primary)]"
        style={{ ...MONO, color: 'var(--db-text-muted)', borderColor: 'var(--db-border)' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>edit</span>
        Edit
      </button>
    </div>
  );
}

function PreviewBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
      style={{
        ...MONO,
        backgroundColor: 'rgba(4,255,180,0.08)',
        color: 'var(--db-primary)',
        border: '1px solid rgba(4,255,180,0.2)',
      }}
    >
      {label}
    </span>
  );
}

function MetaPill({ icon, label }: { icon: string; label: string }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
      style={{ backgroundColor: 'var(--db-surface, rgba(255,255,255,0.03))', border: '1px solid var(--db-border)' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--db-primary)' }}>
        {icon}
      </span>
      <span style={{ color: 'var(--db-text-secondary)', fontSize: '13px' }}>{label}</span>
    </div>
  );
}

function TextBlock({ text }: { text: string }) {
  if (!text) {
    return <span style={{ color: 'var(--db-text-muted)', fontStyle: 'italic', fontSize: '14px' }}>Not provided.</span>;
  }
  return (
    <div
      className="prose-sm max-w-none"
      style={{ color: 'var(--db-text-secondary)', fontSize: '14px', lineHeight: '1.7' }}
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ jobId }: { jobId: string }) {
  void jobId;
  return (
    <div className="w-full flex flex-col items-center justify-center py-24 text-center gap-6">
      {/* Animated checkmark ring */}
      <div className="relative w-20 h-20 flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-20"
          style={{ backgroundColor: 'var(--db-primary)' }}
        />
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(4,255,180,0.12)', border: '2px solid var(--db-primary)' }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 40, color: 'var(--db-primary)' }}
          >
            check_circle
          </span>
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold mb-2" style={{ ...SYNE, color: 'var(--db-text)' }}>
          Job Published!
        </h2>
        <p className="text-sm leading-relaxed max-w-sm mx-auto" style={{ color: 'var(--db-text-muted)' }}>
          Your job is now <strong style={{ color: 'var(--db-primary)' }}>live</strong> and visible to candidates on GRC Openings.
        </p>
      </div>

      {/* Active status pill */}
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-full border"
        style={{
          backgroundColor: 'rgba(4,255,180,0.07)',
          borderColor: 'rgba(4,255,180,0.25)',
        }}
      >
        <span
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: 'var(--db-primary)' }}
        />
        <span className="text-sm font-semibold" style={{ ...MONO, color: 'var(--db-primary)' }}>
          ACTIVE
        </span>
      </div>

      <p
        className="text-[11px] animate-pulse tracking-widest uppercase"
        style={{ ...MONO, color: 'var(--db-text-muted)' }}
      >
        Redirecting to My Job Listings…
      </p>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface DuplicateJob { id: string; title: string; score: number }

export function Step2Preview() {
  const { data, prevStep, goToStep, reset, editId } = useJobPosting();
  const { companyName } = useEmployerProfile();
  const { addJob, editJob } = useEmployerJobs();
  const router = useRouter();

  const [isPublishing, setIsPublishing] = useState(false);
  const [showSuccess, setShowSuccess]   = useState(false);
  const [publishedId, setPublishedId]   = useState('');
  const [publishError, setPublishError] = useState<string | null>(null);
  const [duplicates, setDuplicates]     = useState<DuplicateJob[]>([]);
  const hasPublished = useRef(false);

  const salaryDisplay = data.undisclosedSalary
    ? 'Competitive'
    : data.salaryMin || data.salaryMax
    ? `${data.salaryMin || '0'} – ${data.salaryMax || '0'} ${data.currency}`
    : 'Not specified';

  const doPublish = async (force = false) => {
    if (hasPublished.current || isPublishing) return;
    hasPublished.current = true;
    setIsPublishing(true);
    setPublishError(null);
    setDuplicates([]);

    try {
      const savedJob = editId
        ? await editJob(editId, data)
        : await addJob(data, force);
      setPublishedId(savedJob.id);
      setShowSuccess(true);

      setTimeout(() => {
        reset();
        router.push('/employer/jobs');
      }, 3000);
    } catch (err: unknown) {
      hasPublished.current = false;
      const apiErr = err as Error & { code?: string; data?: { duplicates?: DuplicateJob[] } };
      if (apiErr.code === 'DUPLICATE_JOB' && apiErr.data?.duplicates?.length) {
        setDuplicates(apiErr.data.duplicates);
      } else {
        setPublishError(
          err instanceof Error ? err.message : 'Something went wrong. Please try again.'
        );
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublish = () => doPublish(false);
  const handleForcePublish = () => doPublish(true);

  if (showSuccess) return <SuccessScreen jobId={publishedId} />;

  return (
    <div className="w-full flex flex-col gap-6 pb-16">

      {/* ── Page header ── */}
      <div className="mb-1">
        <h2 className="text-2xl font-bold mb-1" style={{ ...SYNE, color: 'var(--db-text)' }}>
          Review your posting
        </h2>
        <p className="text-sm" style={{ color: 'var(--db-text-muted)' }}>
          Everything looks good? Hit &quot;Publish Job&quot; to make it live instantly.
        </p>
      </div>

      {/* ── Preview card ── */}
      <div
        className="rounded-xl border overflow-hidden relative"
        style={{
          backgroundColor: 'var(--db-card)',
          borderColor: 'var(--db-border)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
        }}
      >
        {/* PREVIEW ribbon */}
        <div className="absolute top-0 right-0 overflow-hidden w-24 h-24 z-10 pointer-events-none">
          <div
            className="absolute transform rotate-45 text-[9px] font-bold text-center py-1.5 w-[140px] right-[-35px] top-[22px] tracking-widest"
            style={{
              ...MONO,
              backgroundColor: 'rgba(4,255,180,0.12)',
              color: 'var(--db-primary)',
              borderTop: '1px solid rgba(4,255,180,0.3)',
              borderBottom: '1px solid rgba(4,255,180,0.3)',
            }}
          >
            PREVIEW
          </div>
        </div>

        <div className="divide-y" style={{ borderColor: 'var(--db-border)' }}>

          {/* ── Section 1: Job Overview ── */}
          <div className="p-6">
            <SectionHeader label="Job Overview" onEdit={() => goToStep(1)} />
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold"
                style={{
                  ...MONO,
                  backgroundColor: 'rgba(4,255,180,0.08)',
                  border: '1px solid rgba(4,255,180,0.2)',
                  color: 'var(--db-primary)',
                  fontSize: '11px',
                }}
              >
                {companyName.slice(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  className="text-xl font-bold mb-0.5 truncate"
                  style={{ ...SYNE, color: 'var(--db-text)' }}
                >
                  {data.title || <span style={{ color: 'var(--db-text-muted)', fontStyle: 'italic' }}>Untitled Job</span>}
                </h3>
                <p className="text-sm font-medium mb-3" style={{ color: 'var(--db-primary)' }}>
                  {companyName}
                  {data.category && (
                    <span style={{ color: 'var(--db-text-muted)' }}>
                      {' '}·{' '}{CATEGORY_LABELS[data.category] ?? data.category}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.workMode  && <PreviewBadge label={data.workMode} />}
                  {data.jobType   && <PreviewBadge label={data.jobType} />}
                  {data.seniority && <PreviewBadge label={data.seniority} />}
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 2: Details at a Glance ── */}
          <div className="p-6">
            <SectionHeader label="Details at a Glance" onEdit={() => goToStep(1)} />
            <div className="flex flex-wrap gap-2">
              <MetaPill icon="payments"     label={salaryDisplay} />
              {data.workMode === 'Remote' && <MetaPill icon="wifi"      label="Remote" />}
              {data.workMode === 'Hybrid'  && <MetaPill icon="home_work" label={data.location ? `Hybrid · ${data.location}` : 'Hybrid'} />}
              {data.workMode === 'On-site' && <MetaPill icon="apartment" label={data.location || 'On-site'} />}
              {data.jobType    && <MetaPill icon="schedule"      label={data.jobType} />}
              {data.seniority  && <MetaPill icon="military_tech" label={data.seniority} />}
            </div>
          </div>

          {/* ── Section 3: The Role ── */}
          <div className="p-6">
            <SectionHeader label="The Role" onEdit={() => goToStep(1)} />
            <TextBlock text={data.description} />
          </div>



          {/* ── Section 4: Certifications (conditional) ── */}
          {data.certifications.length > 0 && (
            <div className="p-6">
              <SectionHeader label="Required Certifications" onEdit={() => goToStep(1)} />
              <div className="flex flex-wrap gap-2">
                {data.certifications.map((cert) => (
                  <span
                    key={cert}
                    className="px-3 py-1 text-xs rounded-full font-semibold border"
                    style={{ ...MONO, borderColor: 'var(--db-border)', color: 'var(--db-text-secondary)' }}
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Section 5: Nice to Have (conditional) ── */}
          {data.niceToHave.trim() && (
            <div className="p-6">
              <SectionHeader label="Nice to Have" onEdit={() => goToStep(1)} />
              <TextBlock text={data.niceToHave} />
            </div>
          )}
        </div>
      </div>

      {/* ── Duplicate job warning ── */}
      {duplicates.length > 0 && (
        <div className="rounded-xl border p-4 space-y-3" style={{ backgroundColor: 'rgba(234,179,8,0.06)', borderColor: 'rgba(234,179,8,0.35)' }}>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined flex-shrink-0 text-yellow-500" style={{ fontSize: 20 }}>warning</span>
            <div>
              <p className="text-sm font-bold text-yellow-400">Similar job already posted</p>
              <p className="text-xs text-yellow-300/80 mt-0.5">
                We found {duplicates.length} existing posting{duplicates.length > 1 ? 's' : ''} that look similar. Review them below, then decide.
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            {duplicates.map(d => (
              <div key={d.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-black/20">
                <span className="text-xs text-yellow-200 truncate">{d.title}</span>
                <span className="text-[10px] font-bold text-yellow-400 shrink-0">{d.score}% match</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setDuplicates([])}
              className="flex-1 py-2 rounded-lg text-xs font-semibold border transition-all"
              style={{ borderColor: 'rgba(234,179,8,0.4)', color: '#fde68a' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleForcePublish}
              disabled={isPublishing}
              className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
              style={{ background: 'rgba(234,179,8,0.15)', color: '#fde68a', border: '1px solid rgba(234,179,8,0.4)' }}
            >
              Post Anyway
            </button>
          </div>
        </div>
      )}

      {/* ── Error banner ── */}
      {publishError && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl border text-sm"
          style={{ backgroundColor: 'rgba(239,68,68,0.07)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}
        >
          <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 20 }}>error</span>
          {publishError}
        </div>
      )}

      {/* ── CTA buttons ── */}
      <div className="flex flex-col gap-3 pt-1">

        {/* Primary: Publish Job */}
        <button
          type="button"
          onClick={handlePublish}
          disabled={isPublishing}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-base transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--db-primary)', color: '#ffffff', ...MONO }}
        >
          {isPublishing ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              {editId ? 'Saving…' : 'Publishing…'}
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{editId ? 'save' : 'rocket_launch'}</span>
              {editId ? 'Save changes' : 'Publish Job'}
            </>
          )}
        </button>

        {/* Secondary: Back */}
        <button
          type="button"
          onClick={prevStep}
          disabled={isPublishing}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all border hover:bg-white/5 disabled:opacity-40"
          style={{ borderColor: 'var(--db-border)', color: 'var(--db-text-secondary)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>arrow_back</span>
          Back to Edit
        </button>
      </div>

      {/* Footer watermark */}
      <div
        className="text-center text-[10px] tracking-widest uppercase"
        style={{ ...MONO, color: 'var(--db-text-muted)', opacity: 0.5 }}
      >
        Built for governance professionals · Secure recruitment portal
      </div>
    </div>
  );
}
