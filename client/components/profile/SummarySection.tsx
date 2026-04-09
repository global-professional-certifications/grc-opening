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
      className="db-card rounded-2xl p-6 space-y-4 shadow-sm"
      style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
    >
      <div className="flex items-center gap-3 border-l-4 pl-3" style={{ borderColor: "var(--db-primary)" }}>
        <div className="p-2 rounded-lg" style={{ background: "var(--db-primary-10)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--db-primary)" }}>
            article
          </span>
        </div>
        <h3
          className="text-sm font-bold uppercase tracking-widest"
          style={{ color: "var(--db-text)" }}
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
            border: "1px solid",
            borderColor: focused ? "var(--db-primary)" : "var(--db-border)",
            boxShadow: focused ? "0 0 0 4px var(--db-primary-10), inset 0 2px 4px rgba(0,0,0,0.02)" : "inset 0 2px 4px rgba(0,0,0,0.02)",
            borderRadius: 10,
            padding: "12px 16px",
            color: "var(--db-text)",
            fontSize: "0.875rem",
            fontWeight: 500,
            outline: "none",
            resize: "vertical",
            lineHeight: 1.65,
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
        <p
          className="text-right text-xs mt-1.5 font-medium"
          style={{
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
