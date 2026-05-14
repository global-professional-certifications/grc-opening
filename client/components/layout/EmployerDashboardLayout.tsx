import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { DashboardThemeProvider, useDashboardTheme } from "../../contexts/DashboardThemeContext";
import { useUser } from "../../contexts/UserContext";
import { EmployerJobsProvider } from "../../contexts/EmployerJobsContext";
import { LogoutConfirmModal } from "../ui/LogoutConfirmModal";
import { EmployerProfileProvider, useEmployerProfile } from "../../contexts/EmployerProfileContext";
import { NotificationsBell } from "../../modules/dashboard/NotificationsBell";

const POPPINS = { fontFamily: "'Poppins', sans-serif" };
const MONO    = { fontFamily: "'JetBrains Mono', monospace" };

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useUser();
  const router = useRouter();
  const { companyName: displayName } = useEmployerProfile();

  const initials = displayName
    .split(/[\s._-]+/)
    .map((w: string) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "E";

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  function handleLogout() {
    logout();
    router.replace("/auth/login");
  }

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
    <div className="min-h-screen overflow-x-hidden" style={POPPINS}>
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
            <div>
              <h1
                className="text-base tracking-tight uppercase font-semibold leading-tight"
                style={{ ...POPPINS, color: "var(--db-sidebar-logo-text)" }}
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

            {/* ── Main Menu ── */}
            <div>
              <p
                className="px-2 text-[11px] uppercase tracking-widest mb-3 font-semibold"
                style={{ ...MONO, color: "var(--db-sidebar-section)" }}
              >
                Main Menu
              </p>
              <div className="space-y-0.5">
                <NavItem href="/employer/dashboard"  icon="dashboard"    label="Dashboard" />
                <NavItem href="/employer/profile"    icon="business"     label="Company Profile" />
                <NavItem href="/employer/post-job"   icon="add_circle"   label="Post a Job" />
                <NavItem href="/employer/jobs"       icon="work_history" label="My Job Listings" />
                <NavItem href="/employer/applicants" icon="group"        label="Applicants" />
              </div>
            </div>

            {/* ── Account ── */}
            <div>
              <p
                className="px-2 text-[11px] uppercase tracking-widest mb-3 font-semibold"
                style={{ ...MONO, color: "var(--db-sidebar-section)" }}
              >
                Account
              </p>
              <div className="space-y-0.5">
                <NavItem href="/employer/notifications" icon="notifications" label="Notifications" />
                <NavItem href="/employer/settings"      icon="settings"      label="Settings" />
              </div>
            </div>

          </nav>

          {/* User / company block — same popup pattern as candidate sidebar */}
          <div
            className="p-4"
            style={{
              borderTop: "1px solid var(--db-sidebar-border)",
              background: "var(--db-primary-10)",
              position: "relative",
            }}
            ref={menuRef}
          >
            {/* Popup — appears above the user block */}
            {menuOpen && (
              <div
                role="menu"
                style={{
                  position: "absolute", bottom: "calc(100% + 8px)", left: 16, right: 16,
                  background: "#ffffff", border: "1px solid var(--db-border)",
                  borderRadius: 12, boxShadow: "0 -8px 32px rgba(0,0,0,0.15)",
                  overflow: "hidden", zIndex: 200,
                }}
              >
                <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid var(--db-border)" }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--db-text)", marginBottom: 2 }}>{displayName}</p>
                  <p style={{ fontSize: "0.7rem", color: "var(--db-text-muted)" }}>{user?.email}</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); setShowLogoutModal(true); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    width: "100%", padding: "10px 14px",
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: "0.82rem", fontWeight: 600,
                    color: "#ef4444", textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
                  Sign out
                </button>
              </div>
            )}

            {/* Clickable company row */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", background: "none", border: "none",
                cursor: "pointer", borderRadius: 10, padding: "6px 8px",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--db-sidebar-nav-hover)")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                style={{ background: "var(--db-primary)", color: "#ffffff", fontWeight: 800, fontSize: "0.8rem", ...MONO }}
              >
                {initials}
              </div>
              <div className="overflow-hidden flex-1 text-left">
                <p className="text-sm font-bold truncate" style={{ color: "var(--db-text)" }}>{displayName}</p>
                <p className="text-xs truncate font-semibold" style={{ color: "var(--db-primary)", ...MONO }}>Employer</p>
              </div>
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 16, color: "var(--db-text-muted)", flexShrink: 0,
                  transform: menuOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
              >
                expand_less
              </span>
            </button>
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
            style={{ ...POPPINS, color: "var(--db-text)" }}
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

      {showLogoutModal && (
        <LogoutConfirmModal
          onConfirm={handleLogout}
          onClose={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  );
}

export function EmployerDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardThemeProvider>
      <EmployerProfileProvider>
        <EmployerJobsProvider>
          <EmployerDashboardLayoutInner>{children}</EmployerDashboardLayoutInner>
        </EmployerJobsProvider>
      </EmployerProfileProvider>
    </DashboardThemeProvider>
  );
}
