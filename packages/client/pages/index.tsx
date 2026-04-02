import React, { useState } from "react";
import { AuthLayout } from "../components/layout/AuthLayout";
import { RegistrationForm } from "../modules/auth/RegistrationForm";

export default function HomeRegister() {
  const [role, setRole] = useState<"job_seeker" | "employer">("job_seeker");

  return (
    <AuthLayout role={role}>
      <RegistrationForm onRoleChange={setRole} />
    </AuthLayout>
  );
}
