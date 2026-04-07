import React, { useState } from "react";
import { useRouter } from "next/router";
import { Input } from "../../components/forms/Input";
import { Button } from "../../components/ui/Button";
import { apiFetch } from "../../lib/api";
import { setToken, setStoredUser, isFirstLogin, markVisited } from "../../lib/auth";
import { useUser } from "../../contexts/UserContext";

// ── Icons ────────────────────────────────────────

function MailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

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

// ── Login Form ───────────────────────────────────

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
  onRoleChange?: (role: "job_seeker" | "employer") => void;
}

export function LoginForm({ onRoleChange }: LoginFormProps) {
  const router = useRouter();
  const { setUser } = useUser();

  const [activeRole, setActiveRole] = useState<"job_seeker" | "employer">("job_seeker");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleRoleSwitch(role: "job_seeker" | "employer") {
    setActiveRole(role);
    onRoleChange?.(role);
  }

  const verified = router.query.verified === "true";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    setError("");
    setLoading(true);

    try {
      // 1. Login
      const res = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ 
          email, 
          password, 
          role: activeRole === "employer" ? "EMPLOYER" : "JOB_SEEKER" 
        }),
      });

      setToken(res.token);

      // 2. Fetch the user's name from their profile
      let firstName = "";
      let lastName = "";
      let headline = "";

      try {
        if (res.user.role === "JOB_SEEKER") {
          const profileRes = await apiFetch<SeekerProfileResponse>("/profile/seeker");
          firstName = profileRes.profile.firstName;
          lastName = profileRes.profile.lastName;
          headline = profileRes.profile.headline ?? "";
        } else if (res.user.role === "EMPLOYER") {
          const profileRes = await apiFetch<EmployerProfileResponse>("/profile/employer");
          firstName = profileRes.profile.companyName;
        }
      } catch {
        // Profile fetch failed — use email prefix as fallback
        firstName = email.split("@")[0];
      }

      // 3. Store user in context + localStorage
      const storedUser = { ...res.user, firstName, lastName, headline };
      setUser(storedUser);
      setStoredUser(storedUser);

      // First visit → profile setup; returning users → dashboard
      if (isFirstLogin(res.user.id)) {
        markVisited(res.user.id);
        router.push("/dashboard/profile");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ width: "100%" }}>
      {/* Logo mark */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: "rgba(0, 212, 178, 0.15)",
          border: "1.5px solid rgba(0, 212, 178, 0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </div>
      </div>

      {/* Heading */}
      <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
        <h2 style={{
          fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)", fontWeight: 900,
          color: "var(--brand)", letterSpacing: "-0.02em",
          lineHeight: 1.15, marginBottom: 8,
        }}>
          Welcome Back
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Sign in to your GRC Openings account.
        </p>
      </div>

      {/* Role toggle */}
      <div style={{
        display: "flex", background: "var(--bg-card)",
        border: "1px solid var(--border)", borderRadius: 10,
        padding: 4, marginBottom: "0.25rem",
      }}>
        {(["job_seeker", "employer"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => handleRoleSwitch(r)}
            style={{
              flex: 1, padding: "7px 0",
              borderRadius: 7, border: "none",
              fontSize: "0.8rem", fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.18s ease",
              background: activeRole === r ? "var(--brand)" : "transparent",
              color: activeRole === r ? "#03120f" : "var(--text-muted)",
            }}
          >
            {r === "job_seeker" ? "Job Seeker" : "Employer"}
          </button>
        ))}
      </div>

      {/* Email verified banner */}
      {verified && (
        <p style={{
          fontSize: "0.82rem", color: "#34d399",
          background: "rgba(52,211,153,0.08)",
          border: "1px solid rgba(52,211,153,0.25)",
          borderRadius: 8, padding: "8px 14px",
          marginBottom: 16, textAlign: "center",
        }}>
          ✓ Email verified! You can now sign in.
        </p>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        <Input
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          id="login-email"
          icon={<MailIcon />}
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        {/* Password with show/hide */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="login-password" className="grc-label">Password</label>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              color: "var(--text-muted)", display: "flex", alignItems: "center",
            }}>
              <LockIcon />
            </span>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="grc-input"
              style={{ paddingLeft: 42, paddingRight: 42 }}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              style={{
                position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-muted)", display: "flex", alignItems: "center", padding: 0,
              }}
              aria-label="Toggle password visibility"
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>

        {/* Remember me + Forgot password */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <label style={{
            display: "flex", alignItems: "center", gap: 8,
            fontSize: "0.825rem", color: "var(--text-secondary)", cursor: "pointer",
          }}>
            <input
              type="checkbox"
              id="remember-me"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              style={{ width: 16, height: 16, borderRadius: 4, accentColor: "var(--brand)", cursor: "pointer" }}
            />
            Remember me
          </label>
          <a href="/auth/forgot-password" style={{ fontSize: "0.825rem", color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>
            Forgot Password?
          </a>
        </div>

        {error && (
          <p style={{
            fontSize: "0.8rem", color: "#f87171",
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.2)",
            borderRadius: 8, padding: "8px 14px",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </p>
        )}

        <Button type="submit" fullWidth disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? "Signing in…" : (
            <>
              Sign In
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </>
          )}
        </Button>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", whiteSpace: "nowrap" }}>OR</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <Button variant="outline" fullWidth type="button">
          <GoogleIcon /> Continue with Google
        </Button>

        <p style={{ textAlign: "center", fontSize: "0.825rem", color: "var(--text-secondary)" }}>
          New to GRC Openings?{" "}
          <a href="/auth/register" style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>
            Create an account →
          </a>
        </p>
      </form>
    </div>
  );
}
