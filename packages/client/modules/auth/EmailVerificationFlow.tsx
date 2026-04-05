import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { OtpInput } from "../../components/auth/OtpInput";
import { Button } from "../../components/ui/Button";

// ─── Constants ───────────────────────────────────────────
const RESEND_COOLDOWN = 60; // seconds
const REDIRECT_DELAY = 3000; // ms before dashboard redirect

// ─── Mock API placeholders ────────────────────────────────
// TODO: Replace these with real apiFetch calls once the backend is ready.

/** Simulates OTP verification (1.5 s delay). Typing "000000" triggers an error state for testing. */
function mockVerifyOtp(_email: string, otp: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (otp === "000000") {
        reject(new Error("Invalid or expired code."));
      } else {
        resolve();
      }
    }, 1500);
  });
}

/** Simulates resending an OTP (1 s delay, always succeeds). */
function mockSendOtp(_email: string): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 1000));
}

// ─── Icons ───────────────────────────────────────────────
function MailIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ─── Subcomponents ───────────────────────────────────────

function StepRow({ number, label }: { number: number; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{
        width: 30, height: 30, borderRadius: "50%",
        background: "var(--brand)", color: "#03120f",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: "0.85rem", flexShrink: 0,
      }}>
        {number}
      </div>
      <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>{label}</span>
    </div>
  );
}

function ConnectorLine() {
  return (
    <div style={{
      width: 1, height: 20, background: "var(--border)",
      marginLeft: 14,
    }} />
  );
}

// ─── Success Screen ──────────────────────────────────────

function SuccessScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min((elapsed / REDIRECT_DELAY) * 100, 100));
    }, 50);

    const redirect = setTimeout(() => {
      router.push("/dashboard");
    }, REDIRECT_DELAY);

    return () => {
      clearInterval(id);
      clearTimeout(redirect);
    };
  }, [router]);

  return (
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      {/* Animated check circle */}
      <div style={{
        width: 88, height: 88, borderRadius: "50%",
        border: "2px solid var(--brand)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--brand)",
        animation: "fade-up 0.4s ease both",
      }}>
        <CheckIcon />
      </div>

      <div style={{ animation: "fade-up 0.4s 0.1s ease both", opacity: 0, animationFillMode: "forwards" }}>
        <h2 style={{
          fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
          fontWeight: 900,
          color: "var(--brand)",
          letterSpacing: "-0.025em",
          marginBottom: 10,
        }}>
          Email Verified!
        </h2>
        <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Redirecting you to your dashboard in a few seconds…
        </p>
      </div>

      {/* Progress bar */}
      <div style={{
        width: "100%", maxWidth: 280,
        height: 3, borderRadius: 99,
        background: "var(--border)",
        overflow: "hidden",
        animation: "fade-up 0.4s 0.2s ease both", opacity: 0, animationFillMode: "forwards",
      }}>
        <div style={{
          height: "100%",
          width: `${progress}%`,
          background: "var(--brand)",
          borderRadius: 99,
          transition: "width 0.1s linear",
        }} />
      </div>
    </div>
  );
}

// ─── OTP Entry Screen ────────────────────────────────────

interface OtpScreenProps {
  email: string;
  onSuccess: () => void;
}

function OtpScreen({ email, onSuccess }: OtpScreenProps) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  // Countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const formatCountdown = (s: number) => {
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length < 6) {
      setError("Please enter all 6 digits.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await mockVerifyOtp(email, otp);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  }

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setResendMessage("");
    setError("");
    try {
      await mockSendOtp(email);
      setResendMessage("A new code has been sent to your inbox.");
      setOtp("");
      setResendCooldown(RESEND_COOLDOWN);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not resend code. Try again.");
    } finally {
      setResending(false);
    }
  }, [resendCooldown, resending, email]);

  const maskedEmail = email.replace(/(.{2}).+(@.+)/, "$1••••$2");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(18px, 2.5vh, 28px)", alignItems: "center" }}>
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "rgba(0,196,164,0.1)",
          border: "1.5px solid rgba(0,196,164,0.25)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          color: "var(--brand)", marginBottom: 16,
        }}>
          <MailIcon />
        </div>
        <h2 style={{
          fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)",
          fontWeight: 900,
          color: "var(--text-primary)",
          letterSpacing: "-0.025em",
          marginBottom: 8,
        }}>
          Check Your Inbox
        </h2>
        <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 340 }}>
          We&apos;ve sent a 6-digit verification code to{" "}
          <strong style={{ color: "var(--brand)" }}>{maskedEmail}</strong>
        </p>
      </div>

      {/* Steps */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "20px 24px",
        width: "100%",
        maxWidth: 380,
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}>
        <StepRow number={1} label="Open your email inbox" />
        <ConnectorLine />
        <StepRow number={2} label="Find the verification code" />
        <ConnectorLine />
        <StepRow number={3} label="Enter the 6-digit code below" />
      </div>

      {/* OTP form */}
      <form
        onSubmit={handleVerify}
        noValidate
        style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", alignItems: "center" }}
      >
        <OtpInput
          value={otp}
          onChange={val => { setOtp(val); setError(""); }}
          disabled={loading}
          error={!!error}
        />

        {error && (
          <p style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: "0.8rem", color: "#f87171",
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.2)",
            borderRadius: 8, padding: "8px 14px",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </p>
        )}

        {resendMessage && (
          <p style={{ fontSize: "0.8rem", color: "var(--brand)", textAlign: "center" }}>
            {resendMessage}
          </p>
        )}

        <Button
          type="submit"
          fullWidth
          disabled={loading || otp.length < 6}
          style={{ maxWidth: 380, opacity: otp.length < 6 ? 0.5 : 1 }}
        >
          {loading ? "Verifying…" : "Verify Email"}
        </Button>

        {/* Resend */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resending}
            style={{
              background: "none", border: "none", padding: 0,
              fontSize: "0.82rem", fontWeight: 600,
              color: resendCooldown > 0 ? "var(--text-muted)" : "var(--brand)",
              cursor: resendCooldown > 0 ? "default" : "pointer",
              textDecoration: resendCooldown > 0 ? "none" : "underline",
              textUnderlineOffset: 3,
              transition: "color 0.2s",
            }}
          >
            {resending ? "Sending…" : "Resend verification email"}
          </button>
          {resendCooldown > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>
              <ClockIcon />
              {formatCountdown(resendCooldown)}
            </span>
          )}
        </div>
      </form>

      {/* Wrong email fallback */}
      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "center" }}>
        Wrong email?{" "}
        <a
          href="/"
          style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}
        >
          Go back and re-register
        </a>
      </p>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────

interface EmailVerificationFlowProps {
  email: string;
}

export function EmailVerificationFlow({ email }: EmailVerificationFlowProps) {
  const [verified, setVerified] = useState(false);

  if (verified) {
    return <SuccessScreen />;
  }

  return <OtpScreen email={email} onSuccess={() => setVerified(true)} />;
}
