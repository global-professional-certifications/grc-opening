import React, { useEffect, useState } from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { adminFetch as apiFetch } from "../../lib/api";
import Link from "next/link";
import { AdminJob, PreviewDrawer } from "../../components/admin/JobPreviewDrawer";
import { ConfirmActionModal } from "../../components/admin/ConfirmActionModal";

interface Stats {
  totalUsers: number;
  userStatusBreakdown: { ACTIVE: number; SUSPENDED: number; BANNED: number };
  activeJobs: number;
  reportedJobs: number;
  totalApplications: number;
  recentUsers: any[];
  recentCompanies: any[];
  registrationTrend: { date: string; count: number }[];
  categoryStats: { category: string; count: number }[];
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon, accent, badge, trend, href, footer,
}: {
  label: string; value: number; icon: string; accent: string;
  badge?: { text: string; color: string };
  trend?: { value: number; up: boolean };
  href?: string;
  footer?: React.ReactNode;
}) {
  const inner = (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3 transition-all ${
      href ? "cursor-pointer hover:shadow-md hover:ring-2 hover:ring-[#3a1292]/10" : ""
    }`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${accent}18` }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: accent }}>{icon}</span>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-[32px] font-bold text-gray-900 leading-none">{(value ?? 0).toLocaleString()}</p>
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
      {footer && <div>{footer}</div>}
    </div>
  );
  if (href) return <Link href={href} className="block">{inner}</Link>;
  return inner;
}

function TotalUsersCard({ stats }: { stats: Stats }) {
  const active = stats.userStatusBreakdown?.ACTIVE ?? 0;
  const suspended = stats.userStatusBreakdown?.SUSPENDED ?? 0;
  const banned = stats.userStatusBreakdown?.BANNED ?? 0;
  const total = Math.max(1, active + suspended + banned);

  const activePct = (active / total) * 100;
  const suspendedPct = (suspended / total) * 100;
  const conic = `conic-gradient(#10b981 0% ${activePct}%, #f59e0b ${activePct}% ${activePct + suspendedPct}%, #ef4444 ${activePct + suspendedPct}% 100%)`;

  return (
    <Link href="/admin/users" className="block h-full">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between transition-all hover:shadow-md hover:ring-2 hover:ring-[#3a1292]/10 h-full relative group">
        
        {/* Trend at top right */}
        <span className="absolute top-5 right-5 text-[12px] font-bold flex items-center gap-0.5 text-emerald-500">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>trending_up</span>
          12%
        </span>

        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Users</p>
        
        <div className="flex items-end justify-between mt-auto">
          {/* Left: Big Number */}
          <p className="text-[32px] font-bold text-gray-900 leading-none pb-1">{stats.totalUsers.toLocaleString()}</p>
          
          {/* Right: Stacked labels and Pie Chart */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 whitespace-nowrap">
                Active {active}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 whitespace-nowrap">
                Suspended {suspended}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 whitespace-nowrap">
                Banned {banned}
              </span>
            </div>
            <div className="relative w-12 h-12 rounded-full shrink-0 shadow-sm" style={{ background: conic }}>
              <div className="absolute inset-[6px] rounded-full bg-white border border-gray-50" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Mini Bar Chart ─────────────────────────────────────────────────────────
function MiniBarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const slice = data.slice(-20);
  const totalInPeriod = data.reduce((s, d) => s + d.count, 0);
  return (
    <div>
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
      <p className="text-[11px] text-gray-400 mt-2">
        {totalInPeriod > 0
          ? <><span className="font-bold text-[#3a1292]">{totalInPeriod}</span> new registrations in the last 30 days</>
          : "No registrations in the last 30 days"}
      </p>
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

// ── Status dot ─────────────────────────────────────────────────────────────
function StatusDot({ status }: { status: string }) {
  const color = status === "ACTIVE" ? "#10b981" : status === "BANNED" ? "#ef4444" : "#f59e0b";
  return <span className="w-2 h-2 rounded-full inline-block mr-1 shrink-0" style={{ background: color }} />;
}

// ── Role badge ─────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    EMPLOYER:   "bg-blue-50 text-blue-700",
    JOB_SEEKER: "bg-purple-50 text-purple-700",
    ADMIN:      "bg-amber-50 text-amber-700",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${map[role] ?? "bg-gray-100 text-gray-600"}`}>
      {role.replace("_", " ")}
    </span>
  );
}

// ── Dashboard User Row (synced with /admin/users page) ─────────────────────
const USER_GRID = "grid-cols-[minmax(0,1fr)_85px_85px_75px_95px]";

function UserRow({ user }: { user: any }) {
  const [status, setStatus] = useState<string>(user.status ?? "ACTIVE");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionReason, setActionReason] = useState("");
  const [actionReasonError, setActionReasonError] = useState("");
  const [confirm, setConfirm] = useState<null | {
    title: string;
    message: string;
    nextStatus: string;
    confirmClassName: string;
  }>(null);

  async function changeStatus(next: string, reason: string) {
    if (next === status) return;
    setActionLoading(true);
    try {
      await apiFetch(`/admin/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: next, reason }),
      });
      setStatus(next);
    } catch (err) {
      console.error('Failed to change user status:', err);
    }
    setActionLoading(false);
    setConfirm(null);
    setActionReason("");
    setActionReasonError("");
  }

  const name = user.seekerProfile
    ? `${user.seekerProfile.firstName} ${user.seekerProfile.lastName}`
    : user.employerProfile?.companyName ?? null;

  return (
    <div className={`grid ${USER_GRID} gap-3 items-center px-6 py-3 hover:bg-gray-50/50 transition-colors`}>
      {/* USER */}
      <div className="min-w-0">
        {name && <p className="text-[12px] font-semibold text-gray-800 truncate">{name}</p>}
        <p
          className={`text-[11px] text-gray-400 truncate ${!name ? "font-medium text-gray-700" : ""}`}
          title={user.email}
        >
          {user.email}
        </p>
      </div>
      {/* ROLE */}
      <RoleBadge role={user.role} />
      {/* STATUS */}
      <div className="flex items-center gap-1 min-w-0">
        <StatusDot status={status} />
        <span className="text-[11px] text-gray-500 truncate">
          {status === "ACTIVE" ? "Active" : status === "BANNED" ? "Banned" : "Suspended"}
        </span>
      </div>
      {/* JOINED */}
      <p className="text-[10px] text-gray-400 whitespace-nowrap">
        {new Date(user.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
      </p>
      {/* ACTION */}
      {user.role !== "ADMIN" ? (
        <select
          value={status}
          disabled={actionLoading}
          onChange={e => {
            const next = e.target.value;
            if (next === status) return;
            const message = next === "SUSPENDED"
              ? "This will temporarily block this user from logging in."
              : next === "BANNED"
              ? "This will permanently block this user from accessing the platform."
              : "This will restore full account access for this user.";
            const confirmClassName = next === "ACTIVE"
              ? "bg-emerald-600 hover:bg-emerald-700"
              : next === "SUSPENDED"
              ? "bg-amber-500 hover:bg-amber-600"
              : "bg-red-600 hover:bg-red-700";
            setConfirm({
              title: "Confirm Status Change",
              message,
              nextStatus: next,
              confirmClassName,
            });
          }}
          className="text-[11px] font-medium border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-[#3a1292] w-full disabled:opacity-50 cursor-pointer"
        >
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BANNED">Banned</option>
        </select>
      ) : (
        <span className="text-[10px] text-amber-500 font-semibold italic">Protected</span>
      )}
      <ConfirmActionModal
        open={!!confirm}
        title={confirm?.title ?? ""}
        message={confirm?.message ?? ""}
        confirmClassName={confirm?.confirmClassName ?? "bg-red-600 hover:bg-red-700"}
        isProcessing={actionLoading}
        onCancel={() => {
          setConfirm(null);
          setActionReason("");
          setActionReasonError("");
        }}
        onConfirm={() => {
          const trimmed = actionReason.trim();
          if (!trimmed) {
            setActionReasonError("Reason is required.");
            return;
          }
          if (!confirm) return;
          changeStatus(confirm.nextStatus, trimmed);
        }}
      >
        <label className="block text-[12px] font-semibold text-gray-700 mb-2">
          Reason (required)
        </label>
        <textarea
          value={actionReason}
          onChange={(e) => {
            setActionReason(e.target.value);
            if (actionReasonError) setActionReasonError("");
          }}
          rows={4}
          placeholder="Explain why this status change is needed..."
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-[13px] text-gray-700 focus:outline-none focus:border-[#3a1292] focus:ring-2 focus:ring-[#3a1292]/10 resize-none"
        />
        {actionReasonError && (
          <p className="mt-2 text-[12px] text-red-600">{actionReasonError}</p>
        )}
      </ConfirmActionModal>
    </div>
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
            <TotalUsersCard stats={stats} />
            <StatCard label="Active Jobs"         value={stats.activeJobs}          icon="work"        accent="#0ea5e9" trend={{ value: 5, up: true }}   href="/admin/moderation?tab=all" />
            <StatCard label="Reported Jobs"       value={stats.reportedJobs ?? 0}   icon="flag"        accent="#ef4444"
              badge={(stats.reportedJobs ?? 0) > 0 ? { text: "NEEDS REVIEW", color: "#ef4444" } : undefined}
              href="/admin/moderation?tab=reported"
            />
            <StatCard label="Total Applications" value={stats.totalApplications}   icon="description" accent="#10b981" trend={{ value: 18, up: false }} href="/admin/applications" />
          </>
        )}
      </div>

      {/* ── Recent Active Jobs ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#3a1292]" style={{ fontSize: 18 }}>work</span>
            <h2 className="text-[15px] font-bold text-gray-900">Recent Active Jobs</h2>
          </div>
          <Link href="/admin/moderation?tab=all" className="text-[12px] text-[#3a1292] font-semibold hover:underline flex items-center gap-1">
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
                stats?.categoryStats?.length
                  ? <CategoryBars data={stats.categoryStats} />
                  : <div className="flex flex-col items-center gap-2 py-6 text-center">
                      <span className="material-symbols-outlined text-gray-300" style={{ fontSize: 32 }}>bar_chart</span>
                      <p className="text-[12px] text-gray-400">No job category data yet.</p>
                    </div>
              )}
            </div>
          </div>
        </div>

        {/* User Management — synced with /admin/users */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#3a1292]" style={{ fontSize: 18 }}>manage_accounts</span>
              <h2 className="text-[15px] font-bold text-gray-900">Recent Users</h2>
            </div>
            <Link href="/admin/users" className="text-[12px] text-[#3a1292] font-semibold hover:underline flex items-center gap-1">
              Manage All <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
            </Link>
          </div>

          {/* Table header — matches /admin/users columns */}
          <div className={`grid ${USER_GRID} gap-3 px-6 py-2.5 border-b border-gray-50 bg-gray-50/60`}>
            {["USER", "ROLE", "STATUS", "JOINED", "ACTION"].map(h => (
              <p key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</p>
            ))}
          </div>

          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`grid ${USER_GRID} gap-3 px-6 py-3`}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="h-4 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ))
            ) : stats?.recentUsers.length ? (
              stats.recentUsers.map(u => <UserRow key={u.id} user={u} />)
            ) : (
              <div className="px-6 py-8 text-center text-[13px] text-gray-400">No users yet.</div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// ── Recent Active Jobs preview ─────────────────────────────────────────────
function ModerationPreview() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewTarget, setPreviewTarget] = useState<AdminJob | null>(null);
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Only fetch PUBLISHED (active) jobs — closed jobs appear in Moderation > All Jobs
    apiFetch<{ jobs: AdminJob[] }>("/admin/jobs?limit=5&status=PUBLISHED")
      .then(d => setJobs(d.jobs))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleJobClosed(id: string) {
    // Fade the row out, then remove it after the transition completes
    setFadingIds(prev => new Set([...prev, id]));
    setPreviewTarget(null);
    setTimeout(() => {
      setJobs(prev => prev.filter(j => j.id !== id));
      setFadingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }, 450);
  }

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
      <p className="text-[13px] text-gray-400 mt-2">No active job listings</p>
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_180px_80px_80px_60px] gap-4 px-6 py-2.5 border-b border-gray-50 bg-gray-50/60">
        {["JOB TITLE", "EMPLOYER", "CATEGORY", "POSTED", ""].map(h => (
          <p key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</p>
        ))}
      </div>
      <div>
        {jobs.map(j => (
          <ModerationRow
            key={j.id}
            job={j}
            fading={fadingIds.has(j.id)}
            onClick={() => setPreviewTarget(j)}
          />
        ))}
      </div>

      {previewTarget && (
        <PreviewDrawer
          job={previewTarget}
          onClose={() => setPreviewTarget(null)}
          onJobClosed={handleJobClosed}
        />
      )}
    </div>
  );
}

function ModerationRow({ job, onClick, fading }: { job: AdminJob; onClick: () => void; fading: boolean }) {
  const [sevenDaysAgo] = React.useState(() => Date.now() - 7 * 24 * 3600 * 1000);
  const isNew = React.useMemo(
    () => new Date(job.employer?.createdAt).getTime() > sevenDaysAgo,
    [job.employer?.createdAt, sevenDaysAgo],
  );
  const reportCount = job._count?.reports ?? job.reports?.length ?? 0;

  return (
    <div
      style={{
        transition: "opacity 0.4s ease, max-height 0.45s ease, padding 0.4s ease",
        opacity: fading ? 0 : 1,
        maxHeight: fading ? 0 : "80px",
        overflow: "hidden",
        borderBottom: "1px solid #f9fafb",
      }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_180px_80px_80px_60px] gap-4 items-center px-6 py-3 hover:bg-gray-50/50 transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-[13px] font-semibold text-gray-800 truncate">{job.title}</p>
          {reportCount > 0 && (
            <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
              <span className="material-symbols-outlined" style={{ fontSize: 11 }}>flag</span>
              {reportCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-[12px] text-gray-600 truncate">{job.employer?.companyName}</p>
          {job.employer?.isVerified
            ? <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">✓</span>
            : isNew
            ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">NEW</span>
            : null
          }
        </div>
        <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap capitalize">
          {job.category ?? "—"}
        </span>
        <span className="text-[11px] text-gray-400 whitespace-nowrap">
          {new Date(job.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
        </span>
        <button
          onClick={onClick}
          title="Preview job"
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#3a1292] hover:border-[#3a1292]/30 transition-all ml-auto"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>visibility</span>
        </button>
      </div>
    </div>
  );
}
