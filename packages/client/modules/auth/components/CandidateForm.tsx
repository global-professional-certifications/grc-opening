import React, { useState } from "react";
import { useRouter } from "next/router";
import { Input } from "../../../components/forms/Input";
import { Select } from "../../../components/forms/Select";
import { Button } from "../../../components/ui/Button";
import { PasswordStrength } from "./PasswordStrength";
import { apiFetch } from "../../../lib/api";

const COUNTRIES = [
  { value: "", label: "Select Country" },
  { value: "us", label: "United States" },
  { value: "in", label: "India" },
  { value: "uk", label: "United Kingdom" },
  { value: "ca", label: "Canada" },
  { value: "au", label: "Australia" },
  { value: "sg", label: "Singapore" },
];

interface Fields {
  fullName: string;
  professionalTitle: string;
  email: string;
  password: string;
  confirmPassword: string;
  country: string;
}

const EMPTY: Fields = {
  fullName: "",
  professionalTitle: "",
  email: "",
  password: "",
  confirmPassword: "",
  country: "",
};

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function validate(data: Fields): Partial<Fields> {
  const errs: Partial<Fields> = {};
  if (!data.fullName.trim()) {
    errs.fullName = "Full name is required";
  } else if (data.fullName.trim().split(/\s+/).filter(Boolean).length < 2) {
    errs.fullName = "Please enter your full name (first and last name)";
  }
  if (!data.professionalTitle.trim()) errs.professionalTitle = "Professional title is required";
  if (!data.email.trim()) errs.email = "Email address is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = "Enter a valid email address";
  if (!data.password) errs.password = "Password is required";
  else if (data.password.length < 8) errs.password = "Minimum 8 characters";
  if (!data.confirmPassword) errs.confirmPassword = "Please confirm your password";
  else if (data.password !== data.confirmPassword) errs.confirmPassword = "Passwords do not match";
  if (!data.country) errs.country = "Please select a country";
  return errs;
}

export function CandidateForm() {
  const router = useRouter();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Fields>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function set(key: keyof Fields, value: string) {
    const next = { ...fields, [key]: value };
    setFields(next);
    if (submitted) setErrors(validate(next));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate(fields);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const [firstName, ...rest] = fields.fullName.trim().split(" ");
      const lastName = rest.join(" ") || firstName;
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: fields.email,
          password: fields.password,
          confirmPassword: fields.confirmPassword,
          role: "JOB_SEEKER",
          firstName,
          lastName,
        }),
      });
      sessionStorage.setItem("grc_pending_verification_email", fields.email);
      router.push("/verify-email");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please try again.";
      if (msg.toLowerCase().includes("email")) {
        setErrors(prev => ({ ...prev, email: msg }));
      } else if (msg.toLowerCase().includes("password")) {
        setErrors(prev => ({ ...prev, confirmPassword: msg }));
      } else {
        setErrors(prev => ({ ...prev, fullName: msg }));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "clamp(10px, 1.2vh, 14px)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Input
          label="Full Name" placeholder="Alex Rivera" id="fullName"
          value={fields.fullName} onChange={e => set("fullName", e.target.value)}
          error={errors.fullName}
        />
        <Input
          label="Professional Title" placeholder="GRC Analyst" id="title"
          value={fields.professionalTitle} onChange={e => set("professionalTitle", e.target.value)}
          error={errors.professionalTitle}
        />
      </div>

      <Input
        label="Email Address" type="email" placeholder="name@company.com" id="email"
        icon={<MailIcon />}
        value={fields.email} onChange={e => set("email", e.target.value)}
        error={errors.email}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Input
            label="Password" type="password" placeholder="••••••••" id="password"
            value={fields.password} onChange={e => set("password", e.target.value)}
            error={errors.password}
          />
          <PasswordStrength password={fields.password} />
        </div>
        <Input
          label="Confirm Password" type="password" placeholder="••••••••" id="confirmPassword"
          value={fields.confirmPassword} onChange={e => set("confirmPassword", e.target.value)}
          error={errors.confirmPassword}
        />
      </div>

      <div>
        <Select
          label="Country" id="country" options={COUNTRIES}
          value={fields.country} onChange={e => set("country", e.target.value)}
          className={errors.country ? "grc-input-error" : ""}
        />
        {errors.country && (
          <p style={{ fontSize: "0.75rem", color: "#f87171", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {errors.country}
          </p>
        )}
      </div>


      <Button type="submit" fullWidth disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
        {loading ? "Creating account…" : <> Create Account <ArrowIcon /> </>}
      </Button>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          OR CONTINUE WITH
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      <Button variant="outline" type="button" fullWidth>
        <GoogleIcon /> Continue with Google
      </Button>

      <p style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
        Already have an account?{" "}
        <a href="/auth/login" style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>
          Sign In
        </a>
      </p>
    </form>
  );
}
