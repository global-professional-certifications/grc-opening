import React, { useState, useRef } from "react";
import { ToggleTabs } from "../../components/ui/ToggleTabs";
import { CandidateForm } from "./components/CandidateForm";
import { EmployerForm } from "./components/EmployerForm";

type Role = "job_seeker" | "employer";
type AnimPhase = "idle" | "exiting" | "entering";

const HEADINGS: Record<Role, { title: string; sub: string }> = {
  job_seeker: {
    title: "Create Your Account",
    sub: "Join the elite network of GRC professionals.",
  },
  employer: {
    title: "Join the GRC Talent Network",
    sub: "Hire the top 1% of Governance, Risk, and Compliance professionals worldwide.",
  },
};

export function RegistrationForm({ onRoleChange }: { onRoleChange?: (role: Role) => void }) {
  // `role` drives the toggle UI immediately on click.
  // `renderedRole` is what's actually inside the animated container —
  // it only updates AFTER the exit animation finishes, so the user sees
  // the old content slide out before the new one slides in.
  const [role, setRole] = useState<Role>("job_seeker");
  const [renderedRole, setRenderedRole] = useState<Role>("job_seeker");
  const [phase, setPhase] = useState<AnimPhase>("idle");
  const pendingRole = useRef<Role | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleRoleChange(id: string) {
    const r = id as Role;
    if (r === role) return;

    // Snap the toggle indicator immediately — feels responsive
    setRole(r);
    onRoleChange?.(r);
    pendingRole.current = r;

    // Cancel any in-flight timer from a rapid double-click
    if (timerRef.current) clearTimeout(timerRef.current);

    // 1. Play exit animation on current form
    setPhase("exiting");

    // 2. After exit finishes (matches formExit duration: 160ms),
    //    swap content and play entry animation
    timerRef.current = setTimeout(() => {
      setRenderedRole(r);
      setPhase("entering");

      // 3. After entry finishes (matches formEnter duration: 220ms),
      //    return to idle so the next switch can fire immediately
      timerRef.current = setTimeout(() => {
        setPhase("idle");
      }, 220);
    }, 160);
  }

  // Map phase → CSS class (no key prop → no React remount → smooth swap)
  const formClass =
    phase === "exiting"  ? "form-role-exit"      :
    phase === "entering" ? "form-role-container"  :
                           "form-role-container";

  return (
    <div style={{ width: "100%" }}>
      {/* Heading fades with the same exit/enter rhythm */}
      <div
        className={phase === "exiting" ? "heading-exit" : "heading-animate"}
        style={{ marginBottom: 12 }}
      >
        <h2 style={{
          fontSize: "clamp(1.5rem, 2.5vw, 2.1rem)",
          fontWeight: 900,
          color: "var(--text-primary)",
          letterSpacing: "-0.025em",
          lineHeight: 1.2,
          marginBottom: 8,
        }}>
          {HEADINGS[renderedRole].title}
        </h2>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
          {HEADINGS[renderedRole].sub}
        </p>
      </div>

      {/* Toggle — updates instantly for snappy feel */}
      <div style={{ marginBottom: 14 }}>
        <ToggleTabs
          activeId={role}
          onChange={handleRoleChange}
          options={[
            { id: "job_seeker", label: "Job Seeker" },
            { id: "employer", label: "Employer" },
          ]}
        />
      </div>

      {/*
       * No key prop here — same DOM node is reused.
       * The class swaps drive the exit and entry CSS animations,
       * and renderedRole swaps mid-transition so the user sees
       * old content fade out → new content fade in.
       */}
      <div className={formClass}>
        {renderedRole === "job_seeker" ? <CandidateForm /> : <EmployerForm />}
      </div>
    </div>
  );
}
