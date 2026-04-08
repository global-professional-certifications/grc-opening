import React, { useState } from "react";
import { useRouter } from "next/router";
import { ModernInput } from "../../../components/ui/ModernInput";
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
  firstName: string;
  middleName: string;
  lastName: string;
  professionalTitle: string;
  email: string;
  password: string;
  confirmPassword: string;
  country: string;
}

const EMPTY: Fields = {
  firstName: "",
  middleName: "",
  lastName: "",
  professionalTitle: "",
  email: "",
  password: "",
  confirmPassword: "",
  country: "",
};

function validate(data: Fields): Partial<Fields> {
  const errs: Partial<Fields> = {};
  if (!data.firstName.trim()) errs.firstName = "Required";
  if (!data.lastName.trim()) errs.lastName = "Required";
  if (!data.professionalTitle.trim()) errs.professionalTitle = "Field required";
  if (!data.email.trim()) errs.email = "Email required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = "Invalid email";
  if (!data.password) errs.password = "Required";
  else if (data.password.length < 8) errs.password = "Min 8 chars";
  if (!data.confirmPassword) errs.confirmPassword = "Confirm password";
  else if (data.password !== data.confirmPassword) errs.confirmPassword = "Mismatch";
  if (!data.country) errs.country = "Select country";
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
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: fields.email,
          password: fields.password,
          confirmPassword: fields.confirmPassword,
          role: "JOB_SEEKER",
          firstName: fields.firstName,
          middleName: fields.middleName,
          lastName: fields.lastName,
          professionalTitle: fields.professionalTitle,
          country: fields.country,
        }),
      });
      sessionStorage.setItem("grc_pending_verification_email", fields.email);
      router.push("/verify-email");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      setErrors(prev => ({ ...prev, email: msg }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* 3-Column Name Grid */}
      <div className="grid grid-cols-3 gap-3">
        <ModernInput
          label="First Name" placeholder="John" id="firstName"
          value={fields.firstName} onChange={e => set("firstName", e.target.value)}
          error={errors.firstName}
        />
        <ModernInput
          label="Middle Name" placeholder="D." id="middleName"
          value={fields.middleName} onChange={e => set("middleName", e.target.value)}
          error={errors.middleName}
        />
        <ModernInput
          label="Last Name" placeholder="Doe" id="lastName"
          value={fields.lastName} onChange={e => set("lastName", e.target.value)}
          error={errors.lastName}
        />
      </div>

      <ModernInput
        label="Professional Title" placeholder="GRC Analyst / Compliance Specialist" id="title"
        icon="badge"
        value={fields.professionalTitle} onChange={e => set("professionalTitle", e.target.value)}
        error={errors.professionalTitle}
      />

      <ModernInput
        label="Email Address" type="email" placeholder="name@company.com" id="email"
        icon="mail"
        value={fields.email} onChange={e => set("email", e.target.value)}
        error={errors.email}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <ModernInput
            label="Password" type="password" id="password"
            icon="lock"
            value={fields.password} onChange={e => set("password", e.target.value)}
            error={errors.password}
          />
          <PasswordStrength password={fields.password} />
        </div>
        <ModernInput
          label="Confirm Password" type="password" id="confirmPassword"
          icon="lock"
          value={fields.confirmPassword} onChange={e => set("confirmPassword", e.target.value)}
          error={errors.confirmPassword}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-semibold text-gray-500 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Country
        </label>
        <select
          value={fields.country}
          onChange={e => set("country", e.target.value)}
          className={`
            w-full py-2.5 px-4 bg-[#f9fafb] rounded-xl border border-gray-200 outline-none text-[14.5px] font-medium transition-all
            ${errors.country ? "border-red-500 focus:ring-red-500/10" : "focus:border-[#3a1292] focus:ring-4 focus:ring-[#3a1292]/10 shadow-sm"}
            cursor-pointer appearance-none
          `}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%233a1292' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundPosition: 'right 14px center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '16px'
          }}
        >
          {COUNTRIES.map(c => (
             <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        {errors.country && <span className="text-[11px] font-medium text-red-500 mt-0.5 ml-1">{errors.country}</span>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-[#3a1292] text-white font-bold text-[15px] shadow-lg shadow-[#3a1292]/20 hover:bg-[#2e0e74] transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3"
      >
        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create Account <span className="material-symbols-outlined text-[20px]">arrow_forward</span></>}
      </button>

{/* Hiding Google Auth for now as it is not implemented */}
{/* 
      <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-gray-100"></div>
        <span className="flex-shrink mx-4 text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase">OR</span>
        <div className="flex-grow border-t border-gray-100"></div>
      </div>

      <button
        type="button"
        className="w-full py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-[14px] hover:bg-gray-50 flex items-center justify-center gap-3 transition-all"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/smartlock/google.svg" className="w-5 h-5" alt="Google" />
        Continue with Google
      </button> 
*/}

      <p className="text-center text-[14px] text-gray-500 font-medium mt-1">
        Already have an account?{" "}
        <a href="/auth/login" className="text-[#3a1292] font-bold hover:underline">Sign In</a>
      </p>
    </form>
  );
}
