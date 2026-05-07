import React, { useState, useRef } from "react";
import type { ProfileFormData, Certification } from "./types";

const MONO = { fontFamily: "'JetBrains Mono', monospace" };

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

interface TagInputProps {
  placeholder: string;
  onAdd: (value: string) => void;
}

function TagInput({ placeholder, onAdd }: TagInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  function commit() {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed);
      setValue("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
  }

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => {
        setFocused(false);
        commit();
      }}
      onFocus={() => setFocused(true)}
      placeholder={placeholder}
      style={{
        background: "var(--db-surface)",
        border: "1px solid",
        borderColor: focused ? "var(--db-primary)" : "var(--db-border)",
        borderRadius: 20,
        padding: "6px 14px",
        color: "var(--db-text)",
        fontWeight: 500,
        fontSize: "0.75rem",
        outline: "none",
        width: 170,
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: focused ? "0 0 0 4px var(--db-primary-10), inset 0 2px 4px rgba(0,0,0,0.02)" : "inset 0 2px 4px rgba(0,0,0,0.02)",
      }}
    />
  );
}

interface Props {
  coreCompetencies: string[];
  onChange: (updates: Partial<ProfileFormData>) => void;
}

export function SkillsSection({ coreCompetencies, onChange }: Props) {
  function addSkill(skill: string) {
    if (!coreCompetencies.includes(skill)) {
      onChange({ coreCompetencies: [...coreCompetencies, skill] });
    }
  }

  function removeSkill(skill: string) {
    onChange({ coreCompetencies: coreCompetencies.filter((s) => s !== skill) });
  }

  return (
    <div
      className="db-card rounded-2xl p-6 space-y-6 shadow-sm"
      style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 border-l-4 pl-3" style={{ borderColor: "var(--db-primary)" }}>
          <div className="p-2 rounded-lg" style={{ background: "var(--db-primary-10)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--db-primary)" }}>
              verified
            </span>
          </div>
          <h3
            className="text-sm font-bold uppercase tracking-widest"
            style={{ color: "var(--db-text)" }}
          >
            Skills
          </h3>
        </div>
        {coreCompetencies.length > 0 && (
          <button
            onClick={() => onChange({ coreCompetencies: [] })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{
              color: "var(--db-error, #ef4444)",
              background: "rgba(239, 68, 68, 0.1)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              delete_sweep
            </span>
            Clear All
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
          {coreCompetencies.map((skill) => (
            <span
              key={skill}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: "var(--db-primary-10)",
                color: "var(--db-primary)",
              }}
            >
              {skill}
              <button
                onClick={() => removeSkill(skill)}
                style={{
                  color: "var(--db-primary)",
                  opacity: 0.65,
                  fontSize: 14,
                  lineHeight: 1,
                  marginLeft: 1,
                }}
                title={`Remove ${skill}`}
              >
                ×
              </button>
            </span>
          ))}
          <TagInput placeholder="+ Add Skill" onAdd={addSkill} />
        </div>
    </div>
  );
}
