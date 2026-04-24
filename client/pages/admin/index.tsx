import React, { useEffect, useState } from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { adminFetch as apiFetch } from "../../lib/api";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  activeJobs: number;
  pendingJobs: number;
  totalApplications: number;
  recentUsers: any[];
  recentCompanies: any[];
  registrationTrend: { date: string; count: number }[];
  categoryStats: { category: string; count: number }[];
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon, accent, badge, trend,
}: {
  label: string; value: number; icon: string; accent: string;
  badge?: { text: string; color: string };
  trend?: { value: number; up: boolean };
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${accent}18` }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: accent }}>{icon}</span>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-[32px] font-bold text-gray-900 leading-none">{value.toLocaleString()}</p>
        <div className="flex flex-col items-end gap-1">
          {trend && (
            <span className={`text-[12px] font-bold flex items-center gap-0.5 ${trend.up ? "text-emerald-500" : "text-red-400"}`}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{trend.up ? "trending_up" : "trending_down"}</span>
              {trend.value}%
            </span>
          )}
          {badge && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${badge.color}18`, color: badge.color }}>
              {badge.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Mini Bar Chart ─────────────────────────────────────────────────────────
function MiniBarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  // show only last 20 for readability
  const slice = data.slice(-20);
  return (
    <div className="flex items-end gap-0.5 h-20 w-full">
      {slice.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end group relative">
          <div
            className="rounded-t transition-all"
            style={{
              height: `${Math.max((d.count / max) * 100, d.count > 0 ? 8 : 2)}%`,
              background: d.count > 0 ? "#3a1292" : "#e2e8f0",
              opacity: d.count > 0 ? 0.75 : 1,
            }}
          />
          {d.count > 0 && (
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {d.count} · {d.date.slice(5)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Category bars ──────────────────────────────────────────────────────────
function CategoryBars({ data }: { data: { category: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex flex-col gap-2.5">
      {data.map(d => (
        <div key={d.category} className="flex items-center gap-3">
          <p className="text-[12px] font-medium text-gray-600 w-36 truncate">{d.category}</p>
          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#3a1292] transition-all"
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <p className="text-[12px] font-bold text-gray-700 w-8 text-right">{d.count}</p>
        </div>
      ))}
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────
function StatusDot({ status }: { status: string }) {
  const color = status === "ACTIVE" ? "#10b981" : status === "BANNED" ? "#ef4444" : "#f59e0b";
  return <span className="w-2 h-2 rounded-full inline-block mr-1" style={{ background: color }} />;
}

// ── Role badge ─────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    EMPLOYER: "bg-blue-50 text-blue-700",
    JOB_SEEKER: "bg-purple-50 text-purple-700",
    ADMIN: "bg-amber-50 text-amber-700",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[role] ?? "bg-gray-100 text-gray-600"}`}>
      {role.replace("_", " ")}
    </span>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Stats>("/admin/stats")
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const skeleton = (h = "h-8") => <div className={`${h} bg-gray-100 rounded-xl animate-pulse`} />;

  return (
    <AdminLayout title="Dashboard">
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px]">{error}</div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-28 animate-pulse" />
          ))
        ) : stats && (
          <>
            <StatCard label="Total Users"         value={stats.totalUsers}        icon="group"       accent="#3a1292" trend={{ value: 12, up: true }} />
            <StatCard label="Active Jobs"          value={stats.activeJobs}        icon="work"        accent="#0ea5e9" trend={{ value: 5, up: true }} />
            <StatCard label="Jobs Pending Review"  value={stats.pendingJobs}       icon="pending_actions" accent="#f59e0b"
              badge={stats.pendingJobs > 0 ? { text: "AMBER PRIORITY", color: "#f59e0b" } : undefined}
            />
            <StatCard label="Total Applications"   value={stats.totalApplications} icon="description" accent="#10b981" trend={{ value: 18, up: false }} />
          </>
        )}
      </div>

      {/* ── Moderation Queue preview ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500" style={{ fontSize: 18 }}>warning</span>
            <h2 className="text-[15px] font-bold text-gray-900">Moderation Queue</h2>
          </div>
          <Link href="/admin/moderation" className="text-[12px] text-[#3a1292] font-semibold hover:underline flex items-center gap-1">
            View all <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
          </Link>
        </div>
        <ModerationPreview />
      </div>

      {/* ── Analytics + User Management ── */}
      <div className="grid grid-cols-2 gap-6">
        {/* Analytics */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#3a1292]" style={{ fontSize: 18 }}>bar_chart</span>
              <h2 className="text-[15px] font-bold text-gray-900">Platform Analytics</h2>
            </div>
          </div>
          <div className="p-6 flex flex-col gap-6">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                New Registrations (Last 30 Days)
              </p>
              {loading ? <div className="h-20 bg-gray-100 rounded animate-pulse" /> : (
                stats?.registrationTrend && <MiniBarChart data={stats.registrationTrend} />
              )}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Jobs by Category
              </p>
              {loading ? skeleton("h-32") : (
                stats?.categoryStats && <CategoryBars data={stats.categoryStats} />
              )}
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#3a1292]" style={{ fontSize: 18 }}>manage_accounts</span>
              <h2 className="text-[15px] font-bold text-gray-900">User Management</h2>
            </div>
            <Link href="/admin/users" className="text-[12px] text-[#3a1292] font-semibold hover:underline flex items-center gap-1">
              View All Users <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
            </Link>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-6 py-2.5 border-b border-gray-50 bg-gray-50/60">
            {["USER", "ROLE", "STATUS", "ACTION"].map(h => (
              <p key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</p>
            ))}
          </div>

          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-6 py-3 h-14 animate-pulse flex items-center gap-3">
                  <div className="flex-1 h-4 bg-gray-100 rounded" />
                </div>
              ))
            ) : stats?.recentUsers.map(u => (
              <UserRow key={u.id} user={u} />
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function UserRow({ user }: { user: any }) {
  const [status, setStatus] = useState(user.status ?? "ACTIVE");
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const next = status === "BANNED" ? "ACTIVE" : "BANNED";
    setLoading(true);
    try {
      await apiFetch(`/admin/users/${user.id}/status`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      setStatus(next);
    } catch {}
    setLoading(false);
  }

  const name = user.seekerProfile
    ? `${user.seekerProfile.firstName} ${user.seekerProfile.lastName}`
    : user.employerProfile?.companyName ?? null;

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-6 py-3">
      <div className="overflow-hidden">
        <p className="text-[12px] font-semibold text-gray-800 truncate">{name ?? user.email}</p>
        <p className="text-[10px] text-gray-400 truncate">ID: {user.id.slice(0, 8)}</p>
      </div>
      <RoleBadge role={user.role} />
      <div className="flex items-center gap-1">
        <StatusDot status={status} />
        <span className="text-[11px] text-gray-500">{status === "ACTIVE" ? "Active" : status === "BANNED" ? "Disabled" : "Suspended"}</span>
      </div>
      {user.role !== "ADMIN" && (
        <button
          disabled={loading}
          onClick={toggle}
          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all disabled:opacity-50 ${
            status === "BANNED" ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-red-50 text-red-600 hover:bg-red-100"
          }`}
        >
          {loading ? "..." : status === "BANNED" ? "Enable" : "Disable"}
        </button>
      )}
    </div>
  );
}

function ModerationPreview() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ jobs: any[] }>("/admin/jobs?status=PENDING_REVIEW&limit=5")
      .then(d => setJobs(d.jobs))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="divide-y divide-gray-50">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="px-6 py-3 h-14 animate-pulse flex gap-3 items-center">
          <div className="flex-1 h-4 bg-gray-100 rounded" />
          <div className="w-20 h-4 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  );

  if (!jobs.length) return (
    <div className="px-6 py-8 text-center">
      <span className="material-symbols-outlined text-gray-300" style={{ fontSize: 36 }}>check_circle</span>
      <p className="text-[13px] text-gray-400 mt-2">No jobs pending review</p>
    </div>
  );

  return (
    <div>
      {/* Table header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-2.5 border-b border-gray-50 bg-gray-50/60">
        {["JOB TITLE", "EMPLOYER", "CATEGORY", "SUBMITTED", "ACTIONS"].map(h => (
          <p key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</p>
        ))}
      </div>
      <div className="divide-y divide-gray-50">
        {jobs.map(j => (
          <ModerationRow key={j.id} job={j} />
        ))}
      </div>
    </div>
  );
}

function ModerationRow({ job }: { job: any }) {
  const [status, setStatus] = useState<"idle" | "approved" | "rejected">("idle");
  const [loading, setLoading] = useState(false);

  async function approve() {
    setLoading(true);
    try { await apiFetch(`/admin/jobs/${job.id}/approve`, { method: "PATCH" }); setStatus("approved"); }
    catch {}
    setLoading(false);
  }

  const isNew = new Date(job.employer?.createdAt).getTime() > Date.now() - 7 * 24 * 3600 * 1000;

  if (status === "approved") return (
    <div className="px-6 py-3 flex items-center gap-2 text-[12px] text-emerald-600 font-semibold">
      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
      Approved — {job.title}
    </div>
  );
  if (status === "rejected") return (
    <div className="px-6 py-3 flex items-center gap-2 text-[12px] text-red-500 font-semibold">
      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>cancel</span>
      Rejected — {job.title}
    </div>
  );

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-6 py-3">
      <p className="text-[13px] font-semibold text-gray-800 truncate">{job.title}</p>
      <div className="flex items-center gap-1.5">
        <p className="text-[12px] text-gray-600">{job.employer?.companyName}</p>
        {job.employer?.isVerified
          ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">VERIFIED</span>
          : isNew
          ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">NEW</span>
          : null
        }
      </div>
      <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{job.category ?? "—"}</span>
      <span className="text-[11px] text-gray-400">{new Date(job.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
      <div className="flex gap-1.5">
        <button disabled={loading} onClick={approve}
          className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-all"
        >
          {loading ? "..." : "Approve"}
        </button>
        <Link href={`/admin/moderation?reject=${job.id}`}
          className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
        >
          Reject
        </Link>
      </div>
    </div>
  );
}
