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
        border: `1.5px dashed ${focused ? "var(--db-primary)" : "var(--db-border)"}`,
        borderRadius: 20,
        padding: "5px 12px",
        color: "var(--db-text)",
        fontSize: "0.75rem",
        outline: "none",
        width: 160,
        transition: "border-color 0.2s ease",
        ...MONO,
      }}
    />
  );
}

interface Props {
  coreCompetencies: string[];
  certifications: Certification[];
  onChange: (updates: Partial<ProfileFormData>) => void;
}

export function SkillsSection({ coreCompetencies, certifications, onChange }: Props) {
  function addSkill(skill: string) {
    if (!coreCompetencies.includes(skill)) {
      onChange({ coreCompetencies: [...coreCompetencies, skill] });
    }
  }

  function removeSkill(skill: string) {
    onChange({ coreCompetencies: coreCompetencies.filter((s) => s !== skill) });
  }

  function addCertification(name: string) {
    onChange({ certifications: [...certifications, { id: genId(), name }] });
  }

  function removeCertification(id: string) {
    onChange({ certifications: certifications.filter((c) => c.id !== id) });
  }

  return (
    <div
      className="db-card db-card-hover rounded-2xl p-6 space-y-6"
      style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--db-primary)" }}>
          verified
        </span>
        <h3
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ ...MONO, color: "var(--db-text-muted)" }}
        >
          Skills &amp; Certifications
        </h3>
      </div>

      {/* Core Competencies */}
      <div>
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{ ...MONO, color: "var(--db-text-muted)" }}
        >
          Core Competencies
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          {coreCompetencies.map((skill) => (
            <span
              key={skill}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: "var(--db-primary-20)",
                color: "var(--db-primary)",
                ...MONO,
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

      <div style={{ borderTop: "1px solid var(--db-border)" }} />

      {/* Professional Certifications */}
      <div>
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{ ...MONO, color: "var(--db-text-muted)" }}
        >
          Professional Certifications
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          {certifications.map((cert) => (
            <span
              key={cert.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: "var(--db-primary-10)",
                color: "var(--db-primary)",
                border: "1px solid var(--db-primary-40)",
                ...MONO,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                workspace_premium
              </span>
              {cert.name}
              <button
                onClick={() => removeCertification(cert.id)}
                style={{
                  color: "var(--db-primary)",
                  opacity: 0.65,
                  fontSize: 14,
                  lineHeight: 1,
                  marginLeft: 1,
                }}
                title={`Remove ${cert.name}`}
              >
                ×
              </button>
            </span>
          ))}
          <TagInput placeholder="+ Add Certificate" onAdd={addCertification} />
        </div>
      </div>
    </div>
  );
}
