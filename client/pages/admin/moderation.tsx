import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { adminFetch as apiFetch } from "../../lib/api";

import { AdminJob, PreviewDrawer, StatusBadge } from "../../components/admin/JobPreviewDrawer";

// ── Shared skeleton rows ──────────────────────────────────────────────────────

function SkeletonRows({ cols, count = 6 }: { cols: string; count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`grid ${cols} gap-4 px-6 py-4 items-center`}>
          {Array.from({ length: cols.split("_").length - 1 }).map((_, j) => (
            <div key={j} className="h-4 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ))}
    </>
  );
}

// ── Section A: Reported Jobs ──────────────────────────────────────────────────

function ReportedJobsSection() {
  const GRID = "grid-cols-[minmax(0,1fr)_110px_170px_100px_95px_55px]";
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewTarget, setPreviewTarget] = useState<AdminJob | null>(null);
  const LIMIT = 20;

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchJobs = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ reported: "true", page: String(page), limit: String(LIMIT) });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (categoryFilter) params.set("category", categoryFilter);
    if (statusFilter) params.set("status", statusFilter);
    apiFetch<{ jobs: AdminJob[]; total: number }>(`/admin/jobs?${params}`)
      .then(d => { setJobs(d.jobs); setTotal(d.total); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [statusFilter, categoryFilter, debouncedSearch, page]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  function handleJobClosed(jobId: string) {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: "CLOSED" } : j));
    if (previewTarget?.id === jobId) setPreviewTarget(prev => prev ? { ...prev, status: "CLOSED" } : null);
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <>
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[13px] flex justify-between items-center">
          {error}
          <button onClick={() => setError("")} className="font-bold text-amber-500 hover:text-amber-700 ml-4">✕</button>
        </div>
      )}
      {/* Info banner */}
      <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-[12px] leading-relaxed flex items-start gap-2">
        <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ fontSize: 15 }}>flag</span>
        <span>
          Showing jobs that have been <strong>flagged by users</strong>. Review each report carefully and close any listing that violates platform policy.
        </span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 17 }}>search</span>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search title or employer..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[13px] focus:outline-none focus:border-[#3a1292] focus:ring-2 focus:ring-[#3a1292]/10"
          />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[13px] font-medium focus:outline-none focus:border-[#3a1292]"
        >
          <option value="">All Statuses</option>
          <option value="PUBLISHED">Live</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[13px] font-medium focus:outline-none focus:border-[#3a1292]"
        >
          <option value="">All Categories</option>
          {GRC_CATEGORIES.map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <span className="text-[12px] text-gray-400 font-medium whitespace-nowrap">
          {loading ? "—" : `${total} flagged`}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className={`grid ${GRID} gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50/60`}>
          {["JOB TITLE", "STATUS", "EMPLOYER", "CATEGORY", "SUBMITTED", ""].map((h, i) => (
            <p key={i} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</p>
          ))}
        </div>

        <div className="divide-y divide-gray-50">
          {loading ? (
            <SkeletonRows cols={GRID} count={5} />
          ) : jobs.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <span className="material-symbols-outlined text-emerald-400" style={{ fontSize: 48 }}>shield_check</span>
              <p className="text-[14px] text-gray-500 mt-3 font-semibold">No reported jobs</p>
              <p className="text-[12px] text-gray-300 mt-1">All job listings are clean right now.</p>
            </div>
          ) : jobs.map(job => (
            <div key={job.id} className={`grid ${GRID} gap-4 px-6 py-3.5 items-center hover:bg-gray-50/50 transition-colors`}>
              {/* JOB TITLE + report count */}
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-[13px] font-bold text-gray-800 truncate">{job.title}</p>
                {(job._count?.reports ?? 0) > 0 && (
                  <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
                    <span className="material-symbols-outlined" style={{ fontSize: 11 }}>flag</span>
                    {job._count.reports}
                  </span>
                )}
              </div>

              <StatusBadge status={job.status} />

              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-[12px] text-gray-600 truncate">{job.employer?.companyName}</p>
                {job.employer?.isVerified && (
                  <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">✓</span>
                )}
              </div>

              <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full truncate capitalize">
                {job.category ?? "—"}
              </span>

              <span className="text-[11px] text-gray-400 whitespace-nowrap">
                {new Date(job.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "2-digit" })}
              </span>

              <button
                onClick={() => setPreviewTarget(job)}
                title="View reports & details"
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#3a1292] hover:border-[#3a1292]/30 transition-all"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>visibility</span>
              </button>
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

      {/* Preview drawer */}
      {previewTarget && (
        <PreviewDrawer
          job={previewTarget}
          onClose={() => setPreviewTarget(null)}
          onJobClosed={handleJobClosed}
        />
      )}
    </>
  );
}

// ── Section B: All Jobs ───────────────────────────────────────────────────────

function AllJobsSection() {
  const GRID = "grid-cols-[minmax(0,1fr)_110px_170px_100px_70px_95px_55px]";
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewTarget, setPreviewTarget] = useState<AdminJob | null>(null);
  const LIMIT = 20;

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchJobs = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (categoryFilter) params.set("category", categoryFilter);
    if (statusFilter) params.set("status", statusFilter);
    apiFetch<{ jobs: AdminJob[]; total: number }>(`/admin/jobs?${params}`)
      .then(d => { setJobs(d.jobs); setTotal(d.total); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [statusFilter, categoryFilter, debouncedSearch, page]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  function handleJobClosed(jobId: string) {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: "CLOSED" } : j));
    if (previewTarget?.id === jobId) setPreviewTarget(prev => prev ? { ...prev, status: "CLOSED" } : null);
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <>
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[13px] flex justify-between items-center">
          {error}
          <button onClick={() => setError("")} className="font-bold text-amber-500 hover:text-amber-700 ml-4">✕</button>
        </div>
      )}
      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 17 }}>search</span>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search title or employer..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[13px] focus:outline-none focus:border-[#3a1292] focus:ring-2 focus:ring-[#3a1292]/10"
          />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[13px] font-medium focus:outline-none focus:border-[#3a1292]"
        >
          <option value="">All Statuses</option>
          <option value="PUBLISHED">Live</option>
          <option value="CLOSED">Closed</option>
          <option value="DRAFT">Draft</option>
        </select>
        <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[13px] font-medium focus:outline-none focus:border-[#3a1292]"
        >
          <option value="">All Categories</option>
          {GRC_CATEGORIES.map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <span className="text-[12px] text-gray-400 font-medium whitespace-nowrap">
          {loading ? "—" : `${total} jobs`}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className={`grid ${GRID} gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50/60`}>
          {["JOB TITLE", "STATUS", "EMPLOYER", "CATEGORY", "APPS", "POSTED", ""].map((h, i) => (
            <p key={i} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</p>
          ))}
        </div>

        <div className="divide-y divide-gray-50">
          {loading ? (
            <SkeletonRows cols={GRID} count={6} />
          ) : jobs.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <span className="material-symbols-outlined text-gray-300" style={{ fontSize: 48 }}>work_off</span>
              <p className="text-[14px] text-gray-400 mt-3 font-medium">No jobs found</p>
            </div>
          ) : jobs.map(job => (
            <div key={job.id} className={`grid ${GRID} gap-4 px-6 py-3.5 items-center hover:bg-gray-50/50 transition-colors`}>
              {/* JOB TITLE + flag if reported */}
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-[13px] font-bold text-gray-800 truncate">{job.title}</p>
                {(job._count?.reports ?? 0) > 0 && (
                  <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
                    <span className="material-symbols-outlined" style={{ fontSize: 10 }}>flag</span>
                    {job._count.reports}
                  </span>
                )}
              </div>

              <StatusBadge status={job.status} />

              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-[12px] text-gray-600 truncate">{job.employer?.companyName}</p>
                {job.employer?.isVerified && (
                  <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">✓</span>
                )}
              </div>

              <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full truncate capitalize">
                {job.category ?? "—"}
              </span>

              {/* Applications count */}
              <span className="text-[13px] font-bold text-gray-700">
                {job._count?.applications ?? 0}
              </span>

              <span className="text-[11px] text-gray-400 whitespace-nowrap">
                {new Date(job.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "2-digit" })}
              </span>

              <button
                onClick={() => setPreviewTarget(job)}
                title="Preview job details"
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#3a1292] hover:border-[#3a1292]/30 transition-all"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>visibility</span>
              </button>
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

      {/* Preview drawer */}
      {previewTarget && (
        <PreviewDrawer
          job={previewTarget}
          onClose={() => setPreviewTarget(null)}
          onJobClosed={handleJobClosed}
        />
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ModerationPage() {
  const router = useRouter();
  const tab = (router.query.tab as string) ?? "reported";

  function setTab(t: string) {
    router.replace({ pathname: router.pathname, query: { tab: t } }, undefined, { shallow: true });
  }

  return (
    <AdminLayout title="Moderation">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 w-fit">
        <button
          onClick={() => setTab("reported")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
            tab === "reported"
              ? "bg-red-500 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>flag</span>
          Reported Jobs
        </button>
        <button
          onClick={() => setTab("all")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
            tab === "all"
              ? "bg-[#3a1292] text-white shadow-sm"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>work</span>
          All Jobs
        </button>
      </div>

      {/* Section render */}
      {tab === "reported" ? <ReportedJobsSection /> : <AllJobsSection />}
    </AdminLayout>
  );
}
const GRC_CATEGORIES = [
  "audit", "compliance", "risk", "privacy", "security", "governance", "regulatory",
];
