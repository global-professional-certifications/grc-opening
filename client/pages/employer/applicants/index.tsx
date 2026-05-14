import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { EmployerDashboardLayout } from "../../../components/layout/EmployerDashboardLayout";
import { apiFetch } from "@/lib/api";
import { ApplicantDetailDialog } from "./ApplicantDetailDialog";

const SYNE    = { fontFamily: "'Poppins', sans-serif" };
const MONO    = { fontFamily: "'JetBrains Mono', monospace" };
const POPPINS = { fontFamily: "'Poppins', sans-serif" };

type ApplicationStatus = "PENDING" | "REVIEWING" | "INTERVIEWING" | "REJECTED" | "HIRED";

type Applicant = {
  id: string;
  status: ApplicationStatus;
  appliedAt: string;
  notes: string | null;
  jobId: string;
  jobTitle: string;
  seekerId: string;
  seekerName: string;
  seekerEmail: string;
  seekerPhone?: string;
  seekerHeadline: string;
  seekerLocation: string;
  certifications: string[];
};

const STATUS_STYLES: Record<ApplicationStatus, { bg: string; color: string; label: string; icon: string }> = {
  PENDING:      { bg: "rgba(99,102,241,0.10)",  color: "#818cf8", label: "Pending",      icon: "schedule" },
  REVIEWING:    { bg: "rgba(245,158,11,0.10)",  color: "#f59e0b", label: "Reviewing",    icon: "visibility" },
  INTERVIEWING: { bg: "rgba(16,185,129,0.10)",  color: "#10b981", label: "Interviewing", icon: "calendar_month" },
  REJECTED:     { bg: "rgba(239,68,68,0.10)",   color: "#f87171", label: "Rejected",     icon: "cancel" },
  HIRED:        { bg: "rgba(16,185,129,0.18)",  color: "#059669", label: "Hired",        icon: "celebration" },
};

const STATUS_OPTIONS: ApplicationStatus[] = ["PENDING", "REVIEWING", "INTERVIEWING", "HIRED", "REJECTED"];

// ── Confirmation Modal ──────────────────────────────────────────────────────
interface ConfirmModalProps {
  applicantName: string;
  from: ApplicationStatus;
  to: ApplicationStatus;
  onConfirm: () => void;
  onCancel: () => void;
}

function StatusConfirmModal({ applicantName, from, to, onConfirm, onCancel }: ConfirmModalProps) {
  const fromStyle = STATUS_STYLES[from];
  const toStyle   = STATUS_STYLES[to];

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onCancel(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Accent top bar — coloured to destination status */}
        <div className="h-1 w-full" style={{ background: toStyle.color }} />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-start gap-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: toStyle.bg, border: `1.5px solid ${toStyle.color}33` }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: toStyle.color }}>
              {toStyle.icon}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--db-text-muted)" }}>
              Confirm Status Change
            </p>
            <h3 className="text-[16px] font-bold leading-snug" style={{ color: "var(--db-text)" }}>
              {applicantName}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-black/10"
            style={{ color: "var(--db-text-muted)" }}
            aria-label="Close"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* Divider */}
        <div className="mx-6" style={{ height: 1, background: "var(--db-border)" }} />

        {/* Body — status transition visualisation */}
        <div className="px-6 py-5">
          <p className="text-[13px] mb-4" style={{ color: "var(--db-text-secondary)" }}>
            Are you sure you want to change the application status?
          </p>
          <div className="flex items-center gap-3">
            {/* From */}
            <span
              className="rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-[0.14em] font-bold"
              style={{ background: fromStyle.bg, color: fromStyle.color, ...MONO }}
            >
              {fromStyle.label}
            </span>
            {/* Arrow */}
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--db-text-muted)" }}>
              arrow_forward
            </span>
            {/* To */}
            <span
              className="rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-[0.14em] font-bold"
              style={{ background: toStyle.bg, color: toStyle.color, ...MONO }}
            >
              {toStyle.label}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-xl text-[13px] font-bold border transition-all hover:bg-black/5"
            style={{ borderColor: "var(--db-border)", color: "var(--db-text)" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.97]"
            style={{ background: toStyle.color, boxShadow: `0 4px 12px ${toStyle.color}44` }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ApplicationStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className="rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-[0.14em] font-bold"
      style={{ background: s.bg, color: s.color, ...MONO }}
    >
      {s.label}
    </span>
  );
}

// ── Applicant Row ───────────────────────────────────────────────────────────
function ApplicantRow({
  applicant,
  onStatusChange,
  onOpenDetail,
  focused,
  rowRef,
}: {
  applicant: Applicant;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onOpenDetail: (id: string) => void;
  focused: boolean;
  rowRef?: (el: HTMLTableRowElement | null) => void;
}) {
  const [updating, setUpdating] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ApplicationStatus | null>(null);

  // Called when the dropdown changes — shows modal instead of immediately saving
  function requestStatusChange(newStatus: ApplicationStatus) {
    if (updating || newStatus === applicant.status) return;
    setPendingStatus(newStatus);
  }

  async function commitStatusChange() {
    if (!pendingStatus) return;
    const target = pendingStatus;
    setPendingStatus(null);
    setUpdating(true);
    try {
      await apiFetch(`/applications/${applicant.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: target }),
      });
      onStatusChange(applicant.id, target);
    } catch {
      // status unchanged on error
    } finally {
      setUpdating(false);
    }
  }

  return (
    <>
      {/* Confirmation Modal — rendered in React tree but fixed to viewport */}
      {pendingStatus && (
        <StatusConfirmModal
          applicantName={applicant.seekerName}
          from={applicant.status}
          to={pendingStatus}
          onConfirm={commitStatusChange}
          onCancel={() => setPendingStatus(null)}
        />
      )}

      <tr
        ref={rowRef}
        style={{
          borderBottom: "1px solid var(--db-border)",
          outline: focused ? "2px solid var(--db-primary)" : "none",
          outlineOffset: focused ? "-2px" : "0",
          background: focused ? "var(--db-primary-10)" : "transparent",
          transition: "outline-color 0.3s ease, background 0.3s ease",
        }}
      >
        <td className="py-4 px-4">
          <div>
            <button
              type="button"
              onClick={() => onOpenDetail(applicant.id)}
              className="text-sm font-bold text-left hover:underline transition-colors cursor-pointer"
              style={{ color: "var(--db-primary)", ...POPPINS }}
            >
              {applicant.seekerName}
            </button>
            <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: "var(--db-text-muted)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>mail</span>
              <a href={`mailto:${applicant.seekerEmail}`} className="hover:underline" style={{ color: "var(--db-text-muted)" }}>
                {applicant.seekerEmail}
              </a>
            </p>
            {applicant.seekerPhone && (
              <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: "var(--db-text-muted)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>phone</span>
                <a href={`tel:${applicant.seekerPhone}`} className="hover:underline" style={{ color: "var(--db-text-muted)" }}>
                  {applicant.seekerPhone}
                </a>
              </p>
            )}
            {applicant.seekerHeadline && (
              <p className="text-xs mt-0.5" style={{ color: "var(--db-text-secondary)" }}>{applicant.seekerHeadline}</p>
            )}
          </div>
        </td>
        <td className="py-4 px-4">
          <p className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>{applicant.jobTitle}</p>
        </td>
        <td className="py-4 px-4">
          <div className="flex flex-wrap gap-1.5">
            {applicant.certifications.length > 0
              ? applicant.certifications.map(c => (
                  <span
                    key={c}
                    className="rounded-full px-2 py-0.5 text-[0.6rem] uppercase tracking-wider font-bold"
                    style={{ background: "var(--db-primary-10)", color: "var(--db-primary)", border: "1px solid var(--db-primary-20)", ...MONO }}
                  >
                    {c}
                  </span>
                ))
              : <span style={{ color: "var(--db-text-muted)", fontSize: "0.8rem" }}>—</span>
            }
          </div>
        </td>
        <td className="py-4 px-4">
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            {new Date(applicant.appliedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </td>
        <td className="py-4 px-4">
          <StatusBadge status={applicant.status} />
        </td>
        <td className="py-4 px-4">
          <select
            value={applicant.status}
            disabled={updating}
            onChange={e => requestStatusChange(e.target.value as ApplicationStatus)}
            className="rounded-lg px-3 py-2 text-xs font-semibold border cursor-pointer disabled:opacity-50"
            style={{
              background: "var(--db-card)",
              borderColor: "var(--db-border)",
              color: "var(--db-text)",
              ...MONO,
            }}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{STATUS_STYLES[s].label}</option>
            ))}
          </select>
        </td>
      </tr>
    </>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function ApplicantsPage() {
  const router = useRouter();
  const focusId = typeof router.query.focus === "string" ? router.query.focus : null;
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterJob, setFilterJob] = useState("");
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | "">("");
  const [filterSearch, setFilterSearch] = useState("");
  const [detailApplicationId, setDetailApplicationId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ applications: Applicant[] }>("/applications/employer")
      .then(res => setApplicants(res.applications))
      .catch(e => setError(e instanceof Error ? e.message : "Failed to load applicants"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!focusId || loading) return;
    const row = rowRefs.current.get(focusId);
    if (!row) return;
    row.scrollIntoView({ behavior: "smooth", block: "center" });
    setFocusedId(focusId);
    const t = setTimeout(() => setFocusedId(null), 2400);
    return () => clearTimeout(t);
  }, [focusId, loading, applicants.length]);

  function handleStatusChange(id: string, status: ApplicationStatus) {
    setApplicants(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  const jobTitles = Array.from(new Set(applicants.map(a => a.jobTitle)));

  const filtered = applicants.filter(a => {
    const searchOk = !filterSearch || a.seekerName.toLowerCase().includes(filterSearch.toLowerCase()) || a.seekerEmail.toLowerCase().includes(filterSearch.toLowerCase());
    const jobOk    = !filterJob    || a.jobTitle === filterJob;
    const statusOk = !filterStatus || a.status === filterStatus;
    return searchOk && jobOk && statusOk;
  });

  return (
    <EmployerDashboardLayout>
      {detailApplicationId && (
        <ApplicantDetailDialog
          applicationId={detailApplicationId}
          onClose={() => setDetailApplicationId(null)}
        />
      )}
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-semibold" style={{ ...SYNE, color: "var(--db-text)" }}>Applicants</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
              {applicants.length} total applicant{applicants.length !== 1 ? "s" : ""} across all your job postings
            </p>
          </div>
        </div>

        {/* Filters */}
        <div
          className="flex flex-wrap gap-3 rounded-[18px] border px-5 py-4"
          style={{ background: "var(--db-card)", borderColor: "var(--db-border)" }}
        >
          <input
            placeholder="Search by name or email…"
            value={filterSearch}
            onChange={e => setFilterSearch(e.target.value)}
            className="rounded-lg border px-4 py-2 text-sm flex-1 min-w-[200px] outline-none"
            style={{ background: "var(--db-bg)", borderColor: "var(--db-border)", color: "var(--db-text)" }}
          />
          <select
            value={filterJob}
            onChange={e => setFilterJob(e.target.value)}
            className="rounded-lg border px-4 py-2 text-sm cursor-pointer"
            style={{ background: "var(--db-bg)", borderColor: "var(--db-border)", color: "var(--db-text)" }}
          >
            <option value="">All Jobs</option>
            {jobTitles.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as ApplicationStatus | "")}
            className="rounded-lg border px-4 py-2 text-sm cursor-pointer"
            style={{ background: "var(--db-bg)", borderColor: "var(--db-border)", color: "var(--db-text)" }}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_STYLES[s].label}</option>)}
          </select>
        </div>

        {/* Table */}
        <div
          className="rounded-[20px] border overflow-hidden"
          style={{ background: "var(--db-card)", borderColor: "var(--db-border)" }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-16" style={{ color: "var(--db-text-muted)" }}>
              Loading applicants…
            </div>
          ) : error ? (
            <div className="flex items-center justify-center gap-3 py-10" style={{ color: "#f87171" }}>
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: "var(--db-text-muted)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: 0.5 }}>person_search</span>
              <p className="text-sm">{applicants.length === 0 ? "No applicants yet" : "No results match your filters"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "var(--db-table-head)", borderBottom: "1px solid var(--db-border)" }}>
                    {["Applicant", "Job", "Certifications", "Applied", "Status", "Update"].map(h => (
                      <th
                        key={h}
                        className="py-3 px-4 text-left text-[0.68rem] uppercase tracking-[0.2em] font-bold"
                        style={{ color: "var(--db-text-muted)", ...MONO }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <ApplicantRow
                      key={a.id}
                      applicant={a}
                      onStatusChange={handleStatusChange}
                      onOpenDetail={setDetailApplicationId}
                      focused={focusedId === a.id}
                      rowRef={(el) => {
                        if (el) rowRefs.current.set(a.id, el);
                        else rowRefs.current.delete(a.id);
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </EmployerDashboardLayout>
  );
}
