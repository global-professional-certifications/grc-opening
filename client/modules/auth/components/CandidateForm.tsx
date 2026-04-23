import React, { useState } from "react";
import { useRouter } from "next/router";
import { ModernInput } from "../../../components/ui/ModernInput";
import { PasswordStrength } from "./PasswordStrength";
import { setToken, setStoredUser } from "../../../lib/auth";
import { useUser } from "../../../contexts/UserContext";
import { UserRole } from "../../../lib/userRole";
import { getCurrencyFromLocation, COUNTRIES } from "../../../lib/currencyMap";
import { ModernSelect } from "../../../components/ui/ModernSelect";

interface Fields {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  password: string;
  location: string;
}

const EMPTY: Fields = {
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  password: "",
  location: "",
};

function validate(data: Fields): Partial<Fields> {
  const errs: Partial<Fields> = {};
  if (!data.firstName.trim()) errs.firstName = "Required";
  if (!data.lastName.trim()) errs.lastName = "Required";
  if (!data.email.trim()) errs.email = "Email required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = "Invalid email";
  if (!data.password) errs.password = "Required";
  else if (data.password.length < 8) errs.password = "Min 8 chars";
  if (!data.location.trim()) errs.location = "Required";
  return errs;
}


export function CandidateForm() {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/local/register-candidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fields.email,
          password: fields.password,
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
      const pref = getCurrencyFromLocation(fields.location);
      if (pref) localStorage.setItem("grc_preferred_currency", pref);

      const dbUser = { id: data.user.id, role: data.user.role, emailVerified: true, email: fields.email };
      setUser(dbUser as any);
      setStoredUser({ ...dbUser, firstName: fields.firstName, lastName: fields.lastName, location: fields.location } as any);
      import("../../../lib/userRole").then(lib => lib.saveRole("job_seeker" as UserRole));

      router.push("/dashboard");
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      setErrors(prev => ({ ...prev, email: msg }));
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
        label="Email Address" type="email" placeholder="name@email.com" id="email"
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
        className="w-full py-3.5 rounded-xl bg-[#3a1292] text-white font-bold text-[15px] shadow-lg shadow-[#3a1292]/20 hover:bg-[#2e0e74] transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3"
      >
        {loading
          ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <>Create Account <span className="material-symbols-outlined text-[20px]">arrow_forward</span></>
        }
      </button>

      <p className="text-center text-[14px] text-gray-500 font-medium mt-1">
        Already have an account?{" "}
        <a href="/auth/login" className="text-[#3a1292] font-bold hover:underline">Sign In</a>
      </p>
    </form>
  );
}
