import { useState, useCallback } from 'react';
import { useJobPosting } from '../../../contexts/JobPostingContext';
import { Select } from '../../../components/forms/Select';
import { RichTextarea, extractText } from '../../../components/forms/RichTextarea';
import { TagInput } from '../../../components/forms/TagInput';
import { saveJobDraftAPI } from '../../../lib/api/jobs';

const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const SYNE = { fontFamily: "'Syne', sans-serif" };

const EXPERIENCE_OPTIONS = [
  { value: '',    label: 'Select experience level' },
  { value: '0-2', label: 'Entry Level (0–2 years)' },
  { value: '3-5', label: 'Mid Level (3–5 years)' },
  { value: '5-8', label: 'Senior (5–8 years)' },
  { value: '8+',  label: 'Director / VP (8+ years)' },
];

const SENIORITY_OPTIONS = [
  { value: '',             label: 'Select seniority' },
  { value: 'Entry',        label: 'Entry' },
  { value: 'Associate',    label: 'Associate' },
  { value: 'Mid-Senior',   label: 'Mid-Senior' },
  { value: 'Lead/Manager', label: 'Lead / Manager' },
  { value: 'Director',     label: 'Director' },
  { value: 'Executive',    label: 'Executive' },
];

const CERT_SUGGESTIONS = ['CIA', 'CISSP', 'CISA', 'CISM', 'CRISC', 'CDPSE', 'CPA', 'CFE', 'GRCP', 'CCEP'];

type DraftState = 'idle' | 'saving' | 'saved' | 'error';

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
    <p className="text-[10px] font-bold tracking-widest uppercase" style={{ ...MONO, color: 'var(--db-text-muted)' }}>
      {children}
    </p>
  );
}

function validate(data: ReturnType<typeof useJobPosting>['data']) {
  const errors: Record<string, string> = {};
  if (!extractText(data.responsibilities)) errors.responsibilities = 'Responsibilities are required';
  if (!extractText(data.qualifications))   errors.qualifications   = 'Qualifications are required';
  return errors;
}

export function Step2Requirements() {
  const { data, updateData, nextStep, prevStep, saveDraft, draftSavedAt } = useJobPosting();
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [draftState, setDraftState] = useState<DraftState>('idle');

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

  const addSuggestion = (cert: string) => {
    if (!data.certifications.includes(cert)) {
      updateData({ certifications: [...data.certifications, cert] });
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 pb-12">

      {/* ── Page heading ── */}
      <div className="mb-1">
        <h2 className="text-2xl font-bold mb-1" style={{ ...SYNE, color: 'var(--db-text)' }}>
          Define the requirements
        </h2>
        <p className="text-sm" style={{ color: 'var(--db-text-muted)' }}>
          Specify the professional standards and skills needed for this GRC role.
        </p>
      </div>

      {/* ── Section 1: Responsibilities ── */}
      <SectionCard>
        <SectionTitle>Key Responsibilities</SectionTitle>

        <div id="field-responsibilities">
          <RichTextarea
            label=""
            placeholder={`List the key duties for this role, e.g.:\n• Conduct annual risk assessments across global business units\n• Develop and maintain compliance policies\n• Coordinate with external auditors`}
            value={data.responsibilities}
            onChangeValue={(val) => updateData({ responsibilities: val })}
            error={errors.responsibilities}
            minRows={7}
          />
        </div>
      </SectionCard>

      {/* ── Section 2: Qualifications ── */}
      <SectionCard>
        <SectionTitle>Qualifications</SectionTitle>

        <div id="field-qualifications">
          <RichTextarea
            label=""
            placeholder={`List required qualifications, e.g.:\n• 5+ years of experience in internal audit or regulatory compliance\n• Bachelor's degree in Finance, Accounting, or related field\n• Strong knowledge of SOX, ISO 27001, or GDPR frameworks`}
            value={data.qualifications}
            onChangeValue={(val) => updateData({ qualifications: val })}
            error={errors.qualifications}
            minRows={7}
          />
        </div>
      </SectionCard>

      {/* ── Section 3: Experience + Seniority ── */}
      <SectionCard>
        <SectionTitle>Level &amp; Experience</SectionTitle>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Select
            id="experience"
            label="YEARS OF EXPERIENCE"
            options={EXPERIENCE_OPTIONS}
            value={data.experience}
            onChange={(e) => updateData({ experience: e.target.value })}
          />
          <Select
            id="seniority"
            label="SENIORITY LEVEL"
            options={SENIORITY_OPTIONS}
            value={data.seniority}
            onChange={(e) => updateData({ seniority: e.target.value })}
          />
        </div>
      </SectionCard>

      {/* ── Section 4: Certifications ── */}
      <SectionCard>
        <SectionTitle>Certifications</SectionTitle>

        <div className="flex flex-col gap-3">
          <TagInput
            label="REQUIRED CERTIFICATIONS"
            tags={data.certifications}
            onChange={(tags) => updateData({ certifications: tags })}
            placeholder="Type and press Enter or comma…"
            suggestionText="Press Enter or comma to add. Backspace to remove last."
          />

          {/* Quick-add suggestion pills */}
          <div className="flex flex-wrap gap-2 items-center pt-1">
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{ ...MONO, color: 'var(--db-text-muted)' }}
            >
              Common:
            </span>
            {CERT_SUGGESTIONS.map((cert) => {
              const added = data.certifications.includes(cert);
              return (
                <button
                  key={cert}
                  type="button"
                  onClick={() => addSuggestion(cert)}
                  disabled={added}
                  className="px-2.5 py-0.5 rounded text-xs font-medium border transition-all"
                  style={{
                    ...MONO,
                    borderColor: added ? 'var(--db-primary)' : 'var(--db-border)',
                    color:       added ? 'var(--db-primary)' : 'var(--db-text-muted)',
                    backgroundColor: added ? 'rgba(4,255,180,0.08)' : 'transparent',
                    cursor: added ? 'default' : 'pointer',
                    opacity: added ? 0.7 : 1,
                  }}
                >
                  {added ? '✓ ' : '+ '}{cert}
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>

      {/* ── Section 5: Nice to Have ── */}
      <SectionCard>
        <div className="flex items-center justify-between">
          <SectionTitle>Nice to Have</SectionTitle>
          <span
            className="text-[10px] px-2 py-0.5 rounded border"
            style={{ ...MONO, color: 'var(--db-text-muted)', borderColor: 'var(--db-border)' }}
          >
            Optional
          </span>
        </div>

        <textarea
          className="w-full p-4 bg-transparent outline-none resize-y min-h-[110px] text-sm rounded-lg border transition-all focus:ring-1 focus:ring-[var(--db-primary)] focus:border-[var(--db-primary)]"
          style={{
            backgroundColor: 'transparent',
            borderColor: 'var(--db-border)',
            color: 'var(--db-text)',
            lineHeight: '1.65',
          }}
          placeholder="Optional skills, soft skills, or familiarity with specific tools (e.g. ServiceNow GRC, OneTrust, Workiva)…"
          value={data.niceToHave}
          onChange={(e) => updateData({ niceToHave: e.target.value })}
        />
      </SectionCard>

      {/* ── Footer actions ── */}
      <div
        className="flex items-center justify-between pt-5 border-t"
        style={{ borderColor: 'var(--db-border)' }}
      >
        {/* Back */}
        <button
          type="button"
          onClick={prevStep}
          className="flex items-center gap-2 text-sm font-medium transition-all hover:opacity-80"
          style={{ color: 'var(--db-text-secondary)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Back
        </button>

        <div className="flex items-center gap-5">
          {/* Save Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={draftState === 'saving'}
            className="flex items-center gap-1.5 text-sm font-medium transition-all hover:opacity-80 disabled:opacity-40"
            style={{ ...MONO, color: draftColor() }}
          >
            {draftState === 'saving' ? (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin inline-block" />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
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
            Next: Preview
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
