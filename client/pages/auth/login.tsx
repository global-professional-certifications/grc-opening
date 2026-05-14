import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { LoginForm } from "../../modules/auth/LoginForm";

export default function Login() {
  const router = useRouter();
  const [role, setRole] = useState<"job_seeker" | "employer">("job_seeker");

  useEffect(() => {
    if (router.isReady) {
      setRole(router.query.role === "employer" ? "employer" : "job_seeker");
    }
  }, [router.isReady, router.query.role]);

  return (
    <AuthLayout role={role}>
      <LoginForm initialRole={role} onRoleChange={setRole} />
    </AuthLayout>
  );
}
