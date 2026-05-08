import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DashboardThemeProvider, useDashboardTheme } from "../../contexts/DashboardThemeContext";
import { useUser } from "../../contexts/UserContext";
import { EmployerJobsProvider } from "../../contexts/EmployerJobsContext";
import { NotificationsBell } from "../../modules/dashboard/NotificationsBell";

const SYNE    = { fontFamily: "'Syne', sans-serif" };
const MONO    = { fontFamily: "'JetBrains Mono', monospace" };
const MANROPE = { fontFamily: "'Manrope', sans-serif" };

function NavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  const router = useRouter();
  const active = router.pathname === href;
  return (
    <a href={href} className={`db-nav-item${active ? " active" : ""}`}>
      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}

function EmployerDashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { theme } = useDashboardTheme();
  void theme;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useUser();
  const router = useRouter();
  const [employerProfile, setEmployerProfile] = useState<{ companyName?: string } | null>(null);

  // Load employer profile for real company name in the nameplate
  useEffect(() => {
    if (!user || user.role !== "EMPLOYER") return;
    import("../../lib/api").then(({ apiFetch }) => {
      apiFetch<{ profile: { companyName?: string } }>("/profile/employer")
        .then(res => setEmployerProfile(res.profile))
        .catch(() => setEmployerProfile(null));
    });
  }, [user]);

  // Derive display values: employer profile's companyName, then fall back to user email's local part
  const displayName =
    employerProfile?.companyName ||
    user?.firstName ||
    (user?.email ? user.email.split("@")[0] : "") ||
    "Employer";
  const initials = displayName
    .split(/[\s._-]+/)
    .map((w: string) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "E";

  // Guard: Redirect non-employers or unauthenticated users.
  // Blocks rendering until role is verified so a seeker never sees employer content.
  const [roleChecked, setRoleChecked] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("grc_token");
    if (!token) {
      router.replace("/auth/login");
      return;
    }
    if (!user) return;
    if (user.role !== "EMPLOYER") {
      router.replace("/dashboard");
      return;
    }
    setRoleChecked(true);
  }, [router, user]);

  if (!roleChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--db-bg)", color: "var(--db-text-muted)" }}>
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-3">
          <span className="h-6 w-6 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden="true" />
          <p className="text-xs">Verifying access…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={MANROPE}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-48 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex min-h-screen">

        {/* ────────────────────────────────────────────────────────────────────────── */}
        <aside
          className={`fixed left-0 top-0 h-full w-[260px] flex flex-col z-50 transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
          style={{
            background: "var(--db-sidebar-bg)",
            borderRight: "1px solid var(--db-sidebar-border)",
            willChange: "transform",
          }}
        >
          {/* Logo */}
          <div className="p-6 flex items-center gap-3 shrink-0">
            <div
              className="w-8 h-8 rounded flex items-center justify-center shrink-0"
              style={{ background: "var(--db-primary)" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--db-primary-text)" }}>
                shield_person
              </span>
            </div>
            <div>
              <h1
                className="text-base tracking-tight uppercase font-semibold leading-tight"
                style={{ ...SYNE, color: "var(--db-sidebar-logo-text)" }}
              >
                GRC <span style={{ color: "var(--db-primary)" }}>Openings</span>
              </h1>
              <p
                className="text-[9px] uppercase tracking-widest leading-none mt-0.5"
                style={{ ...MONO, color: "var(--db-text-muted)" }}
              >
                Employer Portal
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-2 overflow-y-auto scrollbar-hide space-y-6">
            <div>
              <p
                className="px-2 text-[11px] uppercase tracking-widest mb-3"
                style={{ ...MONO, color: "var(--db-sidebar-section)" }}
              >
                Main Menu
              </p>
              <div className="space-y-0.5">
                <NavItem href="/employer/dashboard"      icon="dashboard"       label="Dashboard" />
                <NavItem href="/employer/post-job"       icon="add_circle"      label="Post a Job" />
                <NavItem href="/employer/jobs"           icon="work_history"    label="My Job Listings" />
                <NavItem href="/employer/applicants"     icon="group"           label="Applicants" />
                <NavItem href="/employer/notifications"  icon="notifications"   label="Notifications" />
              </div>
            </div>

            <div>
              <p
                className="px-2 text-[11px] uppercase tracking-widest mb-3"
                style={{ ...MONO, color: "var(--db-sidebar-section)" }}
              >
                Account
              </p>
              <div className="space-y-0.5">
                <NavItem href="/employer/profile"  icon="business"  label="Company Profile" />
                <NavItem href="/employer/settings" icon="settings"  label="Settings" />
                <button
                  type="button"
                  onClick={() => { logout(); router.replace('/auth/login'); }}
                  className="db-nav-item w-full text-left"
                  style={{ color: "var(--db-sidebar-nav-text)" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          </nav>

          {/* Company block */}
          <div
            className="p-5 shrink-0"
            style={{
              borderTop: "1px solid var(--db-sidebar-border)",
              background: "var(--db-sidebar-user-bg)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  background: "var(--db-primary-10)",
                  color: "var(--db-primary)",
                  border: "1px solid var(--db-primary-20)",
                  ...MONO,
                }}
              >
                {initials}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate" style={{ color: "var(--db-sidebar-user-text)" }}>
                  {displayName}
                </p>
                <p className="text-[10px] uppercase tracking-wide" style={{ ...MONO, color: "var(--db-primary)" }}>
                  Employer
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ────────────────── Mobile header bar ───────────────────────────────────── */}
        <div
          className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 h-14"
          style={{ background: "var(--db-sidebar-bg)", borderBottom: "1px solid var(--db-sidebar-border)" }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg"
            style={{ color: "var(--db-text-secondary)" }}
            aria-label="Open sidebar"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>menu</span>
          </button>
          <span
            className="text-sm font-semibold uppercase tracking-tight"
            style={{ ...SYNE, color: "var(--db-text)" }}
          >
            GRC <span style={{ color: "var(--db-primary)" }}>Openings</span>
          </span>
        </div>

        {/* ────────────────── Main content ────────────────────────────────────────── */}
        <main
          className="relative lg:ml-[260px] flex-1 min-h-screen"
          style={{
            background: "var(--db-bg)",
            color: "var(--db-text)",
            minWidth: 0,
          }}
        >
          {/* Top bar with notification bell — hidden on the notifications page itself */}
          {router.pathname !== '/employer/notifications' && (
            <div className="sticky top-0 z-20 flex items-center justify-end px-6 lg:px-8 py-4 lg:py-5" style={{ background: "var(--db-bg)", borderBottom: "1px solid var(--db-border)" }}>
              <NotificationsBell />
            </div>
          )}
          <div className="p-6 lg:p-8 space-y-6 lg:space-y-8 pt-4 lg:pt-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function EmployerDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardThemeProvider>
      <EmployerJobsProvider>
        <EmployerDashboardLayoutInner>{children}</EmployerDashboardLayoutInner>
      </EmployerJobsProvider>
    </DashboardThemeProvider>
  );
}
