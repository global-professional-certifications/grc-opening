import React, { useState } from "react";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { LoginForm } from "../../modules/auth/LoginForm";

export default function Login() {
  const [role, setRole] = useState<"job_seeker" | "employer">("job_seeker");

  return (
    <AuthLayout role={role}>
      <LoginForm onRoleChange={setRole} />
    </AuthLayout>
  );
}
