import { useState, useCallback } from 'react';
import { useJobPosting } from '../../../contexts/JobPostingContext';
import { Input } from '../../../components/forms/Input';
import { Select } from '../../../components/forms/Select';
import { RadioGroup } from '../../../components/forms/RadioGroup';
import { RichTextarea, extractText } from '../../../components/forms/RichTextarea';
import { saveJobDraftAPI } from '../../../lib/api/jobs';

const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const SYNE = { fontFamily: "'Syne', sans-serif" };

const CATEGORIES = [
  { value: '',            label: 'Select a category' },
  { value: 'audit',      label: 'Internal Audit' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'risk',       label: 'Risk Management' },
  { value: 'privacy',    label: 'Data Privacy' },
  { value: 'security',   label: 'Information Security' },
  { value: 'governance', label: 'Corporate Governance' },
  { value: 'regulatory', label: 'Regulatory Affairs' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD', symbol: '$'  },
  { value: 'EUR', label: 'EUR', symbol: '€'  },
  { value: 'GBP', label: 'GBP', symbol: '£'  },
  { value: 'INR', label: 'INR', symbol: '₹'  },
  { value: 'CAD', label: 'CAD', symbol: 'C$' },
  { value: 'AUD', label: 'AUD', symbol: 'A$' },
];

type DraftState = 'idle' | 'saving' | 'saved' | 'error';

// ── Shared helpers ────────────────────────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border p-5 flex flex-col gap-5"
      style={{ backgroundColor: 'var(--db-card)', borderColor: 'var(--db-border)' }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-bold tracking-widest uppercase mb-0"
      style={{ ...MONO, color: 'var(--db-text-muted)' }}
    >
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="block mb-1.5 text-[10px] font-bold tracking-widest uppercase"
      style={{ ...MONO, color: 'var(--db-text-muted)' }}
    >
      {children}
    </span>
  );
}

function ErrLine({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-xs mt-1.5" style={{ color: '#f87171' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>error</span>
      {msg}
    </p>
  );
}

function validate(data: ReturnType<typeof useJobPosting>['data']) {
  const errors: Record<string, string> = {};
  if (!data.title.trim())             errors.title       = 'Job title is required';
  if (!data.category)                 errors.category    = 'Please select a category';
  if (!data.workMode)                 errors.workMode    = 'Please select a work mode';
  if (!data.jobType)                  errors.jobType     = 'Please select a job type';
  if (!extractText(data.description)) errors.description = 'Job description is required';
  if (
    !data.undisclosedSalary &&
    data.salaryMin &&
    data.salaryMax &&
    Number(data.salaryMin) >= Number(data.salaryMax)
  ) {
    errors.salary = 'Minimum salary must be less than maximum';
  }
  return errors;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Step1Details() {
  const { data, updateData, nextStep, saveDraft, draftSavedAt } = useJobPosting();
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [draftState, setDraftState] = useState<DraftState>('idle');

  const descTextLen = extractText(data.description).length;

  const currencySymbol =
    CURRENCIES.find((c) => c.value === data.currency)?.symbol ?? data.currency;

  const handleNext = () => {
    const newErrors = validate(data);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstKey = Object.keys(newErrors)[0];
      document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setErrors({});
    nextStep();
  };

  const handleSaveDraft = useCallback(async () => {
    setDraftState('saving');
    try {
      await saveJobDraftAPI(data);
      saveDraft();
      setDraftState('saved');
      setTimeout(() => setDraftState('idle'), 3000);
    } catch {
      setDraftState('error');
      setTimeout(() => setDraftState('idle'), 3000);
    }
  }, [data, saveDraft]);

  const draftLabel = () => {
    if (draftState === 'saving') return 'Saving…';
    if (draftState === 'saved')  return 'Draft saved ✓';
    if (draftState === 'error')  return 'Save failed — retry';
    if (draftSavedAt)
      return `Last saved ${draftSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return 'Save Draft';
  };

  const draftColor = () => {
    if (draftState === 'saved') return 'var(--db-primary)';
    if (draftState === 'error') return '#f87171';
    return 'var(--db-text-muted)';
  };

  const salaryInputCls =
    'w-full pl-8 pr-3 py-2.5 border rounded-lg bg-transparent text-sm outline-none transition-all focus:ring-1 focus:ring-[var(--db-primary)] focus:border-[var(--db-primary)]';

  return (
    <div className="w-full flex flex-col gap-6 pb-12">

      {/* ── Page heading ── */}
      <div className="mb-1">
        <h2 className="text-2xl font-bold mb-1" style={{ ...SYNE, color: 'var(--db-text)' }}>
          Tell us about the role
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--db-text-muted)' }}>
          Start with the basics — title, type, and compensation for this GRC position.
        </p>
      </div>

      {/* ── Section 1: Basic Info ── */}
      <SectionCard>
        <SectionTitle>Basic Information</SectionTitle>

        <div className="flex flex-col gap-5">
          {/* Job Title */}
          <div id="field-title">
            <Input
              id="job-title"
              label="JOB TITLE"
              placeholder="e.g. Senior Compliance Officer"
              value={data.title}
              onChange={(e) => updateData({ title: e.target.value })}
              error={errors.title}
            />
          </div>

          {/* Category */}
          <div id="field-category">
            <Select
              id="job-category"
              label="JOB CATEGORY"
              options={CATEGORIES}
              value={data.category}
              onChange={(e) => updateData({ category: e.target.value })}
            />
            <ErrLine msg={errors.category} />
          </div>
        </div>
      </SectionCard>

      {/* ── Section 2: Work Mode + Job Type ── */}
      <SectionCard>
        <SectionTitle>Work Arrangement</SectionTitle>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div id="field-workMode" className="flex flex-col gap-2">
            <label className="grc-label" style={{ ...MONO }}>WORK MODE</label>
            <RadioGroup
              options={[
                { label: 'Remote',  value: 'Remote'  },
                { label: 'Hybrid',  value: 'Hybrid'  },
                { label: 'On-site', value: 'On-site' },
              ]}
              value={data.workMode}
              onChange={(val) => updateData({ workMode: val as typeof data.workMode })}
            />
            <ErrLine msg={errors.workMode} />
          </div>

          <div id="field-jobType" className="flex flex-col gap-2">
            <label className="grc-label" style={{ ...MONO }}>JOB TYPE</label>
            <RadioGroup
              options={[
                { label: 'Full-time', value: 'Full-time' },
                { label: 'Contract',  value: 'Contract'  },
                { label: 'Freelance', value: 'Freelance' },
              ]}
              value={data.jobType}
              onChange={(val) => updateData({ jobType: val as typeof data.jobType })}
            />
            <ErrLine msg={errors.jobType} />
          </div>
        </div>
      </SectionCard>

      {/* ── Section 3: Salary ── */}
      <SectionCard>
        <div className="flex items-center justify-between">
          <SectionTitle>Salary &amp; Compensation</SectionTitle>
          {data.undisclosedSalary && (
            <span
              className="text-[10px] px-2.5 py-1 rounded-full border"
              style={{
                ...MONO,
                color: 'var(--db-primary)',
                borderColor: 'rgba(4,255,180,0.3)',
                backgroundColor: 'rgba(4,255,180,0.07)',
              }}
            >
              Competitive
            </span>
          )}
        </div>

        <div id="field-salary" className="flex flex-col gap-4">
          {/* Min — Max — Currency row */}
          <div className="flex items-end gap-3">

            {/* Minimum */}
            <div className="flex-1">
              <FieldLabel>Minimum</FieldLabel>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none pointer-events-none"
                  style={{ ...MONO, color: 'var(--db-text-muted)' }}
                >
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  className={salaryInputCls}
                  style={{
                    borderColor: errors.salary ? '#f87171' : 'var(--db-border)',
                    color: 'var(--db-text)',
                    fontFamily: "'JetBrains Mono', monospace",
                    opacity: data.undisclosedSalary ? 0.4 : 1,
                  }}
                  value={data.salaryMin}
                  onChange={(e) => updateData({ salaryMin: e.target.value })}
                  disabled={data.undisclosedSalary}
                />
              </div>
            </div>

            {/* Dash */}
            <span
              className="flex-shrink-0 text-lg font-light select-none pb-2.5"
              style={{ color: 'var(--db-text-muted)' }}
            >
              —
            </span>

            {/* Maximum */}
            <div className="flex-1">
              <FieldLabel>Maximum</FieldLabel>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none pointer-events-none"
                  style={{ ...MONO, color: 'var(--db-text-muted)' }}
                >
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  className={salaryInputCls}
                  style={{
                    borderColor: errors.salary ? '#f87171' : 'var(--db-border)',
                    color: 'var(--db-text)',
                    fontFamily: "'JetBrains Mono', monospace",
                    opacity: data.undisclosedSalary ? 0.4 : 1,
                  }}
                  value={data.salaryMax}
                  onChange={(e) => updateData({ salaryMax: e.target.value })}
                  disabled={data.undisclosedSalary}
                />
              </div>
            </div>

            {/* Currency */}
            <div className="flex-shrink-0 w-[90px]">
              <FieldLabel>Currency</FieldLabel>
              <div className="relative">
                <select
                  className="w-full pl-3 pr-7 py-2.5 rounded-lg border text-sm appearance-none outline-none transition-all focus:ring-1 focus:ring-[var(--db-primary)] focus:border-[var(--db-primary)]"
                  style={{
                    ...MONO,
                    borderColor: 'var(--db-border)',
                    backgroundColor: 'transparent',
                    color: 'var(--db-text)',
                    cursor: data.undisclosedSalary ? 'not-allowed' : 'pointer',
                    opacity: data.undisclosedSalary ? 0.4 : 1,
                  }}
                  value={data.currency}
                  onChange={(e) => updateData({ currency: e.target.value })}
                  disabled={data.undisclosedSalary}
                >
                  {CURRENCIES.map((c) => (
                    <option
                      key={c.value}
                      value={c.value}
                      style={{ background: 'var(--db-card)', color: 'var(--db-text)' }}
                    >
                      {c.label}
                    </option>
                  ))}
                </select>
                <div
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--db-text-muted)' }}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <ErrLine msg={errors.salary} />

          {/* Divider */}
          <div className="h-px" style={{ backgroundColor: 'var(--db-border)' }} />

          {/* Toggle: Prefer not to disclose */}
          <label
            htmlFor="salary-undisclosed-toggle"
            className="flex items-center gap-3 cursor-pointer select-none text-sm"
            style={{ color: 'var(--db-text-secondary)' }}
          >
            <input
              type="checkbox"
              id="salary-undisclosed-toggle"
              className="sr-only"
              checked={data.undisclosedSalary}
              onChange={(e) => updateData({ undisclosedSalary: e.target.checked })}
            />

            <div className="relative flex-shrink-0" style={{ width: 36, height: 20 }}>
              <div
                className="absolute inset-0 rounded-full transition-all duration-200"
                style={{
                  backgroundColor: data.undisclosedSalary ? 'rgba(4,255,180,0.15)' : 'transparent',
                  border: `2px solid ${data.undisclosedSalary ? 'var(--db-primary)' : 'var(--db-border)'}`,
                }}
              />
              <div
                className="absolute rounded-full transition-all duration-200 pointer-events-none"
                style={{
                  top: 3, width: 14, height: 14,
                  left: data.undisclosedSalary ? 18 : 3,
                  backgroundColor: data.undisclosedSalary ? 'var(--db-primary)' : 'var(--db-text-muted)',
                }}
              />
            </div>

            <span>
              Prefer not to disclose salary — displays as&nbsp;
              <span style={{ ...MONO, color: 'var(--db-primary)' }}>&quot;Competitive&quot;</span>
            </span>
          </label>
        </div>
      </SectionCard>

      {/* ── Section 4: Job Description ── */}
      <SectionCard>
        <SectionTitle>Job Description</SectionTitle>

        <div id="field-description" className="flex flex-col gap-1">
          <RichTextarea
            label=""
            placeholder="Describe the responsibilities, expectations, and day-to-day for this role…"
            value={data.description}
            onChangeValue={(val) => updateData({ description: val })}
            error={errors.description}
            minRows={9}
          />
          <div className="flex items-center justify-end gap-2 mt-1.5">
            {descTextLen > 5000 && (
              <span className="text-[10px]" style={{ ...MONO, color: '#f87171' }}>
                Exceeds recommended length
              </span>
            )}
            <span
              className="text-[10px] tabular-nums"
              style={{ ...MONO, color: descTextLen > 5000 ? '#f87171' : 'var(--db-text-muted)' }}
            >
              {descTextLen.toLocaleString()} chars
            </span>
          </div>
        </div>
      </SectionCard>

      {/* ── Footer actions ── */}
      <div
        className="flex items-center justify-between pt-5 border-t"
        style={{ borderColor: 'var(--db-border)' }}
      >
        {/* Save Draft */}
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={draftState === 'saving'}
          className="flex items-center gap-2 text-sm font-medium transition-all hover:opacity-80 disabled:opacity-40"
          style={{ ...MONO, color: draftColor() }}
        >
          {draftState === 'saving' ? (
            <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin inline-block" />
          ) : (
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {draftState === 'saved' ? 'check_circle' : draftState === 'error' ? 'error' : 'save'}
            </span>
          )}
          {draftLabel()}
        </button>

        {/* Next */}
        <button
          type="button"
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'var(--db-primary)', color: '#0a0a0a', ...MONO }}
        >
          Next: Requirements
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
