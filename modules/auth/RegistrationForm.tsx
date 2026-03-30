import React, { useState } from "react";
import { Input } from "../../components/forms/Input";
import { Select } from "../../components/forms/Select";
import { Button } from "../../components/ui/Button";
import { ToggleTabs } from "../../components/ui/ToggleTabs";

const COUNTRIES = [
  { value: "us", label: "United States" }, { value: "in", label: "India" },
  { value: "uk", label: "United Kingdom" }, { value: "ca", label: "Canada" },
  { value: "au", label: "Australia" }, { value: "sg", label: "Singapore" },
];

const INDUSTRIES = [
  { value: "", label: "Select Industry" }, { value: "fintech", label: "Fintech" },
  { value: "banking", label: "Banking & Finance" }, { value: "insurance", label: "Insurance" },
  { value: "healthcare", label: "Healthcare" }, { value: "consulting", label: "Consulting" },
];

const COMPANY_SIZES = [
  { value: "", label: "Select Size" }, { value: "1-50", label: "1-50" },
  { value: "51-200", label: "51-200" }, { value: "201-500", label: "201-500" },
  { value: "1000+", label: "1000+" },
];

// ── Password Strength ──────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const getStrength = () => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  };
  const strength = getStrength();
  const colors = ["", "#f87171", "#fb923c", "#00D4B2", "#00D4B2"];
  const labels = ["", "WEAK", "FAIR", "GOOD", "STRONG"];

  return password ? (
    <div style={{ marginTop: 5 }}>
      <div style={{ display: "flex", gap: 3 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            height: 3, flex: 1, borderRadius: 99,
            background: i <= strength ? colors[strength] : "var(--border)",
            transition: "background 0.3s ease",
          }} />
        ))}
      </div>
      {strength > 0 && (
        <p style={{ fontSize: "0.6rem", fontWeight: 700, color: colors[strength], marginTop: 3 }}>
          {labels[strength]} PASSWORD
        </p>
      )}
    </div>
  ) : null;
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}

// ── Job Seeker Form ─────────────────────────────
function JobSeekerForm() {
  const [password, setPassword] = useState("");

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Input label="Full Name" placeholder="Alex Rivera" id="fullName" />
        <Input label="Professional Title" placeholder="GRC Analyst" id="title" />
      </div>

      <Input label="Email Address" type="email" placeholder="name@company.com" id="email" icon={<MailIcon />} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Input label="Password" type="password" placeholder="••••••••" id="password"
            value={password} onChange={e => setPassword(e.target.value)} />
          <PasswordStrength password={password} />
        </div>
        <Input label="Confirm Password" type="password" placeholder="••••••••" id="confirmPassword" />
      </div>

      <Select label="Country" id="country" options={COUNTRIES} />

      <Button type="submit" fullWidth>
        Create Account
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
        </svg>
      </Button>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", whiteSpace: "nowrap" }}>OR CONTINUE WITH</span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      <Button variant="outline" fullWidth><GoogleIcon /> Continue with Google</Button>

      <p style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
        Already have an account?{" "}
        <a href="/auth/login" style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>Sign In</a>
      </p>
    </>
  );
}

// ── Employer Form ───────────────────────────────
function EmployerForm() {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  const emailError = email && (email.includes("gmail") || email.includes("yahoo") || email.includes("hotmail"))
    ? "Please use a valid company email address (e.g. name@company.com)."
    : undefined;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Input label="Company Name" placeholder="e.g. Acme GRC" id="companyName" />
        <Input label="Your Name" placeholder="John Doe" id="yourName" />
      </div>

      <Input label="Work Email" type="email" placeholder="hr@company.com" id="workEmail"
        value={email} onChange={e => setEmail(e.target.value)} error={emailError} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Input label="Password" type="password" placeholder="securePass123" id="empPassword"
            value={password} onChange={e => setPassword(e.target.value)} />
          <PasswordStrength password={password} />
        </div>
        <Input label="Confirm Password" type="password" placeholder="••••••••" id="empConfirmPassword" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <Select label="Industry" id="industry" options={INDUSTRIES} />
        <Select label="Company Size" id="companySize" options={COMPANY_SIZES} />
        <Input label="Company Website" placeholder="https://..." id="website" type="url" />
      </div>

      <Button type="submit" fullWidth>
        Create Account
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
        </svg>
      </Button>

      <p style={{ textAlign: "center", fontSize: "0.7rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
        By signing up, you agree to our{" "}
        <a href="#" style={{ color: "var(--brand)", textDecoration: "none" }}>Terms of Service</a>
        {" "}and{" "}
        <a href="#" style={{ color: "var(--brand)", textDecoration: "none" }}>Privacy Policy</a>.
      </p>

      <p style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
        Already have an account?{" "}
        <a href="/auth/login" style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>Log in</a>
      </p>
    </>
  );
}

// ── Main ────────────────────────────────────────
export function RegistrationForm({ onRoleChange }: { onRoleChange?: (role: "job_seeker" | "employer") => void }) {
  const [role, setRole] = useState<"job_seeker" | "employer">("job_seeker");

  const handleRoleChange = (id: string) => {
    const r = id as "job_seeker" | "employer";
    setRole(r);
    onRoleChange?.(r);
  };

  const headings = {
    job_seeker: { title: "Create Your Account", sub: "Join the elite network of GRC professionals." },
    employer: { title: "Join the GRC Talent Network", sub: "Hire the top 1% of Governance, Risk, and Compliance professionals worldwide." },
  };

  return (
    <div style={{ width: "100%" }}>
      {/* Heading */}
      <div style={{ marginBottom: 18 }}>
        <h2 style={{
          fontSize: "clamp(1.4rem, 2.5vw, 2rem)", fontWeight: 900,
          color: "var(--text-primary)", letterSpacing: "-0.02em",
          lineHeight: 1.2, marginBottom: 6,
        }}>
          {headings[role].title}
        </h2>
        <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          {headings[role].sub}
        </p>
      </div>

      {/* Toggle */}
      <div style={{ marginBottom: 18 }}>
        <ToggleTabs activeId={role} onChange={handleRoleChange}
          options={[
            { id: "job_seeker", label: "Job Seeker" },
            { id: "employer", label: "Employer" },
          ]}
        />
      </div>

      {/* Form */}
      <form onSubmit={e => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {role === "job_seeker" ? <JobSeekerForm /> : <EmployerForm />}
      </form>
    </div>
  );
}
