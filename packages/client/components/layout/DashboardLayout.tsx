import React from "react";
import { useRouter } from "next/router";
import { DashboardThemeProvider, useDashboardTheme } from "../../contexts/DashboardThemeContext";

const SYNE  = { fontFamily: "'Syne', sans-serif" };
const MONO  = { fontFamily: "'JetBrains Mono', monospace" };
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

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  // theme state is still needed for the toggle button icon in DashboardHeader
  const { theme } = useDashboardTheme();
  void theme; // consumed by children (DashboardHeader), not needed here directly

  return (
    // No data-db-theme here — the blocking script + DashboardThemeProvider
    // both write to document.documentElement, which is the single source of truth.
    <div className="min-h-screen overflow-x-hidden" style={MANROPE}>
      <div className="flex min-h-screen">

        {/* ── Sidebar ────────────────────────────────────────────── */}
        <aside
          className="fixed left-0 top-0 h-full w-[260px] flex flex-col z-50"
          style={{ background: "var(--db-sidebar-bg)", borderRight: "1px solid var(--db-sidebar-border)" }}
        >
          {/* Logo */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--db-primary)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--db-primary-text)" }}>
                shield_person
              </span>
            </div>
            <h1 className="text-lg tracking-tight uppercase font-semibold" style={{ ...SYNE, color: "var(--db-sidebar-logo-text)" }}>
              GRC <span style={{ color: "var(--db-primary)" }}>Openings</span>
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-8 overflow-y-auto scrollbar-hide">
            <div>
              <p className="px-4 text-[11px] uppercase tracking-widest mb-4"
                style={{ ...MONO, color: "var(--db-sidebar-section)" }}>
                Nav Groups
              </p>
              <div className="space-y-1">
                <NavItem href="/dashboard"              icon="dashboard"   label="Dashboard" />
                <NavItem href="/dashboard/jobs"         icon="work"        label="Jobs" />
                <NavItem href="/dashboard/applications" icon="description" label="Applications" />
                <NavItem href="/dashboard/messages"     icon="mail"        label="Messages" />
                <NavItem href="/dashboard/profile"      icon="person"      label="Profile" />
              </div>
            </div>
            <div>
              <p className="px-4 text-[11px] uppercase tracking-widest mb-4"
                style={{ ...MONO, color: "var(--db-sidebar-section)" }}>
                Discovery
              </p>
              <div className="space-y-1">
                <NavItem href="/dashboard/search"   icon="search"    label="Search Certs" />
                <NavItem href="/dashboard/insights" icon="analytics" label="Market Insights" />
              </div>
            </div>
          </nav>

          {/* User block */}
          <div className="p-6" style={{ borderTop: "1px solid var(--db-sidebar-border)", background: "var(--db-sidebar-user-bg)" }}>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBgqq7VJMmA2mUFKdSQAuNlrsk2eX2OqQx4Dyi7OR5vpuBQ2OosxVCVCx4nrsYZzinJyuC7LfNqNm085_gjjLGoq90K0UewQRZAK4KtJjsPxqV42sdatzm5gKrAOVj37K_Z-dyQegljNnjkuVQGkPyvB2Nnz-xvh4xi6VgG2PYnr8_NizxMxOCIeTnvsUZowJCVc7yoZRGTmOR6eCLweH0ehBcBZviA5oyxa41zQ8NkO4Jpqi5bL1jo-_sEmAj0ac5IH1r5RGatMn1r"
                alt="User Avatar" className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                style={{ border: "2px solid var(--db-primary-20)" }}
              />
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate" style={{ color: "var(--db-sidebar-user-text)" }}>Sarah Johnson</p>
                <p className="text-xs" style={{ ...MONO, color: "var(--db-sidebar-user-sub)" }}>Senior GRC Analyst</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] uppercase" style={MONO}>
                <span style={{ color: "var(--db-sidebar-user-sub)" }}>Profile Progress</span>
                <span style={{ color: "var(--db-primary)" }}>72%</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--db-sidebar-progress)" }}>
                <div className="h-full rounded-full"
                  style={{ width: "72%", background: "var(--db-primary)", boxShadow: "0 0 6px var(--db-primary-50)" }} />
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main content ────────────────────────────────────────── */}
        <main
          className="ml-[260px] flex-1 p-8 space-y-8"
          style={{ background: "var(--db-bg)", color: "var(--db-text)", minHeight: "100vh", minWidth: 0, overflow: "hidden" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardThemeProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </DashboardThemeProvider>
  );
}
