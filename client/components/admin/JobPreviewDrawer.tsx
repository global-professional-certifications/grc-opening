import { useState } from "react";
import { adminFetch as apiFetch } from "../../lib/api";

export interface JobReport {
  id: string;
  reason: string;
  description: string | null;
  createdAt: string;
  seeker: { firstName: string; lastName: string } | null;
}

export interface AdminJob {
  id: string;
  title: string;
  status: string;
  category: string | null;
  jobType: string | null;
  location: string | null;
  workMode: string | null;
  createdAt: string;
  adminNote: string | null;
  employer: {
    id: string;
    companyName: string;
    isVerified: boolean;
    createdAt: string;
    user: { email: string; createdAt: string };
  };
  reports: JobReport[];
  _count: { applications: number; reports: number };
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PUBLISHED:     { label: "Live",     cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CLOSED:        { label: "Closed",   cls: "bg-gray-100 text-gray-600 border-gray-200" },
  REJECTED:      { label: "Rejected", cls: "bg-red-50 text-red-700 border-red-200" },
  DRAFT:         { label: "Draft",    cls: "bg-gray-100 text-gray-600 border-gray-200" },
  PENDING_REVIEW:{ label: "Pending",  cls: "bg-amber-50 text-amber-700 border-amber-200" },
};

const REASON_META: Record<string, { label: string; cls: string }> = {
  SPAM:          { label: "Spam",          cls: "bg-red-50 text-red-600 border-red-200" },
  MISLEADING:    { label: "Misleading",    cls: "bg-amber-50 text-amber-700 border-amber-200" },
  INAPPROPRIATE: { label: "Inappropriate", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  OTHER:         { label: "Other",         cls: "bg-gray-100 text-gray-600 border-gray-200" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_META[status] ?? { label: status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${s.cls}`}>
      {s.label}
    </span>
  );
}

export function ReasonBadge({ reason }: { reason: string }) {
  const r = REASON_META[reason] ?? { label: reason, cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.cls}`}>{r.label}</span>
  );
}

export function PreviewDrawer({
  job, onClose, onJobClosed,
}: {
  job: AdminJob;
  onClose: () => void;
  onJobClosed: (id: string) => void;
}) {
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState("");

  async function handleClose() {
    setClosing(true);
    setCloseError("");
    try {
      await apiFetch(`/admin/jobs/${job.id}/close`, { method: "PATCH" });
      onJobClosed(job.id);
    } catch (e: any) {
      setCloseError(e.message ?? "Failed to close job.");
    } finally {
      setClosing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose} style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}>
      <div
        className="w-full max-w-lg bg-white h-full shadow-2xl overflow-auto flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-[15px] font-bold text-gray-900">Job Preview</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">{job.employer?.companyName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6 flex-1 overflow-auto">
          <div>
            <p className="text-[20px] font-bold text-gray-900">{job.title}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <StatusBadge status={job.status} />
              {job.category && (
                <span className="text-[12px] bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-semibold capitalize border border-purple-100">
                  {job.category}
                </span>
              )}
              {job.jobType && (
                <span className="text-[12px] bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold border border-blue-100">
                  {job.jobType}
                </span>
              )}
              {job.workMode && (
                <span className="text-[12px] bg-gray-50 text-gray-600 px-3 py-1 rounded-full font-semibold border border-gray-200">
                  {job.workMode.replace("_", " ")}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Employer Email</p>
              <p className="text-[11px] font-semibold text-gray-700 mt-0.5 break-all">{job.employer?.user?.email ?? "—"}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Applicants</p>
              <p className="text-[20px] font-bold text-gray-700 mt-0.5">{job._count?.applications ?? 0}</p>
            </div>
            <div className={`rounded-xl p-3 ${(job._count?.reports ?? 0) > 0 ? "bg-red-50" : "bg-gray-50"}`}>
              <p className={`text-[10px] font-semibold uppercase ${(job._count?.reports ?? 0) > 0 ? "text-red-400" : "text-gray-400"}`}>Reports</p>
              <p className={`text-[20px] font-bold mt-0.5 ${(job._count?.reports ?? 0) > 0 ? "text-red-600" : "text-gray-700"}`}>
                {job._count?.reports ?? 0}
              </p>
            </div>
          </div>

          <div className="text-[12px] text-gray-400">
            Posted {new Date(job.createdAt).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}
            {job.location && <span> · {job.location}</span>}
          </div>

          {(job.reports?.length ?? 0) > 0 && (
            <div>
              <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>flag</span>
                User Reports ({job.reports.length})
              </p>
              <div className="flex flex-col gap-3">
                {job.reports.map((r: any, idx: number) => (
                  <div key={r.id} className="border border-red-100 rounded-xl p-4 bg-red-50/40">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold text-gray-700">
                          {r.seeker ? `${r.seeker.firstName} ${r.seeker.lastName}` : `Reporter #${idx + 1}`}
                        </span>
                        <ReasonBadge reason={r.reason} />
                      </div>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                        {new Date(r.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    {r.description && (
                      <p className="text-[12px] text-gray-600 leading-relaxed">{r.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {job.adminNote && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-[11px] font-bold text-red-600 uppercase mb-1">Admin Note</p>
              <p className="text-[13px] text-red-700">{job.adminNote}</p>
            </div>
          )}
        </div>

        {job.status === "PUBLISHED" && (
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4">
            {closeError && (
              <p className="text-[12px] text-red-600 mb-3">{closeError}</p>
            )}
            <button
              onClick={handleClose}
              disabled={closing}
              className="w-full py-3 rounded-xl bg-red-600 text-white text-[14px] font-bold hover:bg-red-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {closing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>block</span>
                  Close Job Post
                </>
              )}
            </button>
            <p className="text-[11px] text-gray-400 text-center mt-2">
              This will remove the listing from public view immediately.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
