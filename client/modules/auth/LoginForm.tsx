import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { ModernInput } from "../../components/ui/ModernInput";
import { apiFetch } from "../../lib/api";
import { setToken, setStoredUser, isFirstLogin, markVisited } from "../../lib/auth";
import { useUser } from "../../contexts/UserContext";
import { getDashboardPath, UserRole } from "../../lib/userRole";
import { COUNTRY_CODE_TO_CURRENCY, getCurrencyFromLocation } from "../../lib/currencyMap";

interface LoginResponse {
  token: string;
  user: { id: string; email: string; role: string; emailVerified: boolean };
}

interface SeekerProfileResponse {
  profile: { firstName: string; lastName: string; headline?: string };
}

interface EmployerProfileResponse {
  profile: { companyName: string };
}

interface LoginFormProps {
  initialRole?: "job_seeker" | "employer";
  onRoleChange?: (role: "job_seeker" | "employer") => void;
}

export function LoginForm({ initialRole = "job_seeker", onRoleChange }: LoginFormProps) {
  const router = useRouter();
  const { setUser } = useUser();

  const [activeRole, setActiveRole] = useState<"job_seeker" | "employer">(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Keep local state in sync when the parent updates from URL query
  useEffect(() => { setActiveRole(initialRole); }, [initialRole]);

  function handleRoleSwitch(role: "job_seeker" | "employer") {
    setActiveRole(role);
    onRoleChange?.(role);
  }

  const verified = router.query.verified === "true";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password");
      return;
    }
    setError("");
    setLoading(true);

    try {
      // 1. Call Local Auth API — pass selected role so the server can enforce role-specific login
      const requestedRole = activeRole === "employer" ? "EMPLOYER" : "JOB_SEEKER";
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${API_URL}/auth/local/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: requestedRole }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed");

      // 2. Store the local token & initialize auth bridge
      localStorage.setItem("grc_local_token", data.token);
      setToken(data.token); // Updates api.ts bridge
      
      // 3. Fetch user info 
      const meRes = await apiFetch<{ user: { id: string; role: string; email_verified: boolean } }>("/auth/me");
      
      const dbUser = { 
        id: meRes.user.id,
        role: meRes.user.role,
        emailVerified: meRes.user.email_verified,
        email 
      };

      // 4. Update Global State
      setUser(dbUser as any);
      setStoredUser(dbUser as any);
      
      const roleEnum = (dbUser.role === "EMPLOYER" ? "employer" : "job_seeker") as UserRole;
      import("../../lib/userRole").then(lib => lib.saveRole(roleEnum));

      // Set default currency from country/location for seekers (if not already set)
      if (dbUser.role === "JOB_SEEKER" && !localStorage.getItem("grc_preferred_currency")) {
        apiFetch<{ profile: { country?: string; location?: string } }>("/profile/seeker").then(r => {
          const currency =
            COUNTRY_CODE_TO_CURRENCY[(r.profile?.country ?? "").toLowerCase()] ??
            getCurrencyFromLocation(r.profile?.location ?? "");
          if (currency) localStorage.setItem("grc_preferred_currency", currency);
        }).catch(() => {});
      }

      // 5. Redirect based on role:
      //    - Employers  → employer dashboard (management hub)
      //    - Job Seekers → jobs marketplace (the primary action after login)
      router.push(dbUser.role === "EMPLOYER" ? "/employer/dashboard" : "/dashboard/jobs");
    } catch (err: any) {
      console.error("[LocalLogin] Error:", err.message);
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in duration-500" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Heading */}
      <div className="mb-2">
        <h2 className="text-[28px] font-bold tracking-tight text-[#3a1292] leading-tight">
          Welcome Back
        </h2>
        <p className="text-[14px] text-gray-500 font-medium">
          Sign in to access your professional dashboard.
        </p>
      </div>

      {/* Premium Capsule Role Switcher */}
      <div className="flex p-1.5 bg-gray-100 rounded-2xl relative overflow-hidden mb-2">
        {(["job_seeker", "employer"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => handleRoleSwitch(r)}
            className={`
              flex-1 py-2.5 rounded-xl text-[13px] font-bold tracking-wide z-10 transition-all duration-300
              ${activeRole === r 
                ? "bg-[#3a1292] text-white shadow-lg" 
                : "text-gray-500 hover:text-gray-900"
              }
            `}
          >
            {r === "job_seeker" ? "Job Seeker" : "Employer"}
          </button>
        ))}
      </div>

      {/* Verified Banner */}
      {verified && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-100 flex items-center gap-3 text-green-700 mb-2">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span className="text-[13px] font-semibold">Email verified! You can now sign in.</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <ModernInput
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          id="login-email"
          icon="mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <ModernInput
          label="Password"
          type={showPassword ? "text" : "password"}
          id="login-password"
          icon="lock"
          value={password}
          onChange={e => setPassword(e.target.value)}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-[#3a1292] transition-colors p-1"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          }
        />

        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-[#3a1292] focus:ring-[#3a1292] cursor-pointer transition-all"
            />
            <span className="text-[13px] font-medium text-gray-500 group-hover:text-gray-900 transition-colors leading-none">
              Stay signed in
            </span>
          </label>
          <a href="/auth/forgot-password" 
             className="text-[12px] font-bold text-[#3a1292] hover:opacity-80 transition-opacity uppercase tracking-wider leading-none">
            Forgot Password?
          </a>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 animate-in shake duration-300 mb-2">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span className="text-[13px] font-semibold">{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`
            w-full py-3.5 rounded-xl bg-[#3a1292] text-white font-bold text-[15px] shadow-lg shadow-[#3a1292]/20
            hover:bg-[#2e0e74] hover:shadow-xl hover:shadow-[#3a1292]/30
            active:transform active:scale-[0.98]
            transition-all duration-300 flex items-center justify-center gap-3
            disabled:opacity-70 disabled:cursor-not-allowed
          `}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Sign In
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </>
          )}
        </button>

{/* Hiding Google Auth for now as it is not implemented */}
{/* 
        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-gray-100"></div>
          <span className="flex-shrink mx-4 text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase">
            OR
          </span>
          <div className="flex-grow border-t border-gray-100"></div>
        </div>

        <button
          type="button"
          className="w-full py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-[14px] hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 flex items-center justify-center gap-3"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/smartlock/google.svg" className="w-5 h-5" alt="Google" />
          Continue with Google
        </button> 
*/}

        <p className="text-center text-[14px] text-gray-500 font-medium mt-2">
          New to the platform?{" "}
          <a
            href={`/auth/register${activeRole === "employer" ? "?role=employer" : ""}`}
            className="text-[#3a1292] font-bold hover:underline"
          >
            Create account
          </a>
        </p>
      </form>
    </div>
  );
}
