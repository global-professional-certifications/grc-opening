import type { ProfileFormData } from "./types";

const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const SYNE = { fontFamily: "'Syne', sans-serif" };

const STEP_ICONS: Record<string, string> = {
  "Personal Info":   "person",
  "Summary":         "notes",
  "Work Experience": "work",
  "Skills":          "psychology",
  "Certifications":  "verified",
  "Resume":          "description",
};

function getMotivation(pct: number): { text: string; accent: boolean } {
  if (pct === 100) return { text: "🎉 Profile complete — you're ready to apply!", accent: true };
  if (pct >= 80)   return { text: "Almost there! One last step to stand out.", accent: false };
  if (pct >= 60)   return { text: "Great progress — keep building your profile.", accent: false };
  if (pct >= 40)   return { text: "You're halfway there. Keep going!", accent: false };
  return { text: "Complete your profile to get noticed by recruiters.", accent: false };
}

interface CompletionItem { label: string; done: boolean; }

export function calcCompletion(profile: ProfileFormData): { pct: number; items: CompletionItem[] } {
  const items: CompletionItem[] = [
    { label: "Personal Info",   done: !!(profile.firstName && profile.lastName && profile.professionalTitle && profile.email) },
    { label: "Summary",         done: profile.summary.trim().length > 0 },
    { label: "Work Experience", done: profile.workExperience.length > 0 },
    { label: "Skills",          done: profile.coreCompetencies.length > 0 },
    { label: "Certifications",  done: profile.certifications.length > 0 },
    { label: "Resume",          done: !!profile.resumeUrl },
  ];
  const done = items.filter((i) => i.done).length;
  return { pct: Math.round((done / items.length) * 100), items };
}

// ── Segmented stepper node ────────────────────────────────────
function StepNode({
  item, index, total, isNext,
}: {
  item: CompletionItem;
  index: number;
  total: number;
  isNext: boolean;   // first incomplete step → call-to-action highlight
}) {
  const icon = STEP_ICONS[item.label] ?? "radio_button_unchecked";
  const isLast = index === total - 1;

  return (
    <div style={{ display: "flex", alignItems: "center", flex: isLast ? "0 0 auto" : 1, minWidth: 0 }}>
      {/* Node + label column */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>

        {/* Circle */}
        <div style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          // Done: solid primary fill; Next: pulsing ring; Pending: muted
          background: item.done
            ? "var(--db-primary)"
            : isNext
            ? "var(--db-card)"
            : "var(--db-surface)",
          border: item.done
            ? "2px solid var(--db-primary)"
            : isNext
            ? "2px solid var(--db-primary)"
            : "2px solid var(--db-border)",
          boxShadow: item.done
            ? "0 0 0 4px var(--db-primary-10), 0 4px 12px var(--db-primary-20)"
            : isNext
            ? "0 0 0 4px var(--db-primary-10)"
            : "none",
          transition: "all 0.35s ease",
          zIndex: 1,
        }}>
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 18,
              color: item.done
                ? "#fff"
                : isNext
                ? "var(--db-primary)"
                : "var(--db-text-muted)",
              transition: "color 0.3s ease",
            }}
          >
            {item.done ? "check" : icon}
          </span>

          {/* Pulse ring on next-to-complete step */}
          {isNext && (
            <span style={{
              position: "absolute",
              inset: -4,
              borderRadius: "50%",
              border: "2px solid var(--db-primary)",
              opacity: 0.35,
              animation: "db-pulse 2s ease-in-out infinite",
              pointerEvents: "none",
            }} />
          )}
        </div>

        {/* Label */}
        <span style={{
          fontSize: "0.6rem",
          fontWeight: item.done || isNext ? 700 : 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: item.done
            ? "var(--db-primary)"
            : isNext
            ? "var(--db-text)"
            : "var(--db-text-muted)",
          whiteSpace: "nowrap",
          ...MONO,
          transition: "color 0.3s ease",
        }}>
          {item.label}
        </span>
      </div>

      {/* Connector line between nodes */}
      {!isLast && (
        <div style={{
          flex: 1,
          height: 2,
          margin: "0 4px",
          marginBottom: 28,   // lift to align with circle centres
          borderRadius: 99,
          background: "var(--db-border)",
          overflow: "hidden",
          position: "relative",
        }}>
          <div style={{
            position: "absolute",
            inset: 0,
            borderRadius: 99,
            background: "var(--db-primary)",
            transform: item.done ? "scaleX(1)" : "scaleX(0)",
            transformOrigin: "left",
            transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
          }} />
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export function ProfileCompletionBar({ profile }: { profile: ProfileFormData }) {
  const { pct, items } = calcCompletion(profile);
  const doneCount = items.filter((i) => i.done).length;
  const nextIndex = items.findIndex((i) => !i.done);
  const motivation = getMotivation(pct);

  return (
    <div
      className="db-card db-card-hover rounded-2xl"
      style={{
        background: "var(--db-card)",
        border: "1px solid var(--db-border)",
      }}
    >
      {/* ── Header strip ─────────────────────────────────────── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 24px",
        borderBottom: "1px solid var(--db-border)",
        gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Compact arc badge */}
          <div style={{
            position: "relative",
            width: 44,
            height: 44,
            flexShrink: 0,
          }}>
            <svg width={44} height={44} style={{ transform: "rotate(-90deg)" }}>
              <circle cx={22} cy={22} r={17} fill="none" stroke="var(--db-border)" strokeWidth={4} />
              <circle
                cx={22} cy={22} r={17} fill="none"
                stroke={pct === 100 ? "#10b981" : "var(--db-primary)"}
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 17}
                strokeDashoffset={2 * Math.PI * 17 * (1 - pct / 100)}
                style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)" }}
              />
            </svg>
            <span style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.58rem", fontWeight: 800,
              color: pct === 100 ? "#10b981" : "var(--db-primary)",
              ...MONO,
            }}>
              {pct}%
            </span>
          </div>

          <div>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--db-text)", lineHeight: 1.2, ...SYNE }}>
              Profile Completion
            </h3>
            <p style={{
              fontSize: "0.75rem",
              color: motivation.accent ? "var(--db-primary)" : "var(--db-text-muted)",
              marginTop: 2,
              lineHeight: 1.4,
            }}>
              {motivation.text}
            </p>
          </div>
        </div>

        {/* Step counter pill */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 12px",
          borderRadius: 99,
          background: "var(--db-primary-10)",
          border: "1px solid var(--db-primary-20)",
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: "0.85rem", fontWeight: 800,
            color: "var(--db-primary)", ...MONO, lineHeight: 1,
          }}>
            {doneCount}
          </span>
          <span style={{ fontSize: "0.7rem", color: "var(--db-text-muted)", ...MONO }}>
            / {items.length} steps
          </span>
        </div>
      </div>

      {/* ── Stepper row ──────────────────────────────────────── */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        padding: "20px 28px",
        gap: 0,
        overflowX: "auto",
        scrollbarWidth: "none",
      }}>
        {items.map((item, i) => (
          <StepNode
            key={item.label}
            item={item}
            index={i}
            total={items.length}
            isNext={i === nextIndex}
          />
        ))}
      </div>

      {/* ── Pulse keyframe injected once ─────────────────────── */}
      <style>{`
        @keyframes db-pulse {
          0%, 100% { transform: scale(1); opacity: 0.35; }
          50%       { transform: scale(1.18); opacity: 0.15; }
        }
      `}</style>
    </div>
  );
}
