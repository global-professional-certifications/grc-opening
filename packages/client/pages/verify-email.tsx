import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AuthLayout } from "../components/layout/AuthLayout";
import { EmailVerificationFlow } from "../modules/auth/EmailVerificationFlow";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // Lock body scroll consistent with the registration page
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    // Primary source: sessionStorage (set by the registration form).
    const stored = sessionStorage.getItem("grc_pending_verification_email");
    if (stored) {
      setEmail(stored);
      return;
    }

    // Dev/test fallback: accept ?email=... in the URL so this page can be
    // reached directly without going through registration.
    // TODO: Remove this fallback (or gate it behind NODE_ENV) before launch.
    const queryEmail = router.isReady
      ? (router.query.email as string | undefined)
      : undefined;

    if (queryEmail) {
      setEmail(queryEmail);
      return;
    }

    // Nothing found — bounce back to registration.
    if (router.isReady) {
      router.replace("/");
    }
  }, [router, router.isReady, router.query.email]);

  if (!email) {
    // Brief blank while we read sessionStorage / redirect
    return null;
  }

  return (
    <AuthLayout role="job_seeker">
      <div style={{
        width: "100%",
        maxWidth: 480,
        display: "flex",
        flexDirection: "column",
        gap: "clamp(20px, 3vh, 36px)",
      }}>
        <EmailVerificationFlow email={email} />
      </div>
    </AuthLayout>
  );
}
