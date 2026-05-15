import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { RegistrationForm } from "../../modules/auth/RegistrationForm";

export default function HomeRegister() {
  const router = useRouter();
  const initialRole: "job_seeker" | "employer" =
    router.query.role === "employer" ? "employer" : "job_seeker";

  const [role, setRole] = useState<"job_seeker" | "employer">(initialRole);

  // Sync if query param arrives after hydration
  useEffect(() => {
    if (router.isReady) {
      setRole(router.query.role === "employer" ? "employer" : "job_seeker");
    }
  }, [router.isReady, router.query.role]);

  // Redirect-if-authenticated, with back/forward guard: if the user arrived here
  // via the browser back button, destroy the session (same logic as login.tsx).
  useEffect(() => {
    const token = localStorage.getItem("grc_token");
    if (!token) return;
    try {
      const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isBackForward = navEntry?.type === "back_forward" || (performance.navigation as any)?.type === 2;
      if (isBackForward) {
        localStorage.removeItem("grc_token");
        localStorage.removeItem("grc_user");
        return;
      }
      const user = JSON.parse(localStorage.getItem("grc_user") ?? "null");
      if (user?.role) {
        window.location.replace(
          user.role === "EMPLOYER" ? "/employer/dashboard" : "/dashboard"
        );
      }
    } catch {
      // malformed storage — let the user register fresh
    }
  }, []); // empty deps — run exactly once on mount

  // Lock body scroll for the fullscreen auth experience.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <AuthLayout role={role}>
      <RegistrationForm initialRole={initialRole} onRoleChange={setRole} />
    </AuthLayout>
  );
}
