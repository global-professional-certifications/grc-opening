import React, { useState } from "react";
import { useRouter } from "next/router";
import { ModernInput } from "../../../components/ui/ModernInput";
import { PasswordStrength } from "./PasswordStrength";
import { apiFetch } from "../../../lib/api";

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

const FREE_EMAIL_DOMAINS = [
  "gmail", "yahoo", "hotmail", "outlook", "icloud",
  "aol", "protonmail", "live", "msn", "ymail",
];

interface Fields {
  companyName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  workEmail: string;
  password: string;
  confirmPassword: string;
  industry: string;
  companySize: string;
}

const EMPTY: Fields = {
  companyName: "",
  firstName: "",
  middleName: "",
  lastName: "",
  workEmail: "",
  password: "",
  confirmPassword: "",
  industry: "",
  companySize: "",
};

function isFreeEmailDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return FREE_EMAIL_DOMAINS.some(d => domain === `${d}.com` || domain.startsWith(`${d}.`));
}

function validate(data: Fields): Partial<Fields> {
  const errs: Partial<Fields> = {};
  if (!data.companyName.trim()) errs.companyName = "Required";
  if (!data.firstName.trim()) errs.firstName = "Required";
  if (!data.lastName.trim()) errs.lastName = "Required";
  if (!data.workEmail.trim()) {
    errs.workEmail = "Required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.workEmail)) {
    errs.workEmail = "Invalid email";
  } else if (isFreeEmailDomain(data.workEmail)) {
    errs.workEmail = "Use corporate email";
  }
  if (!data.password) errs.password = "Required";
  else if (data.password.length < 8) errs.password = "Min 8 chars";
  if (!data.confirmPassword) errs.confirmPassword = "Required";
  else if (data.password !== data.confirmPassword) errs.confirmPassword = "No match";
  if (!data.industry) errs.industry = "Required";
  if (!data.companySize) errs.companySize = "Required";
  return errs;
}

export function EmployerForm() {
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
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: fields.workEmail,
          password: fields.password,
          confirmPassword: fields.confirmPassword,
          role: "EMPLOYER",
          companyName: fields.companyName,
          representativeFirstName: fields.firstName,
          representativeMiddleName: fields.middleName,
          representativeLastName: fields.lastName,
          industry: fields.industry,
          companySize: fields.companySize,
        }),
      });
      sessionStorage.setItem("grc_pending_verification_email", fields.workEmail);
      router.push("/verify-email");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      setErrors({ workEmail: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <ModernInput
        label="Company Name" placeholder="e.g. Acme GRC Solutions" id="companyName"
        icon="business"
        value={fields.companyName} onChange={e => set("companyName", e.target.value)}
        error={errors.companyName}
      />

      {/* 3-Column Rep Name Grid */}
      <div className="grid grid-cols-3 gap-3">
        <ModernInput
          label="Rep. First Name" placeholder="John" id="firstName"
          value={fields.firstName} onChange={e => set("firstName", e.target.value)}
          error={errors.firstName}
        />
        <ModernInput
          label="Rep. Middle" placeholder="D." id="middleName"
          value={fields.middleName} onChange={e => set("middleName", e.target.value)}
          error={errors.middleName}
        />
        <ModernInput
          label="Rep. Last Name" placeholder="Doe" id="lastName"
          value={fields.lastName} onChange={e => set("lastName", e.target.value)}
          error={errors.lastName}
        />
      </div>

      <ModernInput
        label="Work Email" type="email" placeholder="hr@company.com" id="workEmail"
        icon="alternate_email"
        value={fields.workEmail} onChange={e => set("workEmail", e.target.value)}
        error={errors.workEmail}
        hint="Please use your professional corporate email."
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <ModernInput
            label="Password" type="password" id="empPassword"
            icon="lock"
            value={fields.password} onChange={e => set("password", e.target.value)}
            error={errors.password}
          />
          <PasswordStrength password={fields.password} />
        </div>
        <ModernInput
          label="Confirm Password" type="password" id="empConfirmPassword"
          icon="lock"
          value={fields.confirmPassword} onChange={e => set("confirmPassword", e.target.value)}
          error={errors.confirmPassword}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-semibold text-gray-500 tracking-tight">Industry</label>
          <select
            value={fields.industry}
            onChange={e => set("industry", e.target.value)}
            className={`w-full py-2.5 px-4 bg-[#f9fafb] rounded-xl border border-gray-200 outline-none text-[14.5px] font-medium transition-all ${errors.industry ? "border-red-500 focus:ring-red-500/10" : "focus:border-[#3a1292] focus:ring-4 focus:ring-[#3a1292]/10 shadow-sm"} cursor-pointer appearance-none`}
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%233a1292' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat', backgroundSize: '16px' }}
          >
            {INDUSTRIES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-semibold text-gray-500 tracking-tight">Company Size</label>
          <select
            value={fields.companySize}
            onChange={e => set("companySize", e.target.value)}
            className={`w-full py-2.5 px-4 bg-[#f9fafb] rounded-xl border border-gray-200 outline-none text-[14.5px] font-medium transition-all ${errors.companySize ? "border-red-500 focus:ring-red-500/10" : "focus:border-[#3a1292] focus:ring-4 focus:ring-[#3a1292]/10 shadow-sm"} cursor-pointer appearance-none`}
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%233a1292' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat', backgroundSize: '16px' }}
          >
            {COMPANY_SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 mt-1 rounded-xl bg-[#3a1292] text-white font-bold text-[15px] shadow-lg shadow-[#3a1292]/20 hover:bg-[#2e0e74] transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3"
      >
        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Get Started <span className="material-symbols-outlined text-[20px]">arrow_forward</span></>}
      </button>

      <p className="text-center text-[12px] text-gray-500 leading-relaxed px-4">
        By continuing, you agree to our{" "}
        <a href="#" className="text-[#3a1292] font-bold hover:underline">Terms</a> & <a href="#" className="text-[#3a1292] font-bold hover:underline">Privacy</a>.
      </p>

      <p className="text-center text-[14px] text-gray-500 font-medium">
        Already have an account?{" "}
        <a href="/auth/login" className="text-[#3a1292] font-bold hover:underline">
          Log In
        </a>
      </p>
    </form>
  );
}
