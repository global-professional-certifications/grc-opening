import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { DashboardThemeProvider, useDashboardTheme } from "../../contexts/DashboardThemeContext";
import { useUser } from "../../contexts/UserContext";

// Fonts are now handled globally via Poppins in _document.tsx

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
  const { theme } = useDashboardTheme();
  void theme;
  const { user, logout } = useUser();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
    : "—";
  const displaySub = user?.headline || (user?.role === "EMPLOYER" ? "Employer" : "GRC Professional");
  const initials = user
    ? ((user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")).toUpperCase() || user.email[0].toUpperCase()
    : "?";

  // Redirect to login if no token (catches back-button after logout)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("grc_token");
    if (!token) {
      router.replace("/auth/login");
      return;
    }
    
    // Redirect employers away from seeker pages
    if (user?.role === "EMPLOYER" && !router.pathname.startsWith("/employer")) {
      router.replace("/employer/dashboard");
    }
  }, [router, user]);

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
    // replace() so the dashboard is removed from history — back button won't return to it
    router.replace("/auth/login");
  }

  return (
    // No data-db-theme here — the blocking script + DashboardThemeProvider
    // both write to document.documentElement, which is the single source of truth.
    <div className="min-h-screen overflow-x-hidden">
      <div className="flex min-h-screen">

        {/* ── Sidebar ────────────────────────────────────────────── */}
        <aside
          className="fixed left-0 top-0 h-full w-[260px] flex flex-col z-50 backdrop-blur-xl"
          style={{ background: "var(--db-sidebar-bg)", borderRight: "1px solid var(--db-sidebar-border)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
        >
          {/* Logo */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--db-primary)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--db-primary-text)" }}>
                shield_person
              </span>
            </div>
            <h1 className="text-lg tracking-tight uppercase font-bold" style={{ color: "var(--db-sidebar-logo-text)" }}>
              GRC <span style={{ color: "var(--db-primary)" }}>Openings</span>
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-8 overflow-y-auto scrollbar-hide">
            <div>
              <p className="px-4 text-[11px] uppercase tracking-widest mb-4 font-semibold"
                style={{ color: "var(--db-sidebar-section)" }}>
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
              <p className="px-4 text-[11px] uppercase tracking-widest mb-4 font-semibold"
                style={{ color: "var(--db-sidebar-section)" }}>
                Discovery
              </p>
              <div className="space-y-1">
                <NavItem href="/dashboard/search"   icon="search"    label="Search Certs" />
                <NavItem href="/dashboard/insights" icon="analytics" label="Market Insights" />
              </div>
            </div>
          </nav>

          {/* User block */}
          <div className="p-4" style={{ 
            borderTop: "1px solid var(--db-sidebar-border)", 
            background: "var(--db-primary-10)", 
            position: "relative" 
          }} ref={menuRef}>
            {/* Logout popup — appears above the user block */}
            {menuOpen && (
              <div
                style={{
                  position: "absolute", bottom: "calc(100% + 8px)", left: 16, right: 16,
                  background: "var(--db-card)", border: "1px solid var(--db-border)",
                  borderRadius: 12, boxShadow: "0 -8px 24px rgba(0,0,0,0.12)",
                  overflow: "hidden", zIndex: 100,
                }}
              >
                <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid var(--db-border)" }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--db-text)", marginBottom: 2 }}>{displayName}</p>
                  <p style={{ fontSize: "0.7rem", color: "var(--db-text-muted)" }}>{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
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

            {/* Clickable user row */}
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
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                style={{ background: "var(--db-primary)", color: "#ffffff", fontWeight: 800, fontSize: "0.8rem" }}>
                {initials}
              </div>
              <div className="overflow-hidden flex-1 text-left">
                <p className="text-sm font-bold truncate" style={{ color: "var(--db-text)" }}>{displayName}</p>
                <p className="text-xs truncate font-semibold" style={{ color: "var(--db-primary)" }}>{displaySub}</p>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--db-text-muted)", flexShrink: 0, transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                expand_less
              </span>
            </button>
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
