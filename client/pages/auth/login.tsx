import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { LoginForm } from "../../modules/auth/LoginForm";

export default function Login() {
  const router = useRouter();
  const [role, setRole] = useState<"job_seeker" | "employer">("job_seeker");
  // null = still checking, true = no session (safe to show form), false = redirecting
  const [authChecked, setAuthChecked] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("grc_token");
    if (!token) {
      setAuthChecked(true);
      return;
    }
    try {
      // If the user arrived here via browser back/forward (full-page navigation),
      // destroy the session instead of bouncing them back to the dashboard.
      // This is the primary guard for the case where sidebar <a href> links cause
      // full-page navigations — popstate does not fire for those, so this is the
      // only reliable intercept point.
      const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isBackForward = navEntry?.type === "back_forward" || (performance.navigation as any)?.type === 2;
      if (isBackForward) {
        localStorage.removeItem("grc_token");
        localStorage.removeItem("grc_user");
        setAuthChecked(true);
        return;
      }
      const user = JSON.parse(localStorage.getItem("grc_user") ?? "null");
      if (user?.role) {
        window.location.replace(
          user.role === "EMPLOYER" ? "/employer/dashboard" : "/dashboard"
        );
        return;
      }
    } catch {
      // malformed storage — fall through and show the form
    }
    setAuthChecked(true);
  }, []); // empty deps — run exactly once on mount

  useEffect(() => {
    if (router.isReady) {
      setRole(router.query.role === "employer" ? "employer" : "job_seeker");
    }
  }, [router.isReady, router.query.role]);

  // Render nothing until we confirm no active session exists.
  // This closes the race window where the form briefly shows before the redirect fires.
  if (authChecked !== true) return null;

  return (
    <AuthLayout role={role}>
      <LoginForm initialRole={role} onRoleChange={setRole} />
    </AuthLayout>
  );
}
