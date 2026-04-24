import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { adminFetch as apiFetch } from "../../lib/api";

interface AdminJob {
  id: string;
  title: string;
  status: string;
  category: string | null;
  jobType: string | null;
  createdAt: string;
  adminNote: string | null;
  employer: {
    id: string;
    companyName: string;
    isVerified: boolean;
    createdAt: string;
    user: { email: string; createdAt: string };
  };
  _count: { applications: number };
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING_REVIEW: { label: "Pending Review", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    PUBLISHED:      { label: "Approved",       cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    REJECTED:       { label: "Rejected",       cls: "bg-red-50 text-red-700 border-red-200" },
    DRAFT:          { label: "Draft",           cls: "bg-gray-100 text-gray-600 border-gray-200" },
    CLOSED:         { label: "Closed",          cls: "bg-gray-100 text-gray-600 border-gray-200" },
  };
  const s = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${s.cls}`}>{s.label}</span>
  );
}

// ── Rejection modal (matches screenshot 2 design, light theme) ─────────────
function RejectModal({ job, onClose, onDone }: { job: AdminJob; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  async function submit() {
    if (!reason.trim()) { setError("Rejection reason is required."); return; }
    setLoading(true);
    try {
      await apiFetch(`/admin/jobs/${job.id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ reason }),
      });
      onDone();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div>
            <h3 className="text-[18px] font-bold text-red-600 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>cancel</span>
              Reject Job Posting
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {/* Job name bar */}
        <div className="mx-6 mb-5 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200">
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          <p className="text-[13px] font-semibold text-red-700 truncate">
            Rejecting: {job.title} at {job.employer.companyName}
          </p>
        </div>

        {/* Form */}
        <div className="px-6 pb-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">
              Reason for Rejection <span className="text-red-500">*</span>
            </label>
            <textarea
              ref={textareaRef}
              value={reason}
              onChange={e => { setReason(e.target.value); setError(""); }}
              placeholder="Provide a detailed professional reason for rejection. This note will be visible to the hiring manager for remediation purposes..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-[13px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-400/10 focus:bg-white resize-none transition-all"
            />
            {error && <p className="text-[12px] text-red-600 font-medium">{error}</p>}
          </div>

          <div className="flex items-start gap-2 text-[11px] text-gray-400 leading-relaxed">
            <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ fontSize: 13 }}>info</span>
            <p>
              By confirming this rejection, the job posting status will be updated to 'Rejected' and the employer will be notified to review the compliance feedback. This action is logged for GRC auditing.
            </p>
          </div>

          <div className="flex gap-3 mt-1">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-[14px] font-semibold text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button onClick={submit} disabled={loading}
              className="flex-1 py-3 rounded-xl bg-red-600 text-white text-[14px] font-bold hover:bg-red-700 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <>Confirm Rejection <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span></>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Job preview drawer ────────────────────────────────────────────────────
function PreviewDrawer({ job, onClose }: { job: AdminJob; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-lg bg-white h-full shadow-2xl overflow-auto" onClick={e => e.stopPropagation()} style={{ fontFamily: "'Poppins', sans-serif" }}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-gray-900">Job Preview</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>
        <div className="p-6 flex flex-col gap-5">
          <div>
            <p className="text-[20px] font-bold text-gray-900">{job.title}</p>
            <p className="text-[14px] text-gray-500 mt-1">{job.employer.companyName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {job.category && <span className="text-[12px] bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-semibold">{job.category}</span>}
            {job.jobType  && <span className="text-[12px] bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold">{job.jobType}</span>}
            <StatusBadge status={job.status} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Employer</p>
              <p className="text-[13px] font-semibold text-gray-700 mt-0.5">{job.employer.user.email}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Submitted</p>
              <p className="text-[13px] font-semibold text-gray-700 mt-0.5">{new Date(job.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          {job.adminNote && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-[11px] font-bold text-red-600 uppercase mb-1">Admin Note</p>
              <p className="text-[13px] text-red-700">{job.adminNote}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function ModerationPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("PENDING_REVIEW");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<AdminJob | null>(null);
  const [previewTarget, setPreviewTarget] = useState<AdminJob | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const LIMIT = 20;

  // Open reject modal from query param (from dashboard link)
  useEffect(() => {
    if (router.query.reject && jobs.length) {
      const j = jobs.find(j => j.id === router.query.reject);
      if (j) setRejectTarget(j);
    }
  }, [router.query.reject, jobs]);

  const fetchJobs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ status: statusFilter, page: String(page), limit: String(LIMIT) });
    apiFetch<{ jobs: AdminJob[]; total: number }>(`/admin/jobs?${params}`)
      .then(d => { setJobs(d.jobs); setTotal(d.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  async function handleApprove(job: AdminJob) {
    setActionLoading(job.id);
    try {
      await apiFetch(`/admin/jobs/${job.id}/approve`, { method: "PATCH" });
      fetchJobs();
    } catch {}
    setActionLoading(null);
  }

  const filtered = jobs.filter(j =>
    !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.employer?.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / LIMIT);
  const isNew = (employer: any) => new Date(employer?.createdAt).getTime() > Date.now() - 7 * 24 * 3600 * 1000;

  return (
    <AdminLayout title="Moderation Queue">
      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 17 }}>search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search title or employer..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[13px] focus:outline-none focus:border-[#3a1292] focus:ring-2 focus:ring-[#3a1292]/10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[13px] font-medium focus:outline-none focus:border-[#3a1292]"
        >
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="PUBLISHED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="">All Jobs</option>
        </select>
        <span className="text-[12px] text-gray-400 font-medium">{total} jobs</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50/60">
          {["JOB TITLE", "EMPLOYER", "CATEGORY", "SUBMITTED", "PREVIEW", "ACTIONS"].map(h => (
            <p key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</p>
          ))}
        </div>
        <div className="divide-y divide-gray-50">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-4 items-center">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <span className="material-symbols-outlined text-gray-300" style={{ fontSize: 48 }}>check_circle</span>
              <p className="text-[14px] text-gray-400 mt-3 font-medium">Queue is clear</p>
            </div>
          ) : filtered.map(job => (
            <div key={job.id} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-3.5 items-center hover:bg-gray-50/50 transition-colors">
              {/* Title */}
              <div>
                <p className="text-[13px] font-bold text-gray-800">{job.title}</p>
                <StatusBadge status={job.status} />
              </div>
              {/* Employer */}
              <div className="flex items-center gap-1.5">
                <p className="text-[12px] text-gray-600">{job.employer?.companyName}</p>
                {job.employer?.isVerified
                  ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">VERIFIED</span>
                  : isNew(job.employer)
                  ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">NEW</span>
                  : null
                }
              </div>
              {/* Category */}
              <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                {job.category ?? "—"}
              </span>
              {/* Date */}
              <span className="text-[11px] text-gray-400 whitespace-nowrap">
                {new Date(job.createdAt).toLocaleDateString("en", { year: "numeric", month: "2-digit", day: "2-digit" })}
              </span>
              {/* Preview */}
              <button
                onClick={() => setPreviewTarget(job)}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#3a1292] hover:border-[#3a1292]/30 transition-all"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
              </button>
              {/* Actions */}
              {job.status === "PENDING_REVIEW" ? (
                <div className="flex gap-1.5">
                  <button
                    disabled={actionLoading === job.id}
                    onClick={() => handleApprove(job)}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-all"
                  >
                    {actionLoading === job.id ? "..." : "Approve"}
                  </button>
                  <button
                    onClick={() => setRejectTarget(job)}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all"
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-gray-300 font-medium">—</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-[13px] text-gray-500">Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</p>
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

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          job={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onDone={() => { setRejectTarget(null); fetchJobs(); }}
        />
      )}

      {/* Preview drawer */}
      {previewTarget && <PreviewDrawer job={previewTarget} onClose={() => setPreviewTarget(null)} />}
    </AdminLayout>
  );
}
