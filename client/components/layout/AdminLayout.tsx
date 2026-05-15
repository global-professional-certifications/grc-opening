import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";

const NAV = [
  { href: "/admin",             icon: "dashboard",    label: "Dashboard" },
  { href: "/admin/moderation",  icon: "fact_check",   label: "Moderation Queue" },
  { href: "/admin/applications",icon: "description",  label: "Applications" },
  { href: "/admin/users",       icon: "group",        label: "User Management" },
  { href: "/admin/companies",   icon: "business",     label: "Companies" },
  { href: "/admin/broadcast",   icon: "campaign",     label: "Broadcast" },
  { href: "/admin/audit-logs",  icon: "history",      label: "Audit Logs" },
];

function NavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  const router = useRouter();
  const active = router.pathname === href;
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all group ${
        active
          ? "bg-white/10 text-white"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span
        className={`material-symbols-outlined transition-colors ${active ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`}
        style={{ fontSize: 19 }}
      >
        {icon}
      </span>
      {label}
      {href === "/admin/moderation" && <ModerationBadge />}
      {href === "/admin/applications" && <ApplicationsBadge />}
    </Link>
  );
}

function ModerationBadge() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    const token = localStorage.getItem("grc_local_token");
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/jobs?reported=true&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.total > 0) setCount(d.total); })
      .catch(() => {});
  }, []);
  if (!count) return null;
  return (
    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white min-w-[18px] text-center">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function ApplicationsBadge() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    const token = localStorage.getItem("grc_local_token");
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/applications?limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.total > 0) setCount(d.total); })
      .catch(() => {});
  }, []);
  if (!count) return null;
  return (
    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#3a1292] text-white min-w-[18px] text-center">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function AdminLayout({ children, title = "Admin" }: { children: React.ReactNode; title?: string }) {
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState("");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("grc_local_token");
    if (!token) { router.replace("/admin/login"); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "ADMIN") { router.replace("/admin/login"); return; }
      // Redirect to login if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        localStorage.removeItem("grc_local_token");
        router.replace("/admin/login");
        return;
      }
      setAdminEmail(payload.email || "Administrator");
    } catch {
      router.replace("/admin/login");
      return;
    }
    setChecked(true);
  }, []);

  // bfcache guard: re-validates the admin token on every page show, including
  // bfcache restores, so the forward button cannot bypass the auth check.
  useEffect(() => {
    function handlePageShow(e: PageTransitionEvent) {
      if (!e.persisted) return;
      const token = localStorage.getItem("grc_local_token");
      if (!token) { window.location.replace("/admin/login"); return; }
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const now = Math.floor(Date.now() / 1000);
        if (payload.role !== "ADMIN" || (payload.exp && payload.exp < now)) {
          window.location.replace("/admin/login");
        }
      } catch {
        window.location.replace("/admin/login");
      }
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [router]);

  // Back-navigation guard: native popstate fires reliably on every browser
  // back/forward press. When the admin leaves the /admin area, destroy the
  // session so a subsequent forward press finds no token.
  useEffect(() => {
    function handlePopState() {
      const path = window.location.pathname;
      if (!path.startsWith("/admin") && localStorage.getItem("grc_local_token")) {
        localStorage.removeItem("grc_local_token");
      }
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function handleLogout() {
    localStorage.removeItem("grc_local_token");
    router.replace("/admin/login");
  }

  if (!checked) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#3a1292]/30 border-t-[#3a1292] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Head><title>{title} · Admin · GRC Openings</title></Head>
      <div className="min-h-screen flex bg-[#f1f5f9]" style={{ fontFamily: "'Poppins', sans-serif" }}>

        {/* ── Sidebar ── */}
        <aside className="w-[240px] bg-[#0f172a] flex flex-col shrink-0 fixed top-0 left-0 h-full z-30">
          {/* Logo */}
          <div className="px-5 pt-6 pb-5 border-b border-white/5">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col">
                <h1 className="text-[14px] font-black tracking-tight leading-none whitespace-nowrap">
                  <span className="text-[#3a1292]">GRC</span>
                  <span className="text-white ml-1">Openings</span>
                </h1>
                <p className="text-[8px] font-medium text-slate-400 mt-1 uppercase tracking-widest leading-none whitespace-nowrap">
                  By Global Professional Certifications
                </p>
              </div>
              <span className="inline-block self-start text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                ADMIN
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-5 flex flex-col gap-0.5">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-2 mb-2">Menu</p>
            {NAV.map(n => <NavItem key={n.href} {...n} />)}
          </nav>

          {/* User + logout */}
          <div className="px-3 pb-5 border-t border-white/5 pt-4">
            <div className="flex items-center gap-3 px-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#3a1292] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-white" style={{ fontSize: 16 }}>person</span>
              </div>
              <div className="overflow-hidden">
                <p className="text-[12px] font-semibold text-white truncate">{adminEmail}</p>
                <p className="text-[10px] text-slate-500">Administrator</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 ml-[240px] min-h-screen overflow-auto">
          {/* Top bar */}
          <div className="sticky top-0 z-20 bg-[#f1f5f9]/90 backdrop-blur-sm border-b border-gray-200/60 px-8 py-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[18px] font-bold text-gray-900 truncate">{title}</h1>
              <p className="text-[12px] text-gray-400 mt-0.5">Admin Moderation Hub · Real-time oversight of platform activity</p>
            </div>
            {/* <button className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-[13px] font-semibold text-gray-600 shadow-sm hover:shadow-md transition-all">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
              Reports
            </button> */}
          </div>

          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
