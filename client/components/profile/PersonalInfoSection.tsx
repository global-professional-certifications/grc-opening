import React, { useState } from "react";
import type { ProfileFormData } from "./types";

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

const ERROR_STYLE: React.CSSProperties = {
  color: "var(--db-error, #ef4444)",
  fontSize: "0.75rem",
  fontWeight: 600,
  marginTop: 6,
};

const PROFESSIONAL_TITLE_REGEX = /^(?!.*[-&,/()]{2,})(?!.*\s{2,})[A-Za-z0-9&(),./ -]{2,100}$/;

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  colSpan?: boolean;
  maxLength?: number;
  error?: string;
  onBlur?: () => void;
}

function Field({ label, value, onChange, type = "text", placeholder, colSpan, maxLength, error, onBlur }: FieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className={colSpan ? "col-span-2" : ""}>
      <label style={LABEL_STYLE}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        style={{
          ...BASE_INPUT,
          borderColor: error
            ? "var(--db-error, #ef4444)"
            : focused
            ? "var(--db-primary)"
            : "var(--db-border)",
          boxShadow: error
            ? "0 0 0 4px rgba(239, 68, 68, 0.12), inset 0 2px 4px rgba(0,0,0,0.02)"
            : focused
            ? "0 0 0 4px var(--db-primary-10), inset 0 2px 4px rgba(0,0,0,0.02)"
            : BASE_INPUT.boxShadow,
        }}
      />
      {error && <p style={ERROR_STYLE}>{error}</p>}
    </div>
  );
}

interface Props {
  data: Pick<
    ProfileFormData,
    "firstName" | "lastName" | "professionalTitle" | "email" | "phone" | "location" | "linkedInUrl"
  >;
  onChange: (updates: Partial<ProfileFormData>) => void;
}

interface PersonalInfoErrors {
  professionalTitle?: string;
}

export function PersonalInfoSection({ data, onChange }: Props) {
  const [errors, setErrors] = useState<PersonalInfoErrors>({});
  const fullName = `${data.firstName} ${data.lastName}`.trim();

  function handleFullNameChange(v: string) {
    const parts = v.split(" ");
    onChange({
      firstName: parts[0] ?? "",
      lastName: parts.slice(1).join(" ") ?? "",
    });
  }

  function sanitizeProfessionalTitle(value: string) {
    let next = value;

    // Remove unsupported special characters
    next = next.replace(/[^A-Za-z0-9&(),./ -]/g, "");

    // Remove leading spaces and collapse repeated spaces
    next = next.replace(/^\s+/, "").replace(/\s{2,}/g, " ");

    // Prevent repeated punctuation sequences
    next = next.replace(/([&,./()-]){2,}/g, "$1");

    return next.slice(0, 100);
  }

  function validateProfessionalTitle(value: string) {
    const trimmed = value.trim();
    if (trimmed.length === 0) return "Professional title is required";
    if (trimmed.length < 2) return "Professional title must be at least 2 characters";
    if (!PROFESSIONAL_TITLE_REGEX.test(trimmed)) return "Please enter a valid professional title";
    return undefined;
  }

  function handleProfessionalTitleChange(v: string) {
    const value = sanitizeProfessionalTitle(v);
    onChange({ professionalTitle: value });
    setErrors((prev) => ({
      ...prev,
      professionalTitle: validateProfessionalTitle(value),
    }));
  }

  return (
    <div
      className="db-card rounded-2xl p-6 space-y-5 shadow-sm"
      style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
    >
      <div className="flex items-center justify-between">
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
        <button
          onClick={() => {
            onChange({
              firstName: "",
              lastName: "",
              professionalTitle: "",
              email: "",
              phone: "",
              location: "",
              linkedInUrl: "",
            });
            setErrors({});
          }}
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
          placeholder="Lead Compliance Auditor"
          maxLength={100}
          onChange={handleProfessionalTitleChange}
          onBlur={() =>
            setErrors((prev) => ({
              ...prev,
              professionalTitle: validateProfessionalTitle(data.professionalTitle),
            }))
          }
          error={errors.professionalTitle}
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
          label="Phone Number"
          value={data.phone ?? ""}
          onChange={(v) => onChange({ phone: v })}
          type="tel"
          placeholder="+1 555 000 0000"
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
