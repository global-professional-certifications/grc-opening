import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { KPISection } from "../../modules/dashboard/KPISection";
import { RecommendedJobs } from "../../modules/dashboard/RecommendedJobs";
import { RecentApplications } from "../../modules/dashboard/RecentApplications";
import { ProfileCompletion } from "../../modules/dashboard/ProfileCompletion";
import { GRCInsight } from "../../modules/dashboard/GRCInsight";
import { NotificationsBell } from "../../modules/dashboard/NotificationsBell";
import { useDashboardTheme } from "../../contexts/DashboardThemeContext";
import { useUser } from "../../contexts/UserContext";

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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function DashboardHeader() {
  const router = useRouter();
  const { theme, toggleTheme } = useDashboardTheme();
  const { user } = useUser();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const endpoint = user.role === "EMPLOYER" ? "/profile/employer" : "/profile/seeker";
    import("../../lib/api").then(({ apiFetch }) => {
      apiFetch<{ profile: any }>(endpoint)
        .then(res => setProfile(res.profile))
        .catch(console.error);
    });
  }, [user]);

  const firstName = profile?.firstName || profile?.representativeFirstName || user?.firstName || user?.email?.split("@")[0] || "there";

  return (
    <header className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold" style={{ color: "var(--db-text)" }}>
          {getGreeting()}, {firstName}
        </h2>
        <p className="mt-1 text-sm font-medium" style={{ color: "var(--db-text-muted)" }}>
          Here&apos;s what&apos;s happening with your compliance applications today.
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Bell */}
        <NotificationsBell />

        {/* Divider */}
        <div className="h-8 w-px bg-slate-800" style={{ background: "var(--db-border)" }} />

        {/* Upload Resume */}
        <button
          onClick={() => router.push("/dashboard/profile")}
          className="db-btn-primary px-5 py-2.5 font-bold text-sm rounded-full shadow-lg transition-all hover:-translate-y-0.5"
          style={{ background: "var(--db-primary)", color: "var(--db-primary-text)" }}
        >
          Upload Resume
        </button>
      </div>
    </header>
  );
}

export default function DashboardPage() {
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
