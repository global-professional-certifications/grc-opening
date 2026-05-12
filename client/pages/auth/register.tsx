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
