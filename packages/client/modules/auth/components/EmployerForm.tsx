import React, { useState } from "react";
import { Input } from "../../../components/forms/Input";
import { Select } from "../../../components/forms/Select";
import { Button } from "../../../components/ui/Button";
import { PasswordStrength } from "./PasswordStrength";

const INDUSTRIES = [
  { value: "", label: "Select Industry" },
  { value: "fintech", label: "Fintech" },
  { value: "banking", label: "Banking & Finance" },
  { value: "insurance", label: "Insurance" },
  { value: "healthcare", label: "Healthcare" },
  { value: "consulting", label: "Consulting" },
  { value: "technology", label: "Technology" },
  { value: "government", label: "Government" },
];

const COMPANY_SIZES = [
  { value: "", label: "Select Size" },
  { value: "1-50", label: "1-50" },
  { value: "51-200", label: "51-200" },
  { value: "201-500", label: "201-500" },
  { value: "501-1000", label: "501-1000" },
  { value: "1000+", label: "1000+" },
];

// Domains that indicate personal (non-corporate) email
const FREE_EMAIL_DOMAINS = [
  "gmail", "yahoo", "hotmail", "outlook", "icloud",
  "aol", "protonmail", "live", "msn", "ymail",
];

interface Fields {
  companyName: string;
  yourName: string;
  workEmail: string;
  password: string;
  confirmPassword: string;
  industry: string;
  companySize: string;
  companyWebsite: string;
}

const EMPTY: Fields = {
  companyName: "",
  yourName: "",
  workEmail: "",
  password: "",
  confirmPassword: "",
  industry: "",
  companySize: "",
  companyWebsite: "",
};

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function isFreeEmailDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return FREE_EMAIL_DOMAINS.some(d => domain === `${d}.com` || domain.startsWith(`${d}.`));
}

function validate(data: Fields): Partial<Fields> {
  const errs: Partial<Fields> = {};
  if (!data.companyName.trim()) errs.companyName = "Company name is required";
  if (!data.yourName.trim()) errs.yourName = "Your name is required";
  if (!data.workEmail.trim()) {
    errs.workEmail = "Work email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.workEmail)) {
    errs.workEmail = "Enter a valid email address";
  } else if (isFreeEmailDomain(data.workEmail)) {
    errs.workEmail = "Please use a valid company email address (e.g. name@company.com).";
  }
  if (!data.password) errs.password = "Password is required";
  else if (data.password.length < 8) errs.password = "Minimum 8 characters";
  if (!data.confirmPassword) errs.confirmPassword = "Please confirm your password";
  else if (data.password !== data.confirmPassword) errs.confirmPassword = "Passwords do not match";
  if (!data.industry) errs.industry = "Select an industry";
  if (!data.companySize) errs.companySize = "Select company size";
  return errs;
}

export function EmployerForm() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Fields>>({});
  const [submitted, setSubmitted] = useState(false);

  function set(key: keyof Fields, value: string) {
    const next = { ...fields, [key]: value };
    setFields(next);
    if (submitted) setErrors(validate(next));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate(fields);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    // TODO: Call POST /auth/register/employer when API endpoint is ready
    console.log("Employer signup:", { ...fields, password: "[REDACTED]" });
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "clamp(10px, 1.2vh, 14px)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Input
          label="Company Name" placeholder="e.g. Acme GRC" id="companyName"
          value={fields.companyName} onChange={e => set("companyName", e.target.value)}
          error={errors.companyName}
        />
        <Input
          label="Your Name" placeholder="John Doe" id="yourName"
          value={fields.yourName} onChange={e => set("yourName", e.target.value)}
          error={errors.yourName}
        />
      </div>

      <Input
        label="Work Email" type="email" placeholder="hr@company.com" id="workEmail"
        value={fields.workEmail} onChange={e => set("workEmail", e.target.value)}
        error={errors.workEmail}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Input
            label="Password" type="password" placeholder="••••••••" id="empPassword"
            value={fields.password} onChange={e => set("password", e.target.value)}
            error={errors.password}
          />
          <PasswordStrength password={fields.password} />
        </div>
        <Input
          label="Confirm Password" type="password" placeholder="••••••••" id="empConfirmPassword"
          value={fields.confirmPassword} onChange={e => set("confirmPassword", e.target.value)}
          error={errors.confirmPassword}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <div>
          <Select
            label="Industry" id="industry" options={INDUSTRIES}
            value={fields.industry} onChange={e => set("industry", e.target.value)}
            className={errors.industry ? "grc-input-error" : ""}
          />
          {errors.industry && (
            <p style={{ fontSize: "0.7rem", color: "#f87171", marginTop: 4 }}>{errors.industry}</p>
          )}
        </div>
        <div>
          <Select
            label="Company Size" id="companySize" options={COMPANY_SIZES}
            value={fields.companySize} onChange={e => set("companySize", e.target.value)}
            className={errors.companySize ? "grc-input-error" : ""}
          />
          {errors.companySize && (
            <p style={{ fontSize: "0.7rem", color: "#f87171", marginTop: 4 }}>{errors.companySize}</p>
          )}
        </div>
        <Input
          label="Company Website" placeholder="https://..." id="website" type="url"
          value={fields.companyWebsite} onChange={e => set("companyWebsite", e.target.value)}
        />
      </div>

      <Button type="submit" fullWidth>
        Create Account <ArrowIcon />
      </Button>

      <p style={{ textAlign: "center", fontSize: "0.7rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
        By signing up, you agree to our{" "}
        <a href="#" style={{ color: "var(--brand)", textDecoration: "none" }}>Terms of Service</a>
        {" "}and{" "}
        <a href="#" style={{ color: "var(--brand)", textDecoration: "none" }}>Privacy Policy</a>.
      </p>

      <p style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
        Already have an account?{" "}
        <a href="/auth/login" style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>
          Log in
        </a>
      </p>
    </form>
  );
}
