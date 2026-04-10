import React, { useState } from "react";
import type { ProfileFormData } from "./types";

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

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  colSpan?: boolean;
}

function Field({ label, value, onChange, type = "text", placeholder, colSpan }: FieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className={colSpan ? "col-span-2" : ""}>
      <label style={LABEL_STYLE}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...BASE_INPUT,
          borderColor: focused ? "var(--db-primary)" : "var(--db-border)",
          boxShadow: focused
            ? "0 0 0 4px var(--db-primary-10), inset 0 2px 4px rgba(0,0,0,0.02)"
            : BASE_INPUT.boxShadow,
        }}
      />
    </div>
  );
}

interface Props {
  data: Pick<
    ProfileFormData,
    "firstName" | "lastName" | "professionalTitle" | "email" | "location" | "linkedInUrl"
  >;
  onChange: (updates: Partial<ProfileFormData>) => void;
}

export function PersonalInfoSection({ data, onChange }: Props) {
  const fullName = `${data.firstName} ${data.lastName}`.trim();

  function handleFullNameChange(v: string) {
    const parts = v.split(" ");
    onChange({
      firstName: parts[0] ?? "",
      lastName: parts.slice(1).join(" ") ?? "",
    });
  }

  return (
    <div
      className="db-card rounded-2xl p-6 space-y-5 shadow-sm"
      style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
    >
      <div className="flex items-center gap-3 border-l-4 pl-3" style={{ borderColor: "var(--db-primary)" }}>
        <div className="p-2 rounded-lg" style={{ background: "var(--db-primary-10)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--db-primary)" }}>
            person
          </span>
        </div>
        <h3
          className="text-sm font-bold tracking-widest uppercase"
          style={{ color: "var(--db-text)" }}
        >
          Personal Information
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Full Name"
          value={fullName}
          onChange={handleFullNameChange}
          placeholder="Sarah Jenkins"
        />
        <Field
          label="Professional Title"
          value={data.professionalTitle}
          onChange={(v) => onChange({ professionalTitle: v })}
          placeholder="Lead Compliance Auditor"
        />
        <Field
          label="Email Address"
          value={data.email}
          onChange={(v) => onChange({ email: v })}
          type="email"
          placeholder="sarah@example.com"
        />
        <Field
          label="Location"
          value={data.location}
          onChange={(v) => onChange({ location: v })}
          placeholder="London, United Kingdom"
        />
        <Field
          label="LinkedIn URL"
          value={data.linkedInUrl}
          onChange={(v) => onChange({ linkedInUrl: v })}
          placeholder="linkedin.com/in/yourprofile"
          colSpan
        />
      </div>
    </div>
  );
}
