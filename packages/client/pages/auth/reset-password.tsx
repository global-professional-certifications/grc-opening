import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Button } from "../../components/ui/Button";
import { apiFetch } from "../../lib/api";

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
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError("Both fields are required");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, token, password, confirmPassword }),
      });
      setDone(true);
      // Redirect to login after 3s
      setTimeout(() => router.push("/auth/login"), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "This reset link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          border: "2px solid var(--brand)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--brand)", fontSize: 32,
        }}>
          ✓
        </div>
        <div>
          <h2 style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", fontWeight: 900, color: "var(--brand)", letterSpacing: "-0.025em", marginBottom: 10 }}>
            Password Reset!
          </h2>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
            Your password has been updated. Redirecting you to sign in…
          </p>
        </div>
      </div>
    );
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
          fontSize: 22,
        }}>
          🔑
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
        <h2 style={{
          fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)", fontWeight: 900,
          color: "var(--brand)", letterSpacing: "-0.02em",
          lineHeight: 1.15, marginBottom: 8,
        }}>
          Set New Password
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* New Password */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="reset-password" className="grc-label">New Password</label>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              color: "var(--text-muted)", display: "flex", alignItems: "center",
            }}>
              <LockIcon />
            </span>
            <input
              id="reset-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="grc-input"
              style={{ paddingLeft: 42, paddingRight: 42 }}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
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

        {/* Confirm Password */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="reset-confirm-password" className="grc-label">Confirm Password</label>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              color: "var(--text-muted)", display: "flex", alignItems: "center",
            }}>
              <LockIcon />
            </span>
            <input
              id="reset-confirm-password"
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              className="grc-input"
              style={{ paddingLeft: 42, paddingRight: 42 }}
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(p => !p)}
              style={{
                position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-muted)", display: "flex", alignItems: "center", padding: 0,
              }}
              aria-label="Toggle confirm password visibility"
            >
              <EyeIcon open={showConfirm} />
            </button>
          </div>
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
          {loading ? "Resetting…" : "Reset Password"}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [params, setParams] = useState<{ token: string; email: string } | null>(null);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const token = router.query.token as string | undefined;
    const email = router.query.email as string | undefined;
    if (!token || !email) {
      setInvalid(true);
    } else {
      setParams({ token, email });
    }
  }, [router.isReady, router.query.token, router.query.email]);

  return (
    <AuthLayout role="job_seeker">
      {invalid ? (
        <div style={{ textAlign: "center" }}>
          <h2 style={{ color: "#f87171", fontWeight: 800, marginBottom: 12 }}>Invalid Link</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 20 }}>
            This reset link is missing required parameters. Please request a new one.
          </p>
          <a href="/auth/forgot-password" style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>
            Request a new reset link
          </a>
        </div>
      ) : params ? (
        <ResetPasswordForm token={params.token} email={params.email} />
      ) : null}
    </AuthLayout>
  );
}
