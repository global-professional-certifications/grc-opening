import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ModernInput } from "../../../components/ui/ModernInput";
import { PasswordStrength } from "./PasswordStrength";
import { setToken, setStoredUser } from "../../../lib/auth";
import { useUser } from "../../../contexts/UserContext";
import { UserRole } from "../../../lib/userRole";

interface Fields {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const EMPTY: Fields = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

function validate(data: Fields): Partial<Fields> {
  const errs: Partial<Fields> = {};
  if (!data.fullName.trim()) errs.fullName = "Required";
  if (!data.email.trim()) errs.email = "Email required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = "Invalid email";
  if (!data.phone.trim()) errs.phone = "Required";
  if (!data.password) errs.password = "Required";
  else if (data.password.length < 8) errs.password = "Min 8 chars";
  if (!data.confirmPassword) errs.confirmPassword = "Required";
  else if (data.confirmPassword !== data.password) errs.confirmPassword = "Passwords do not match";
  return errs;
}

export function CandidateForm({ currentRole = "job_seeker" }: { currentRole?: "job_seeker" | "employer" }) {
  const router = useRouter();
  const { setUser } = useUser();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Fields>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
          fullName: fields.fullName,
          phone: fields.phone,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Registration failed");

      localStorage.setItem("grc_local_token", data.token);
      setToken(data.token);

      const dbUser = { id: data.user.id, role: data.user.role, emailVerified: true, email: fields.email };
      setUser(dbUser as any);
      setStoredUser({ ...dbUser, fullName: fields.fullName, phone: fields.phone } as any);
      import("../../../lib/userRole").then(lib => lib.saveRole("job_seeker" as UserRole));

      // New account → send to profile to complete their setup
      router.push("/dashboard/profile");
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      setErrors(prev => ({ ...prev, email: msg }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3" style={{ fontFamily: "'Poppins', sans-serif" }}>

      <ModernInput
        label="Full Name"
        placeholder="John Doe"
        id="fullName"
        icon="person"
        maxLength={100}
        value={fields.fullName}
        onChange={(e) => {
          // Allowing only alphabets and spaces
          const sanitizedValue = e.target.value
            .replace(/[^A-Za-z\s]/g, "")
            .replace(/\s+/g, " ");

          set("fullName", sanitizedValue);
        }}
        error={errors.fullName}
      />

      <ModernInput
        label="Email Address"
        type="email"
        placeholder="name@email.com"
        id="email"
        icon="mail"
        maxLength={254} // RFC standard maximum email length
        value={fields.email}
        onChange={(e) => {
          // Trim spaces and normalize lowercase
          let value = e.target.value.trim().toLowerCase();
          const emailRegex =
            /^(?!.*\.\.)(?!.*\.$)[A-Za-z0-9._%-]{1,64}@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

          // Remove all internal spaces
          value = value.replace(/\s/g, "");

          set("email", value);

          // Live validation
          if (value && !emailRegex.test(value)) {
            setErrors((prev: any) => ({
              ...prev,
              email: "Please enter a valid email address",
            }));
          } else {
            setErrors((prev: any) => ({
              ...prev,
              email: "",
            }));
          }
        }}
        error={errors.email}
      />

      <ModernInput
        label="Phone Number"
        type="tel"
        placeholder="+12345678900"
        id="phone"
        icon="phone"
        maxLength={16}
        value={fields.phone}
        onChange={(e) => {
          let value = e.target.value;

          // Removing all characters except digits and "+"
          value = value.replace(/[^\d+]/g, "");

          // Ensuring "+" appears only at the beginning
          if (value.includes("+")) {
            value = "+" + value.replace(/\+/g, "").replace(/^\+/, "");
          }

          // Limiting of total digits to 15 (E.164 standard)
          const digitsOnly = value.replace(/\D/g, "").slice(0, 15);

          // Reconstruction of final value
          value = value.startsWith("+")
            ? `+${digitsOnly}`
            : digitsOnly;

          set("phone", value);
        }}
        error={errors.phone}
      />
      
      <div className="flex flex-col gap-2">
        <ModernInput
          label="Password"
          type={showPassword ? "text" : "password"}
          id="password"
          icon="lock"
          value={fields.password}
          onChange={(e) => set("password", e.target.value)}
          error={errors.password}

          rightIcon={showPassword ? "visibility_off" : "visibility"}
          onRightIconClick={() => setShowPassword(!showPassword)}
        />

        <PasswordStrength password={fields.password} />
      </div>

      <ModernInput
        label="Confirm Password"
        type={showConfirmPassword ? "text" : "password"}
        id="confirmPassword"
        icon="lock"
        value={fields.confirmPassword}
        onChange={(e) => set("confirmPassword", e.target.value)}
        error={errors.confirmPassword}

        rightIcon={showConfirmPassword ? "visibility_off" : "visibility"}
        onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-[#3a1292] text-white font-bold text-[15px] shadow-lg shadow-[#3a1292]/20 hover:bg-[#2e0e74] transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 mt-2"
      >
        {loading
          ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <>Create Account <span className="material-symbols-outlined text-[20px]">arrow_forward</span></>
        }
      </button>

      <p className="text-center text-[14px] text-gray-500 font-medium mt-1">
        Already have an account?{" "}
        <Link href={`/auth/login${currentRole === "employer" ? "?role=employer" : ""}`} className="text-[#3a1292] font-bold hover:underline">Sign In</Link>
      </p>
    </form>
  );
}
