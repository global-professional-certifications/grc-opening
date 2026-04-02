import React, { useEffect } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { KPISection } from "../../modules/dashboard/KPISection";
import { RecommendedJobs } from "../../modules/dashboard/RecommendedJobs";
import { RecentApplications } from "../../modules/dashboard/RecentApplications";
import { ProfileCompletion } from "../../modules/dashboard/ProfileCompletion";
import { GRCInsight } from "../../modules/dashboard/GRCInsight";
import { useDashboardTheme } from "../../contexts/DashboardThemeContext";

// ── Sun Icon (shown in dark mode → click to go light) ────────
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

// ── Moon Icon (shown in light mode → click to go dark) ───────
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function DashboardHeader() {
  const { theme, toggleTheme } = useDashboardTheme();

  return (
    <header className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-semibold" style={{ fontFamily: "'Syne', sans-serif", color: "var(--db-text)" }}>
          Good morning, Sarah 👋
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
          Here&apos;s what&apos;s happening with your compliance applications today.
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full border transition-colors relative"
          style={{ background: "var(--db-card)", borderColor: "var(--db-border)" }}
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--db-text-secondary)" }}>notifications</span>
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full" style={{ border: "2px solid var(--db-card)" }} />
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-slate-800" />

        {/* Theme toggle — matches bell size/style */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-full border transition-colors"
          style={{ background: "var(--db-card)", borderColor: "var(--db-border)", color: "var(--db-text-secondary)" }}
          aria-label="Toggle theme"
          title={theme === "dark" ? "Switch to Light mode" : "Switch to Dark mode"}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Upload Resume */}
        <button
          className="px-4 py-2 font-bold text-sm rounded-full hover:brightness-110 transition-all"
          style={{ background: "var(--db-primary)", color: "var(--db-primary-text)" }}
        >
          Upload Resume
        </button>
      </div>
    </header>
  );
}

export default function DashboardPage() {
  // Hide the auth theme toggle from _app.tsx on dashboard pages
  useEffect(() => {
    const toggle = document.querySelector<HTMLElement>(".theme-toggle");
    if (toggle) toggle.style.display = "none";
    return () => { if (toggle) toggle.style.display = ""; };
  }, []);

  return (
    <DashboardLayout>
      <DashboardHeader />
      <KPISection />
      <RecommendedJobs />
      <RecentApplications />
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ProfileCompletion />
        <GRCInsight />
      </section>
    </DashboardLayout>
  );
}
