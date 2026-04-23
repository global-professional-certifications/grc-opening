import React, { useState } from "react";
import { useRouter } from "next/router";
import { ModernInput } from "../../../components/ui/ModernInput";
import { ModernSelect } from "../../../components/ui/ModernSelect";
import { PasswordStrength } from "./PasswordStrength";
import { setToken, setStoredUser } from "../../../lib/auth";
import { useUser } from "../../../contexts/UserContext";
import { UserRole } from "../../../lib/userRole";
import { COUNTRIES } from "../../../lib/currencyMap";

interface Fields {
  firstName: string;
  middleName: string;
  lastName: string;
  companyName: string;
  workEmail: string;
  password: string;
  location: string;
}

const EMPTY: Fields = {
  firstName: "",
  middleName: "",
  lastName: "",
  companyName: "",
  workEmail: "",
  password: "",
  location: "",
};

function validate(data: Fields): Partial<Fields> {
  const errs: Partial<Fields> = {};
  if (!data.firstName.trim()) errs.firstName = "Required";
  if (!data.lastName.trim()) errs.lastName = "Required";
  if (!data.companyName.trim()) errs.companyName = "Required";
  if (!data.workEmail.trim()) errs.workEmail = "Required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.workEmail)) errs.workEmail = "Invalid email";
  if (!data.password) errs.password = "Required";
  else if (data.password.length < 8) errs.password = "Min 8 chars";
  if (!data.location.trim()) errs.location = "Required";
  return errs;
}

export function EmployerForm() {
  const router = useRouter();
  const { setUser } = useUser();
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/local/register-employer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fields.workEmail,
          password: fields.password,
          companyName: fields.companyName,
          firstName: fields.firstName,
          middleName: fields.middleName,
          lastName: fields.lastName,
          location: fields.location,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Registration failed");

      localStorage.setItem("grc_local_token", data.token);
      setToken(data.token);

      const dbUser = { id: data.user.id, role: data.user.role, emailVerified: true, email: fields.workEmail };
      setUser(dbUser as any);
      setStoredUser(dbUser as any);
      import("../../../lib/userRole").then(lib => lib.saveRole("employer" as UserRole));

      router.push("/employer/dashboard");
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      setErrors(prev => ({ ...prev, workEmail: msg }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3" style={{ fontFamily: "'Poppins', sans-serif" }}>

      {/* Name row */}
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
        label="Company Name" placeholder="e.g. Acme GRC Solutions" id="companyName"
        icon="business"
        value={fields.companyName} onChange={e => set("companyName", e.target.value)}
        error={errors.companyName}
      />

      <ModernInput
        label="Work Email" type="email" placeholder="hr@company.com" id="workEmail"
        icon="alternate_email"
        value={fields.workEmail} onChange={e => set("workEmail", e.target.value)}
        error={errors.workEmail}
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
        <ModernSelect
          label="Country" id="location"
          icon="public"
          options={COUNTRIES}
          placeholder="Select country"
          value={fields.location} onChange={e => set("location", e.target.value)}
          error={errors.location}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 mt-1 rounded-xl bg-[#3a1292] text-white font-bold text-[15px] shadow-lg shadow-[#3a1292]/20 hover:bg-[#2e0e74] transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3"
      >
        {loading
          ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <>Get Started <span className="material-symbols-outlined text-[20px]">arrow_forward</span></>
        }
      </button>

      <p className="text-center text-[12px] text-gray-500 leading-relaxed px-4">
        By continuing, you agree to our{" "}
        <a href="#" className="text-[#3a1292] font-bold hover:underline">Terms</a> &{" "}
        <a href="#" className="text-[#3a1292] font-bold hover:underline">Privacy</a>.
      </p>

      <p className="text-center text-[14px] text-gray-500 font-medium">
        Already have an account?{" "}
        <a href="/auth/login" className="text-[#3a1292] font-bold hover:underline">Log In</a>
      </p>
    </form>
  );
}
