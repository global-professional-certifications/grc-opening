import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { EmployerDashboardLayout } from "../../../components/layout/EmployerDashboardLayout";
import { EmployerStatsOverview } from "../../../modules/employer/dashboard/EmployerStatsOverview";
import { LatestApplicants } from "../../../modules/employer/dashboard/LatestApplicants";
import { ActiveJobListings } from "../../../modules/employer/dashboard/ActiveJobListings";
import { useDashboardTheme } from "../../../contexts/DashboardThemeContext";

const SYNE = { fontFamily: "'Syne', sans-serif" };
const MONO = { fontFamily: "'JetBrains Mono', monospace" };

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function EmployerDashboardHeader() {
  const { theme, toggleTheme } = useDashboardTheme();
  const router = useRouter();

  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      {/* Left: Title + welcome */}
      <div>
        <h2
          className="text-2xl lg:text-3xl font-semibold"
          style={{ ...SYNE, color: "var(--db-text)" }}
        >
          Dashboard
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
          Welcome back,{" "}
          <span style={{ color: "var(--db-text)", fontWeight: 600 }}>TechCorp Recruitment.</span>
        </p>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Notification bell */}
        <button
          className="w-9 h-9 flex items-center justify-center rounded-full border relative transition-colors"
          style={{ background: "var(--db-card)", borderColor: "var(--db-border)" }}
          aria-label="Notifications"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 19, color: "var(--db-text-secondary)" }}
          >
            notifications
          </span>
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"
            style={{ border: "2px solid var(--db-card)" }}
          />
        </button>

        {/* Divider */}
        <div className="h-7 w-px" style={{ background: "var(--db-border)" }} />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-full border transition-colors"
          style={{
            background: "var(--db-card)",
            borderColor: "var(--db-border)",
            color: "var(--db-text-secondary)",
          }}
          aria-label="Toggle theme"
          title={theme === "dark" ? "Switch to Light mode" : "Switch to Dark mode"}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Post a Job CTA */}
        <button
          onClick={() => router.push("/employer/post-job")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-full transition-all db-btn-primary"
          style={{ background: "var(--db-primary)", color: "var(--db-primary-text)", ...MONO }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>add</span>
          Post a Job
        </button>
      </div>
    </header>
  );
}

export default function EmployerDashboardPage() {
  // Hide the global auth theme toggle on dashboard pages
  useEffect(() => {
    const toggle = document.querySelector<HTMLElement>(".theme-toggle");
    if (toggle) toggle.style.display = "none";
    return () => {
      if (toggle) toggle.style.display = "";
    };
  }, []);

  return (
    <EmployerDashboardLayout>
      {/* Header */}
      <EmployerDashboardHeader />

      {/* Stats overview */}
      <EmployerStatsOverview />

      {/* Latest applicants */}
      <LatestApplicants />



      {/* Active job listings */}
      <ActiveJobListings />
    </EmployerDashboardLayout>
  );

  
}
