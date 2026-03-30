import React from "react";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { LoginForm } from "../../modules/auth/LoginForm";

export default function Login() {
  return (
    <AuthLayout role="job_seeker">
      <LoginForm />
    </AuthLayout>
  );
}
