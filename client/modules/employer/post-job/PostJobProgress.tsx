import { useJobPosting } from '../../../contexts/JobPostingContext';

const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const SYNE = { fontFamily: "'Syne', sans-serif" };

const STEPS = [
  { num: 1, label: 'Job Details',    sub: 'Title, type & salary' },
  { num: 2, label: 'Requirements',   sub: 'Skills & qualifications' },
  { num: 3, label: 'Preview & Post', sub: 'Review and submit' },
];

interface PostJobProgressProps {
  currentStep: number;
}

export function PostJobProgress({ currentStep }: PostJobProgressProps) {
  const { goToStep } = useJobPosting();

  return (
    <div className="w-full mb-10">
      {/* ── Stepper ── */}
      <div className="flex items-start">
        {STEPS.map((step, idx) => {
          const isActive    = step.num === currentStep;
          const isPast      = step.num < currentStep;
          const isClickable = isPast;
          const trackFilled = step.num < currentStep;

          return (
            <div
              key={step.num}
              className="flex items-start"
              style={{ flex: idx < STEPS.length - 1 ? '1 1 0%' : 'none' }}
            >
              {/* ── Step node ── */}
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && goToStep(step.num)}
                className="flex flex-col items-center gap-2 flex-shrink-0"
                style={{ cursor: isClickable ? 'pointer' : 'default', background: 'none', border: 'none', padding: 0 }}
              >
                {/* Circle */}
                <div
                  className="w-9 h-9 flex items-center justify-center rounded-full font-bold text-sm transition-all duration-300"
                  style={{
                    ...MONO,
                    border: isActive || isPast
                      ? '2px solid var(--db-primary)'
                      : '2px solid var(--db-border)',
                    backgroundColor: isPast
                      ? 'var(--db-primary)'
                      : isActive
                      ? 'rgba(4, 255, 180, 0.12)'
                      : 'transparent',
                    color: isPast
                      ? '#0a0a0a'
                      : isActive
                      ? 'var(--db-primary)'
                      : 'var(--db-text-muted)',
                    boxShadow: isActive
                      ? '0 0 0 4px rgba(4,255,180,0.12)'
                      : isPast
                      ? '0 0 0 3px rgba(4,255,180,0.08)'
                      : 'none',
                  }}
                >
                  {isPast ? (
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
                  ) : (
                    step.num
                  )}
                </div>

                {/* Label */}
                <div className="flex flex-col items-center gap-0.5 text-center">
                  <span
                    className="font-semibold text-xs whitespace-nowrap hidden sm:block transition-colors duration-300"
                    style={{
                      ...SYNE,
                      color: isActive
                        ? 'var(--db-text)'
                        : isPast
                        ? 'var(--db-text-secondary)'
                        : 'var(--db-text-muted)',
                    }}
                  >
                    {step.label}
                  </span>
                  <span
                    className="text-[10px] whitespace-nowrap hidden lg:block"
                    style={{ ...MONO, color: 'var(--db-text-muted)' }}
                  >
                    {step.sub}
                  </span>
                </div>
              </button>

              {/* ── Track segment ── */}
              {idx < STEPS.length - 1 && (
                <div
                  className="flex-1 relative overflow-hidden mx-4"
                  style={{ marginTop: '18px', height: '2px', borderRadius: '1px' }}
                >
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: 'var(--db-border)' }}
                  />
                  <div
                    className="absolute inset-0 origin-left transition-transform duration-500 ease-out"
                    style={{
                      backgroundColor: 'var(--db-primary)',
                      transform: `scaleX(${trackFilled ? 1 : 0})`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step count pill ── */}
      <div className="flex justify-center mt-5">
        <span
          className="text-[10px] px-3 py-1 rounded-full tracking-widest uppercase"
          style={{
            ...MONO,
            color: 'var(--db-primary)',
            backgroundColor: 'rgba(4,255,180,0.07)',
            border: '1px solid rgba(4,255,180,0.2)',
          }}
        >
          Step {currentStep} of {STEPS.length}
        </span>
      </div>
    </div>
  );
}
