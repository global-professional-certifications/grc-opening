import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DashboardThemeProvider, useDashboardTheme } from "../../contexts/DashboardThemeContext";
import { useUser } from "../../contexts/UserContext";

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
  const { user } = useUser();
  const router = useRouter();

  // Derive display values from real user context
  const companyName = user?.firstName || "—";
  const initials = companyName
    .split(" ")
    .map((w: string) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  // Guard: Redirect non-employers or unauthenticated users
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("grc_token");
    if (!token) {
      router.replace("/auth/login");
      return;
    }
    
    // Redirect seekers away from employer pages
    if (user && user.role !== "EMPLOYER") {
      router.replace("/dashboard");
    }
  }, [router, user]);

  return (
    <div className="min-h-screen overflow-x-hidden" style={MANROPE}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen">

        {/* ΓöÇΓöÇ Sidebar ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
        <aside
          className={`fixed left-0 top-0 h-full w-[260px] flex flex-col z-50 transition-transform duration-300
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
          style={{
            background: "var(--db-sidebar-bg)",
            borderRight: "1px solid var(--db-sidebar-border)",
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
                className="px-4 text-[11px] uppercase tracking-widest mb-3"
                style={{ ...MONO, color: "var(--db-sidebar-section)" }}
              >
                Main Menu
              </p>
              <div className="space-y-0.5">
                <NavItem href="/employer/dashboard"   icon="dashboard"    label="Dashboard" />
                <NavItem href="/employer/post-job"    icon="add_circle"   label="Post a Job" />
                <NavItem href="/employer/jobs"        icon="work_history"  label="My Job Listings" />
                <NavItem href="/employer/applicants"  icon="group"        label="Applicants" />
                <NavItem href="/employer/analytics"   icon="bar_chart"    label="Analytics" />
              </div>
            </div>

            <div>
              <p
                className="px-4 text-[11px] uppercase tracking-widest mb-3"
                style={{ ...MONO, color: "var(--db-sidebar-section)" }}
              >
                Account
              </p>
              <div className="space-y-0.5">
                <NavItem href="/employer/profile"  icon="business"  label="Company Profile" />
                <NavItem href="/employer/settings" icon="settings"  label="Settings" />
                <a
                  href="/"
                  className="db-nav-item"
                  style={{ color: "var(--db-sidebar-nav-text)" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
                  <span className="text-sm font-medium">Logout</span>
                </a>
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
                  {companyName}
                </p>
                <p className="text-[10px] uppercase tracking-wide" style={{ ...MONO, color: "var(--db-primary)" }}>
                  Employer
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ΓöÇΓöÇ Mobile header bar ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
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

        {/* ΓöÇΓöÇ Main content ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
        <main
          className="lg:ml-[260px] flex-1 p-6 lg:p-8 space-y-6 lg:space-y-8 pt-20 lg:pt-8"
          style={{
            background: "var(--db-bg)",
            color: "var(--db-text)",
            minHeight: "100vh",
            minWidth: 0,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export function EmployerDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardThemeProvider>
      <EmployerDashboardLayoutInner>{children}</EmployerDashboardLayoutInner>
    </DashboardThemeProvider>
  );
}
