import React, { useState } from "react";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Input } from "../../components/forms/Input";
import { Button } from "../../components/ui/Button";
import { apiFetch } from "../../lib/api";

function MailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email address is required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "rgba(0,196,164,0.1)",
          border: "1.5px solid rgba(0,196,164,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--brand)", fontSize: 28,
        }}>
          ✉
        </div>
        <div>
          <h2 style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.025em", marginBottom: 10 }}>
            Check your inbox
          </h2>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 360 }}>
            If <strong style={{ color: "var(--brand)" }}>{email}</strong> is registered, you'll receive a password reset link within a minute.
          </p>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 12 }}>
            The link expires in 1 hour and can only be used once.
          </p>
        </div>
        <a href="/auth/login" style={{ fontSize: "0.85rem", color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>
          ← Back to sign in
        </a>
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
          🔒
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
        <h2 style={{
          fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)", fontWeight: 900,
          color: "var(--brand)", letterSpacing: "-0.02em",
          lineHeight: 1.15, marginBottom: 8,
        }}>
          Forgot Password?
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Input
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          id="forgot-email"
          icon={<MailIcon />}
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          error={error}
        />

        <Button type="submit" fullWidth disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? "Sending…" : "Send Reset Link"}
        </Button>

        <p style={{ textAlign: "center", fontSize: "0.825rem", color: "var(--text-secondary)" }}>
          Remember your password?{" "}
          <a href="/auth/login" style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout role="job_seeker">
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
