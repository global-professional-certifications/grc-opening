import { useState } from "react";
import type { ProfileFormData } from "./types";

const MONO = { fontFamily: "'JetBrains Mono', monospace" };

const MAX_CHARS = 800;

interface Props {
  summary: string;
  onChange: (updates: Partial<ProfileFormData>) => void;
}

export function SummarySection({ summary, onChange }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className="db-card db-card-hover rounded-2xl p-6 space-y-4"
      style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--db-primary)" }}>
          article
        </span>
        <h3
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ ...MONO, color: "var(--db-text-muted)" }}
        >
          Professional Summary
        </h3>
      </div>

      <div>
        <textarea
          value={summary}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) {
              onChange({ summary: e.target.value });
            }
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={4}
          placeholder="Describe your professional background, core expertise, and career goals..."
          style={{
            width: "100%",
            background: "var(--db-surface)",
            border: `1.5px solid ${focused ? "var(--db-primary)" : "var(--db-border)"}`,
            boxShadow: focused ? "0 0 0 3px var(--db-primary-10)" : "none",
            borderRadius: 8,
            padding: "10px 14px",
            color: "var(--db-text)",
            fontSize: "0.875rem",
            outline: "none",
            resize: "vertical",
            lineHeight: 1.65,
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          }}
        />
        <p
          className="text-right text-xs mt-1.5"
          style={{
            ...MONO,
            color:
              summary.length > MAX_CHARS * 0.9
                ? "var(--db-primary)"
                : "var(--db-text-muted)",
          }}
        >
          {summary.length} / {MAX_CHARS} characters
        </p>
      </div>
    </div>
  );
}
