import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ModernInput } from "../../../components/ui/ModernInput";
import { PasswordStrength } from "./PasswordStrength";
import { setToken, setStoredUser } from "../../../lib/auth";
import { useUser } from "../../../contexts/UserContext";
import { UserRole } from "../../../lib/userRole";

interface Fields {
  companyName: string;
  workEmail: string;
  password: string;
  confirmPassword: string;
}

const EMPTY: Fields = {
  companyName: "",
  workEmail: "",
  password: "",
  confirmPassword: "",
};

function validate(data: Fields): Partial<Fields> {
  const errs: Partial<Fields> = {};
  if (!data.companyName.trim()) errs.companyName = "Required";
  if (!data.workEmail.trim()) errs.workEmail = "Required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.workEmail)) errs.workEmail = "Invalid email";
  if (!data.password) errs.password = "Required";
  else if (data.password.length < 8) errs.password = "Min 8 chars";
  if (!data.confirmPassword) errs.confirmPassword = "Required";
  else if (data.confirmPassword !== data.password) errs.confirmPassword = "Passwords do not match";
  return errs;
}

export function EmployerForm({ currentRole = "employer" }: { currentRole?: "job_seeker" | "employer" }) {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/local/register-employer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fields.workEmail,
          password: fields.password,
          companyName: fields.companyName,
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

      // New account → send to profile to complete company setup
      router.push("/employer/profile");
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      setErrors(prev => ({ ...prev, workEmail: msg }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3" style={{ fontFamily: "'Poppins', sans-serif" }}>






      <ModernInput
        label="Company Name"
        placeholder="e.g. Acme GRC Solutions"
        id="companyName"
        icon="business"
        maxLength={100}
        value={fields.companyName}
        onChange={(e) => {
          let value = e.target.value;
          const companyNameRegex =
            /^(?!.*[&'.,()\-]{2,})(?!.*\s{2,})[A-Za-z0-9&'.,()\- ]{2, 100}$/;
          // Remove unsupported special characters
          value = value.replace(
            /[^A-Za-z0-9&'.,()\- ]/g,
            ""
          );

          // Remove leading spaces immediately
          value = value.replace(/^\s+/, "");

          // Normalize multiple spaces to single space
          value = value.replace(/\s{2,}/g, " ");

          // Prevent repeated garbage symbols like &&&& or ----
          value = value.replace(
            /([&'.,()\-]){2,}/g,
            "$1"
          );

          // Enforce maximum length
          value = value.slice(0, 100);

          set("companyName", value);

          const trimmedValue = value.trim();

          // Validation
          if (trimmedValue.length === 0) {
            setErrors((prev: any) => ({
              ...prev,
              companyName: "Company name is required",
            }));
          } else if (trimmedValue.length < 2) {
            setErrors((prev: any) => ({
              ...prev,
              companyName:
                "Company name must be at least 2 characters",
            }));
          } else if (
            !companyNameRegex.test(trimmedValue)
          ) {
            setErrors((prev: any) => ({
              ...prev,
              companyName:
                "Please enter a valid company name",
            }));
          } else {
            setErrors((prev: any) => ({
              ...prev,
              companyName: "",
            }));
          }
        }}
        onBlur={() => {
          // Trim trailing spaces on blur
          set(
            "companyName",
            fields.companyName.trim()
          );
        }}
        error={errors.companyName}
      />



      <ModernInput
        label="Work Email"
        type="email"
        placeholder="hr@company.com"
        id="workEmail"
        icon="alternate_email"
        maxLength={254} // RFC standard maximum email length
        value={fields.workEmail}
        onChange={(e) => {
          const workEmailRegex =
            /^(?!.*\.\.)(?!.*\.$)[A-Za-z0-9._%-]{1, 64}@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
          let value = e.target.value;

          // Trim leading/trailing spaces
          value = value.trim();

          // Normalize lowercase
          value = value.toLowerCase();

          // Remove all internal spaces
          value = value.replace(/\s/g, "");

          // Enforce max length
          value = value.slice(0, 254);

          set("workEmail", value);

          // Validation
          if (value.length === 0) {
            setErrors((prev: any) => ({
              ...prev,
              workEmail: "Work email is required",
            }));
          } else if (!workEmailRegex.test(value)) {
            setErrors((prev: any) => ({
              ...prev,
              workEmail:
                "Please enter a valid work email address",
            }));
          } else {
            setErrors((prev: any) => ({
              ...prev,
              workEmail: "",
            }));
          }
        }}
        onBlur={() => {
          // Final trim normalization on blur
          set(
            "workEmail",
            fields.workEmail.trim().toLowerCase()
          );
        }}
        error={errors.workEmail}
      />

      <div className="flex flex-col gap-2">
        <ModernInput
          label="Password" type={showPassword ? "text" : "password"} id="empPassword"
          icon="lock"
          value={fields.password} onChange={e => set("password", e.target.value)}
          error={errors.password}
          rightIcon={showPassword ? "visibility_off" : "visibility"}
          onRightIconClick={() => setShowPassword(!showPassword)}
        />
        <PasswordStrength password={fields.password} />
      </div>

      <ModernInput
        label="Confirm Password" type={showConfirmPassword ? "text" : "password"} id="confirmPassword"
        icon="lock"
        value={fields.confirmPassword} onChange={e => set("confirmPassword", e.target.value)}
        error={errors.confirmPassword}
        rightIcon={showConfirmPassword ? "visibility_off" : "visibility"}
        onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 mt-2 rounded-xl bg-[#3a1292] text-white font-bold text-[15px] shadow-lg shadow-[#3a1292]/20 hover:bg-[#2e0e74] transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3"
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
        <Link href={`/auth/login${currentRole === "job_seeker" ? "" : "?role=employer"}`} className="text-[#3a1292] font-bold hover:underline">Log In</Link>
      </p>
    </form>
  );
}
