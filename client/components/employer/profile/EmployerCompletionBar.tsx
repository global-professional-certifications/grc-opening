import React from "react";
import type { EmployerProfileData } from "./types";
import { MONO, SYNE } from "./shared";

// ΓöÇΓöÇ Completion logic ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
interface CompletionItem {
  label: string;
  done: boolean;
}

const STEP_ICONS: Record<string, string> = {
  "Company Info": "business",
  "About":        "article",
  "Contact":      "contacts",
  "Social":       "link",
  "Logo":         "add_photo_alternate",
};

export function calcEmployerCompletion(profile: EmployerProfileData): {
  pct: number;
  items: CompletionItem[];
} {
  const items: CompletionItem[] = [
    {
      label: "Company Info",
      done: !!(profile.companyName && profile.industry && profile.companySize),
    },
    {
      label: "About",
      done: profile.description.trim().length >= 50,
    },
    {
      label: "Contact",
      done: !!(profile.contactName && profile.contactEmail),
    },
    {
      label: "Social",
      done: !!(profile.linkedInUrl || profile.website || profile.otherUrl),
    },
    {
      label: "Logo",
      done: !!profile.logoUrl,
    },
  ];
  const done = items.filter((i) => i.done).length;
  return { pct: Math.round((done / items.length) * 100), items };
}

function getMotivation(pct: number): { text: string; accent: boolean } {
  if (pct === 100) return { text: "Your company profile is complete ΓÇö you're ready to attract GRC talent!", accent: true };
  if (pct >= 80) return { text: "Almost there! One more step to complete your profile.", accent: false };
  if (pct >= 60) return { text: "Good progress ΓÇö keep filling in your company details.", accent: false };
  if (pct >= 40) return { text: "You're halfway there. Candidates want to know more about you.", accent: false };
  return { text: "Complete your profile to attract qualified GRC professionals.", accent: false };
}

// ΓöÇΓöÇ Step node ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function StepNode({
  item,
  index,
  total,
  isNext,
}: {
  item: CompletionItem;
  index: number;
  total: number;
  isNext: boolean;
}) {
  const icon = STEP_ICONS[item.label] ?? "radio_button_unchecked";
  const isLast = index === total - 1;

  return (
    <div style={{ display: "flex", alignItems: "center", flex: isLast ? "0 0 auto" : 1, minWidth: 0 }}>
      {/* Node + label */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {/* Circle */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            background: item.done ? "var(--db-primary)" : isNext ? "var(--db-card)" : "var(--db-surface)",
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
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 18,
              color: item.done ? "#fff" : isNext ? "var(--db-primary)" : "var(--db-text-muted)",
              transition: "color 0.3s ease",
            }}
          >
            {item.done ? "check" : icon}
          </span>

          {/* Pulse ring on next step */}
          {isNext && (
            <span
              style={{
                position: "absolute",
                inset: -4,
                borderRadius: "50%",
                border: "2px solid var(--db-primary)",
                opacity: 0.35,
                animation: "emp-pulse 2s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />
          )}
        </div>

        {/* Label */}
        <span
          style={{
            fontSize: "0.6rem",
            fontWeight: item.done || isNext ? 700 : 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: item.done ? "var(--db-primary)" : isNext ? "var(--db-text)" : "var(--db-text-muted)",
            whiteSpace: "nowrap",
            ...MONO,
            transition: "color 0.3s ease",
          }}
        >
          {item.label}
        </span>
      </div>

      {/* Connector line */}
      {!isLast && (
        <div
          style={{
            flex: 1,
            height: 2,
            margin: "0 4px",
            marginBottom: 28,
            borderRadius: 99,
            background: "var(--db-border)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 99,
              background: "var(--db-primary)",
              transform: item.done ? "scaleX(1)" : "scaleX(0)",
              transformOrigin: "left",
              transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ΓöÇΓöÇ Main export ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export function EmployerCompletionBar({ profile }: { profile: EmployerProfileData }) {
  const { pct, items } = calcEmployerCompletion(profile);
  const doneCount = items.filter((i) => i.done).length;
  const nextIndex = items.findIndex((i) => !i.done);
  const motivation = getMotivation(pct);

  return (
    <div
      className="db-card db-card-hover rounded-2xl"
      style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
    >
      {/* Header strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid var(--db-border)",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Arc badge */}
          <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
            <svg width={44} height={44} style={{ transform: "rotate(-90deg)" }}>
              <circle cx={22} cy={22} r={17} fill="none" stroke="var(--db-border)" strokeWidth={4} />
              <circle
                cx={22}
                cy={22}
                r={17}
                fill="none"
                stroke={pct === 100 ? "#10b981" : "var(--db-primary)"}
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 17}
                strokeDashoffset={2 * Math.PI * 17 * (1 - pct / 100)}
                style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)" }}
              />
            </svg>
            <span
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.58rem",
                fontWeight: 800,
                color: pct === 100 ? "#10b981" : "var(--db-primary)",
                ...MONO,
              }}
            >
              {pct}%
            </span>
          </div>

          <div>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--db-text)", lineHeight: 1.2, ...SYNE }}>
              Profile Completion
            </h3>
            <p
              style={{
                fontSize: "0.75rem",
                color: motivation.accent ? "var(--db-primary)" : "var(--db-text-muted)",
                marginTop: 2,
                lineHeight: 1.4,
              }}
            >
              {motivation.text}
            </p>
          </div>
        </div>

        {/* Step counter pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 12px",
            borderRadius: 99,
            background: "var(--db-primary-10)",
            border: "1px solid var(--db-primary-20)",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--db-primary)", ...MONO, lineHeight: 1 }}>
            {doneCount}
          </span>
          <span style={{ fontSize: "0.7rem", color: "var(--db-text-muted)", ...MONO }}>
            / {items.length} steps
          </span>
        </div>
      </div>

      {/* Stepper row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          padding: "20px 28px",
          gap: 0,
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {items.map((item, i) => (
          <StepNode key={item.label} item={item} index={i} total={items.length} isNext={i === nextIndex} />
        ))}
      </div>

      <style>{`
        @keyframes emp-pulse {
          0%, 100% { transform: scale(1); opacity: 0.35; }
          50%       { transform: scale(1.18); opacity: 0.15; }
        }
      `}</style>
    </div>
  );
}
