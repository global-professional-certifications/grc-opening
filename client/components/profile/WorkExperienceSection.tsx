import React, { useState } from "react";
import type { ProfileFormData, WorkExperience } from "./types";

const MONO = { fontFamily: "'JetBrains Mono', monospace" };

const BASE_INPUT: React.CSSProperties = {
  width: "100%",
  background: "var(--db-surface)",
  border: "1px solid var(--db-border)",
  borderRadius: 10,
  padding: "12px 16px",
  color: "var(--db-text)",
  fontSize: "0.875rem",
  fontWeight: 500,
  outline: "none",
  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "0.65rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--db-text-secondary)",
  marginBottom: 8,
  display: "block",
};

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

interface ExperienceItemProps {
  exp: WorkExperience;
  onUpdate: (updated: WorkExperience) => void;
  onRemove: () => void;
}

function ExperienceItem({ exp, onUpdate, onRemove }: ExperienceItemProps) {
  const [expanded, setExpanded] = useState(false);

  function field<K extends keyof WorkExperience>(key: K, value: WorkExperience[K]) {
    onUpdate({ ...exp, [key]: value });
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--db-border)" }}>
      {/* Collapsed header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        style={{ background: "var(--db-surface)" }}
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--db-primary-20)" }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: "var(--db-primary)" }}
            >
              business_center
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--db-text)" }}>
              {exp.title || "New Position"}
            </p>
            <p className="text-xs truncate font-medium" style={{ color: "var(--db-text-muted)" }}>
              {[exp.company, exp.location].filter(Boolean).join(" · ") || "Company"}
              {(exp.startDate || exp.current) && (
                <>
                  {" "}
                  &middot;{" "}
                  {exp.startDate}
                  {exp.current ? " — Present" : exp.endDate ? ` — ${exp.endDate}` : ""}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {exp.current && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
              style={{
                background: "var(--db-primary-10)",
                color: "var(--db-primary)",
              }}
            >
              Current
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 rounded transition-colors"
            style={{ color: "var(--db-text-muted)" }}
            title="Remove"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              delete
            </span>
          </button>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: "var(--db-text-muted)" }}
          >
            {expanded ? "expand_less" : "expand_more"}
          </span>
        </div>
      </div>

      {/* Expanded edit form */}
      {expanded && (
        <div className="p-4 space-y-3" style={{ background: "var(--db-card)" }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={LABEL_STYLE}>Job Title</label>
              <input
                value={exp.title}
                onChange={(e) => field("title", e.target.value)}
                placeholder="Lead Compliance Auditor"
                style={BASE_INPUT}
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>Company</label>
              <input
                value={exp.company}
                onChange={(e) => field("company", e.target.value)}
                placeholder="Global Finance Corp"
                style={BASE_INPUT}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={LABEL_STYLE}>Location</label>
              <input
                value={exp.location}
                onChange={(e) => field("location", e.target.value)}
                placeholder="London, UK"
                style={BASE_INPUT}
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>Start Date</label>
              <input
                value={exp.startDate}
                onChange={(e) => field("startDate", e.target.value)}
                placeholder="Jan 2020"
                style={BASE_INPUT}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={exp.current}
                onChange={(e) => field("current", e.target.checked)}
                style={{ accentColor: "var(--db-primary)", width: 15, height: 15 }}
              />
              <span className="text-xs font-medium" style={{ color: "var(--db-text)" }}>
                Currently working here
              </span>
            </label>
            {!exp.current && (
              <div>
                <input
                  value={exp.endDate}
                  onChange={(e) => field("endDate", e.target.value)}
                  placeholder="End Date (e.g. Dec 2023)"
                  style={{ ...BASE_INPUT, width: 200 }}
                />
              </div>
            )}
          </div>

          <div>
            <label style={LABEL_STYLE}>Description</label>
            <textarea
              value={exp.description}
              onChange={(e) => field("description", e.target.value)}
              rows={3}
              placeholder="Describe your key responsibilities and achievements..."
              style={{ ...BASE_INPUT, resize: "vertical", lineHeight: 1.6 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  workExperience: WorkExperience[];
  onChange: (updates: Partial<ProfileFormData>) => void;
}

export function WorkExperienceSection({ workExperience, onChange }: Props) {
  function addExperience() {
    const newExp: WorkExperience = {
      id: genId(),
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    };
    onChange({ workExperience: [...workExperience, newExp] });
  }

  function updateExperience(id: string, updated: WorkExperience) {
    onChange({
      workExperience: workExperience.map((e) => (e.id === id ? updated : e)),
    });
  }

  function removeExperience(id: string) {
    onChange({ workExperience: workExperience.filter((e) => e.id !== id) });
  }

  return (
    <div
      className="db-card rounded-2xl p-6 space-y-4 shadow-sm"
      style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
    >
      <div className="flex items-center gap-3 border-l-4 pl-3" style={{ borderColor: "var(--db-primary)" }}>
        <div className="p-2 rounded-lg" style={{ background: "var(--db-primary-10)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--db-primary)" }}>
            work
          </span>
        </div>
        <h3
          className="text-sm font-bold uppercase tracking-widest"
          style={{ color: "var(--db-text)" }}
        >
          Work Experience
        </h3>
      </div>

      {workExperience.length > 0 && (
        <div className="space-y-3">
          {workExperience.map((exp) => (
            <ExperienceItem
              key={exp.id}
              exp={exp}
              onUpdate={(updated) => updateExperience(exp.id, updated)}
              onRemove={() => removeExperience(exp.id)}
            />
          ))}
        </div>
      )}

      <button
        onClick={addExperience}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
        style={{
          border: "1.5px dashed var(--db-border)",
          color: "var(--db-text-muted)",
          background: "transparent",
          transition: "border-color 0.15s ease, color 0.15s ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--db-primary)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--db-primary)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--db-border)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--db-text-muted)";
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
        Add Experience
      </button>
    </div>
  );
}
