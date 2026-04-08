import React, { useState, useEffect } from "react";
import { AuthLayout } from "../components/layout/AuthLayout";
import { RegistrationForm } from "../modules/auth/RegistrationForm";

export default function HomeRegister() {
  const [role, setRole] = useState<"job_seeker" | "employer">("job_seeker");

  // Lock body scroll for the fullscreen auth experience.
  // Restored on unmount so Dashboard / Profile pages are never affected.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <AuthLayout role={role}>
      <RegistrationForm onRoleChange={setRole} />
    </AuthLayout>
  );
}
