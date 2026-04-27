import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { adminFetch as apiFetch } from "../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminApplication {
  id: string;
  status: string;
  appliedAt: string;
  seeker: {
    firstName: string;
    lastName: string;
    headline: string | null;
    avatarUrl: string | null;
    user: { email: string };
  };
  job: {
    title: string;
    category: string | null;
    status: string;
    employer: { companyName: string; isVerified: boolean };
  };
}

// ── Status config ─────────────────────────────────────────────────────────────

const APP_STATUS: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
  PENDING:      { label: "Pending",      dot: "bg-gray-400",   text: "text-gray-600",   bg: "bg-gray-50",    border: "border-gray-200" },
  REVIEWING:    { label: "Reviewing",    dot: "bg-blue-500",   text: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200" },
  INTERVIEWING: { label: "Interviewing", dot: "bg-purple-500", text: "text-purple-700", bg: "bg-purple-50",  border: "border-purple-200" },
  HIRED:        { label: "Hired",        dot: "bg-emerald-500",text: "text-emerald-700",bg: "bg-emerald-50", border: "border-emerald-200" },
  REJECTED:     { label: "Rejected",     dot: "bg-red-500",    text: "text-red-600",    bg: "bg-red-50",     border: "border-red-200" },
  WITHDRAWN:    { label: "Withdrawn",    dot: "bg-amber-400",  text: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200" },
};

function AppStatusBadge({ status }: { status: string }) {
  const s = APP_STATUS[status] ?? { label: status, dot: "bg-gray-400", text: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${s.bg} ${s.border} ${s.text} whitespace-nowrap`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}

function JobStatusPill({ status }: { status: string }) {
  if (status === "PUBLISHED") return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">LIVE</span>;
  if (status === "CLOSED") return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">CLOSED</span>;
  return null;
}

// ── Stats bar ─────────────────────────────────────────────────────────────────

function StatusSummary({ apps }: { apps: AdminApplication[] }) {
  const counts: Record<string, number> = {};
  apps.forEach(a => { counts[a.status] = (counts[a.status] ?? 0) + 1; });
  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {Object.entries(APP_STATUS).map(([key, meta]) => (
        counts[key] ? (
          <span key={key} className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full border ${meta.bg} ${meta.border} ${meta.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {meta.label} · {counts[key]}
          </span>
        ) : null
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const GRID = "grid-cols-[minmax(0,1fr)_minmax(0,1fr)_170px_130px_110px]";

export default function AdminApplicationsPage() {
  const [apps, setApps] = useState<AdminApplication[]>([]);
  const [allApps, setAllApps] = useState<AdminApplication[]>([]); // for summary
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const LIMIT = 20;

  // Fetch all apps once for the summary bar (ignores pagination)
  useEffect(() => {
    apiFetch<{ applications: AdminApplication[] }>("/admin/applications?limit=200")
      .then(d => setAllApps(d.applications))
      .catch(() => { /* summary bar is non-critical */ });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchApps = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (statusFilter) params.set("status", statusFilter);
    if (debouncedSearch) params.set("search", debouncedSearch);
    apiFetch<{ applications: AdminApplication[]; total: number }>(`/admin/applications?${params}`)
      .then(d => { setApps(d.applications); setTotal(d.total); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminLayout title="Applications">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] flex justify-between items-center">
          {error}
          <button onClick={() => setError("")} className="font-bold text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Status summary */}
      {allApps.length > 0 && <StatusSummary apps={allApps} />}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 17 }}>search</span>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search applicant, job or company..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[13px] focus:outline-none focus:border-[#3a1292] focus:ring-2 focus:ring-[#3a1292]/10"
          />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[13px] font-medium focus:outline-none focus:border-[#3a1292]"
        >
          <option value="">All Statuses</option>
          {Object.entries(APP_STATUS).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>
        <span className="text-[12px] text-gray-400 font-medium whitespace-nowrap">
          {loading ? "—" : `${total} application${total !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className={`grid ${GRID} gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50/60`}>
          {["APPLICANT", "JOB", "COMPANY", "STATUS", "APPLIED"].map(h => (
            <p key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</p>
          ))}
        </div>

        <div className="divide-y divide-gray-50">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`grid ${GRID} gap-4 px-6 py-4 items-center`}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ))
          ) : apps.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <span className="material-symbols-outlined text-gray-300" style={{ fontSize: 48 }}>description</span>
              <p className="text-[14px] text-gray-400 mt-3 font-medium">No applications found</p>
              {(search || statusFilter) && (
                <button
                  onClick={() => { setSearch(""); setStatusFilter(""); }}
                  className="mt-3 text-[12px] text-[#3a1292] font-semibold hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : apps.map(app => (
            <div key={app.id} className={`grid ${GRID} gap-4 px-6 py-3.5 items-center hover:bg-gray-50/50 transition-colors`}>
              {/* APPLICANT */}
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-gray-800 truncate">
                  {app.seeker.firstName} {app.seeker.lastName}
                </p>
                {app.seeker.headline && (
                  <p className="text-[10px] text-gray-400 truncate">{app.seeker.headline}</p>
                )}
                <p className="text-[10px] text-gray-300 truncate">{app.seeker.user.email}</p>
              </div>

              {/* JOB */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[12px] font-semibold text-gray-700 truncate">{app.job.title}</p>
                  <JobStatusPill status={app.job.status} />
                </div>
                {app.job.category && (
                  <span className="text-[10px] text-gray-400 capitalize">{app.job.category}</span>
                )}
              </div>

              {/* COMPANY */}
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-[12px] text-gray-600 truncate">{app.job.employer.companyName}</p>
                {app.job.employer.isVerified && (
                  <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">✓</span>
                )}
              </div>

              {/* STATUS */}
              <AppStatusBadge status={app.status} />

              {/* APPLIED DATE */}
              <p className="text-[11px] text-gray-400 whitespace-nowrap">
                {new Date(app.appliedAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-[13px] text-gray-500">
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-[13px] font-medium disabled:opacity-40 hover:bg-white transition-all"
            >← Prev</button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-[13px] font-medium disabled:opacity-40 hover:bg-white transition-all"
            >Next →</button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
