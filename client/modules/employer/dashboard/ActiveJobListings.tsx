import React, { Fragment, useCallback, useState } from "react";
import { useRouter } from "next/router";
import { useEmployerJobs, EmployerJob } from "../../../contexts/EmployerJobsContext";
import { apiFetch } from "@/lib/api";

type InlineApplicant = {
  id: string;
  status: string;
  appliedAt: string;
  seekerName: string;
  seekerEmail: string;
  seekerHeadline: string;
  certifications: string[];
};

const APP_STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:      { bg: "rgba(99,102,241,0.10)", color: "#818cf8", label: "Pending" },
  REVIEWING:    { bg: "rgba(245,158,11,0.10)", color: "#f59e0b", label: "Reviewing" },
  INTERVIEWING: { bg: "rgba(16,185,129,0.10)", color: "#10b981", label: "Interviewing" },
  REJECTED:     { bg: "rgba(239,68,68,0.10)",  color: "#f87171", label: "Rejected" },
  HIRED:        { bg: "rgba(16,185,129,0.18)", color: "#059669", label: "Hired" },
};

const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const POPPINS = { fontFamily: "'Poppins', sans-serif" };

const CATEGORY_LABELS: Record<string, string> = {
  audit:      'Internal Audit',
  compliance: 'Compliance',
  risk:       'Risk Management',
  privacy:    'Data Privacy',
  security:   'Information Security',
  governance: 'Corporate Governance',
  regulatory: 'Regulatory Affairs',
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  ACTIVE:         { bg: "rgba(16,185,129,0.12)",  color: "#10b981", label: "Active"       },
  CLOSED:         { bg: "rgba(100,116,139,0.15)", color: "#64748b", label: "Closed"       },
  DRAFT:          { bg: "rgba(245,158,11,0.12)",  color: "#f59e0b", label: "Draft"        },
  PENDING_REVIEW: { bg: "rgba(99,102,241,0.12)",  color: "#6366f1", label: "Under Review" },
  REJECTED:       { bg: "rgba(239,68,68,0.12)",   color: "#ef4444", label: "Rejected"     },
};

const TABLE_HEADERS = ["Job Title", "Category", "Work Mode", "Posted", "Status", "Applicants", "Actions"];

function EmployerJobDetailDialog({ job, onClose }: { job: EmployerJob; onClose: () => void }) {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => { const id = requestAnimationFrame(() => setVisible(true)); return () => cancelAnimationFrame(id); }, []);
  React.useEffect(() => { const prev = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = prev; }; }, []);

  function close() { setVisible(false); setTimeout(onClose, 220); }

  React.useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); }; document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey); });

  const cat = CATEGORY_LABELS[job.category] ?? job.category ?? "—";
  const s = STATUS_STYLES[job.status] ?? STATUS_STYLES.CLOSED;

  const salaryDisplay = job.undisclosedSalary
    ? "Undisclosed"
    : job.salaryMin || job.salaryMax
      ? `${job.currency ?? "USD"} ${(job.salaryMin ?? 0).toLocaleString()} – ${(job.salaryMax ?? 0).toLocaleString()}`
      : "Not specified";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-5"
      style={{ background: visible ? "rgba(0,0,0,0.54)" : "rgba(0,0,0,0)", backdropFilter: visible ? "blur(6px)" : "blur(0px)", transition: "background 0.22s ease, backdrop-filter 0.22s ease" }}
      onClick={close}
    >
      <div
        className="relative flex flex-col w-full sm:max-w-[780px] rounded-t-[28px] sm:rounded-[28px] overflow-hidden"
        style={{
          background: "var(--db-dialog-bg, #ffffff)",
          border: "1px solid var(--db-border)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.28)",
          maxHeight: "90vh",
          transform: visible ? "translateY(0) scale(1)" : "translateY(44px) scale(0.96)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.22s cubic-bezier(0.34,1.36,0.64,1), opacity 0.18s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 px-6 py-5 sm:px-8 sm:py-6 border-b flex items-start gap-4" style={{ borderColor: "var(--db-border)" }}>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[0.68rem] uppercase tracking-[0.22em] font-bold" style={{ color: "var(--db-primary)", ...MONO }}>Job Detail</span>
              <span className="rounded-full px-2.5 py-0.5 text-[0.6rem] uppercase tracking-wider font-bold" style={{ background: s.bg, color: s.color, ...MONO }}>{s.label}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold leading-tight" style={{ color: "var(--db-text)", fontFamily: "'Poppins', sans-serif" }}>{job.title}</h2>
            <div className="flex flex-wrap gap-3 mt-2 text-xs" style={{ color: "var(--db-text-muted)", ...MONO }}>
              {job.workMode && <span>{job.workMode}</span>}
              {job.seniority && <span>· {job.seniority}</span>}
              {job.experience && <span>· {job.experience}</span>}
              <span>· {cat}</span>
            </div>
          </div>
          <button type="button" aria-label="Close" onClick={close}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all hover:scale-110 active:scale-95"
            style={{ background: "var(--db-card)", borderColor: "var(--db-border)", color: "var(--db-text-secondary)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8 space-y-7" style={POPPINS}>
          {/* Key facts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { icon: "payments", label: "Salary", value: salaryDisplay },
              { icon: "work", label: "Job Type", value: job.jobType ?? "—" },
              { icon: "calendar_today", label: "Posted", value: formatDate(job.createdAt) },
            ].map(({ icon, label, value }) => (
              <div key={label} className="rounded-[14px] border px-4 py-3" style={{ background: "var(--db-card)", borderColor: "var(--db-border)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--db-primary)" }}>{icon}</span>
                  <div className="text-[0.6rem] uppercase tracking-[0.2em] font-bold" style={{ color: "var(--db-text-muted)", ...MONO }}>{label}</div>
                </div>
                <div className="text-[0.88rem] font-semibold" style={{ color: "var(--db-text)" }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          {job.description && (
            <section>
              <h4 className="text-[0.7rem] uppercase tracking-[0.26em] font-bold mb-3" style={{ color: "var(--db-primary)", ...MONO }}>Description</h4>
              <p className="text-[0.9rem] leading-[1.78] whitespace-pre-line" style={{ color: "var(--db-text-secondary)" }}>{job.description}</p>
            </section>
          )}

          {/* Responsibilities */}
          {job.responsibilities && (
            <section>
              <h4 className="text-[0.7rem] uppercase tracking-[0.26em] font-bold mb-3" style={{ color: "var(--db-primary)", ...MONO }}>Responsibilities</h4>
              <p className="text-[0.9rem] leading-[1.78] whitespace-pre-line" style={{ color: "var(--db-text-secondary)" }}>{job.responsibilities}</p>
            </section>
          )}

          {/* Qualifications */}
          {job.qualifications && (
            <section>
              <h4 className="text-[0.7rem] uppercase tracking-[0.26em] font-bold mb-3" style={{ color: "var(--db-primary)", ...MONO }}>Qualifications</h4>
              <p className="text-[0.9rem] leading-[1.78] whitespace-pre-line" style={{ color: "var(--db-text-secondary)" }}>{job.qualifications}</p>
            </section>
          )}

          {/* Required Certs */}
          {job.certifications && job.certifications.length > 0 && (
            <section>
              <h4 className="text-[0.7rem] uppercase tracking-[0.26em] font-bold mb-3" style={{ color: "var(--db-primary)", ...MONO }}>Required Certifications</h4>
              <div className="flex flex-wrap gap-2">
                {job.certifications.map(c => (
                  <span key={c} className="rounded-full px-3 py-1 text-[0.7rem] uppercase tracking-[0.14em] font-bold"
                    style={{ background: "var(--db-primary-10)", color: "var(--db-primary)", border: "1px solid var(--db-primary-20)", ...MONO }}>{c}</span>
                ))}
              </div>
            </section>
          )}

          {/* Nice to Have */}
          {job.niceToHave && (
            <section>
              <h4 className="text-[0.7rem] uppercase tracking-[0.26em] font-bold mb-3" style={{ color: "var(--db-primary)", ...MONO }}>Nice to Have</h4>
              <p className="text-[0.9rem] leading-[1.78] whitespace-pre-line" style={{ color: "var(--db-text-secondary)" }}>{job.niceToHave}</p>
            </section>
          )}

          {job.adminNote && (
            <section>
              <h4 className="text-[0.7rem] uppercase tracking-[0.26em] font-bold mb-3" style={{ color: "#b45309", ...MONO }}>
                Admin Feedback
              </h4>
              <div className="rounded-xl border px-4 py-3 text-[0.88rem] leading-[1.6]" style={{ borderColor: "#fcd34d", background: "#fffbeb", color: "#92400e" }}>
                {job.adminNote}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={7}>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: "var(--db-primary-10)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: "var(--db-primary)" }}>
              work_off
            </span>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>
              No job listings yet
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--db-text-muted)" }}>
              Post your first job to start attracting GRC talent.
            </p>
          </div>
          <a
            href="/employer/post-job"
            className="px-4 py-2 text-sm font-semibold rounded-full"
            style={{ background: "var(--db-primary)", color: "var(--db-primary-text)" }}
          >
            + Post a Job
          </a>
        </div>
      </td>
    </tr>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 rounded animate-pulse" style={{ background: "var(--db-border)", width: `${60 + i * 8}%` }} />
        </td>
      ))}
    </tr>
  );
}

function JobRow({ job, onClose, index, expanded, onToggleExpand, onEdit, onViewDetails }: {
  job: EmployerJob;
  onClose: (id: string) => void;
  index: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onViewDetails: () => void;
}) {
  const s  = STATUS_STYLES[job.status] ?? STATUS_STYLES.CLOSED;
  const canEdit = job.status !== "CLOSED";
  const cat = CATEGORY_LABELS[job.category] ?? job.category ?? "—";

  return (
    <tr
      style={{
        borderTop: index > 0 ? "1px solid var(--db-border)" : undefined,
        transition: "background-color 0.15s ease",
        background: expanded ? "var(--db-table-hover)" : undefined,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--db-table-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = expanded ? "var(--db-table-hover)" : "")}
    >
      {/* Job Title */}
      <td className="px-5 py-4">
        <button
          type="button"
          onClick={onViewDetails}
          className="text-sm font-semibold text-left hover:underline transition-colors"
          style={{ color: "var(--db-primary)" }}
        >
          {job.title}
        </button>
        {job.seniority && (
          <p className="text-[10px] mt-0.5" style={{ ...MONO, color: "var(--db-text-muted)" }}>
            {job.seniority}
          </p>
        )}
      </td>

      {/* Category */}
      <td className="px-5 py-4 text-sm" style={{ color: "var(--db-text-secondary)" }}>
        {cat}
      </td>

      {/* Work Mode */}
      <td className="px-5 py-4 text-sm" style={{ color: "var(--db-text-secondary)" }}>
        {job.workMode || "—"}
      </td>

      {/* Posted */}
      <td className="px-5 py-4 text-xs whitespace-nowrap" style={{ ...MONO, color: "var(--db-text-muted)" }}>
        {formatDate(job.createdAt)}
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        <span
          className="px-2.5 py-1 text-[10px] font-bold rounded-full uppercase whitespace-nowrap"
          style={{ background: s.bg, color: s.color, ...MONO }}
        >
          {s.label}
        </span>
      </td>

      {/* Applicants */}
      <td className="px-5 py-4">
        <button
          onClick={onToggleExpand}
          disabled={job.applicantCount === 0}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: expanded ? "var(--db-primary-10)" : "transparent",
            color: expanded ? "var(--db-primary)" : "var(--db-text)",
            border: `1px solid ${expanded ? "var(--db-primary-20)" : "transparent"}`,
            cursor: job.applicantCount === 0 ? "not-allowed" : "pointer",
          }}
          title={job.applicantCount === 0 ? "No applicants yet" : expanded ? "Hide applicants" : "View applicants"}
        >
          <span className="text-sm font-bold" style={{ ...MONO }}>{job.applicantCount}</span>
          <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>applied</span>
          {job.applicantCount > 0 && (
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {expanded ? "expand_less" : "expand_more"}
            </span>
          )}
        </button>
      </td>

      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-1">
          {/* Edit */}
          <button
            onClick={() => { if (canEdit) onEdit(); }}
            disabled={!canEdit}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
            style={{ color: "var(--db-text-muted)" }}
            title={canEdit ? "Edit listing" : "Closed listings cannot be edited or republished"}
            onMouseEnter={(e) => {
              if (!canEdit) return;
              (e.currentTarget as HTMLButtonElement).style.background = "var(--db-primary-10)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--db-primary)";
            }}
            onMouseLeave={(e) => {
              if (!canEdit) return;
              (e.currentTarget as HTMLButtonElement).style.background = "";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--db-text-muted)";
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
          </button>

          {/* Close (only if ACTIVE — not pending/rejected) */}
          {job.status === "ACTIVE" && (
            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--db-text-muted)" }}
              title="Close listing"
              onClick={() => onClose(job.id)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.1)";
                (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--db-text-muted)";
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>block</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function ApplicantsExpansionRow({ jobId, state, onReview }: {
  jobId: string;
  state: { loading: boolean; error: string | null; applicants: InlineApplicant[] } | undefined;
  onReview: (applicationId: string) => void;
}) {
  return (
    <tr>
      <td colSpan={7} style={{ background: "var(--db-surface)", borderTop: "1px solid var(--db-border)" }}>
        <div className="px-6 py-4">
          {!state || state.loading ? (
            <div className="text-xs flex items-center gap-2" style={{ color: "var(--db-text-muted)", ...MONO }}>
              <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Loading applicants…
            </div>
          ) : state.error ? (
            <div className="text-xs" style={{ color: "#f87171" }}>{state.error}</div>
          ) : state.applicants.length === 0 ? (
            <div className="text-xs italic" style={{ color: "var(--db-text-muted)" }}>No applicants yet.</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr>
                  {["Applicant", "Headline", "Certifications", "Status", "Applied", ""].map(h => (
                    <th key={h} className="px-3 py-2 text-[10px] uppercase tracking-widest" style={{ ...MONO, color: "var(--db-text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.applicants.map((a) => {
                  const st = APP_STATUS_STYLES[a.status] ?? APP_STATUS_STYLES.PENDING;
                  return (
                    <tr key={a.id} style={{ borderTop: "1px solid var(--db-border)" }}>
                      <td className="px-3 py-2.5">
                        <p className="text-xs font-semibold" style={{ color: "var(--db-text)" }}>{a.seekerName}</p>
                        <p className="text-[10px]" style={{ color: "var(--db-text-muted)" }}>{a.seekerEmail}</p>
                      </td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: "var(--db-text-secondary)" }}>
                        {a.seekerHeadline || "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {a.certifications.slice(0, 3).map(c => (
                            <span key={c} className="rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-bold"
                              style={{ background: "var(--db-primary-10)", color: "var(--db-primary)", border: "1px solid var(--db-primary-20)", ...MONO }}>
                              {c}
                            </span>
                          ))}
                          {a.certifications.length === 0 && <span className="text-[10px]" style={{ color: "var(--db-text-muted)" }}>—</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold"
                          style={{ background: st.bg, color: st.color, ...MONO }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[10px] whitespace-nowrap" style={{ ...MONO, color: "var(--db-text-muted)" }}>
                        {new Date(a.appliedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => onReview(a.id)}
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-full db-btn-primary cursor-pointer"
                          style={{ background: "var(--db-primary)", color: "var(--db-primary-text)", ...MONO }}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div className="mt-2 flex justify-end">
            <a href={`/employer/applicants?job=${jobId}`} className="text-[10px] font-semibold" style={{ color: "var(--db-primary)", ...MONO }}>
              View all in Applicants page &rarr;
            </a>
          </div>
        </div>
      </td>
    </tr>
  );
}

export function ActiveJobListings() {
  const router = useRouter();
  const { jobs, loading, closeJob } = useEmployerJobs();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "ACTIVE" | "CLOSED" | "PENDING_REVIEW" | "REJECTED">("all");
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [applicantsByJob, setApplicantsByJob] = useState<Record<string, { loading: boolean; error: string | null; applicants: InlineApplicant[] }>>({});
  const [selectedJobDetail, setSelectedJobDetail] = useState<EmployerJob | null>(null);

  const toggleExpand = useCallback((jobId: string) => {
    setExpandedJobId(prev => (prev === jobId ? null : jobId));
    setApplicantsByJob(prev => {
      if (prev[jobId] && !prev[jobId].error) return prev;
      return { ...prev, [jobId]: { loading: true, error: null, applicants: [] } };
    });
    apiFetch<{ applications: InlineApplicant[] }>(`/applications/employer?jobId=${encodeURIComponent(jobId)}`)
      .then(res => {
        setApplicantsByJob(prev => ({ ...prev, [jobId]: { loading: false, error: null, applicants: res.applications } }));
      })
      .catch((e: unknown) => {
        setApplicantsByJob(prev => ({
          ...prev,
          [jobId]: { loading: false, error: e instanceof Error ? e.message : "Failed to load applicants", applicants: [] },
        }));
      });
  }, []);

  const handleEdit = useCallback((jobId: string) => {
    router.push({ pathname: "/employer/post-job", query: { editId: jobId } });
  }, [router]);

  const handleReview = useCallback((applicationId: string) => {
    router.push({ pathname: "/employer/applicants", query: { focus: applicationId } });
  }, [router]);

  const filtered = jobs.filter((j) => {
    const matchSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      (j.category ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || j.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <>
      {selectedJobDetail && (
        <EmployerJobDetailDialog job={selectedJobDetail} onClose={() => setSelectedJobDetail(null)} />
      )}
      <section className="db-card overflow-hidden">
      {/* Header */}
      <div
        className="p-5 flex flex-wrap items-center justify-between gap-3"
        style={{ borderBottom: "1px solid var(--db-border)" }}
      >
        <div>
          <h3 className="text-lg font-semibold" style={{ ...POPPINS, color: "var(--db-text)" }}>
            Active Job Listings
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--db-text-muted)" }}>
            {loading ? "Loading…" : `${filtered.length} of ${jobs.length} listing${jobs.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter */}
          <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid var(--db-border)" }}>
            {(["all", "ACTIVE", "PENDING_REVIEW", "REJECTED", "CLOSED"] as const).map((s, i, arr) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="px-3 py-1.5 text-[10px] font-bold uppercase transition-all"
                style={{
                  ...MONO,
                  background: filterStatus === s ? "var(--db-primary)" : "var(--db-card)",
                  color: filterStatus === s ? "var(--db-primary-text)" : "var(--db-text-muted)",
                  borderRight: i < arr.length - 1 ? "1px solid var(--db-border)" : undefined,
                }}
              >
                {s === "all" ? "All" : s === "ACTIVE" ? "Active" : s === "PENDING_REVIEW" ? "Review" : s === "REJECTED" ? "Rejected" : "Closed"}
              </button>
            ))}
          </div>

          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--db-text-muted)" }}>
              search
            </span>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-xs w-28"
              style={{ color: "var(--db-text)", ...MONO }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr style={{ background: "var(--db-table-head)" }}>
              {TABLE_HEADERS.map((h) => (
                <th
                  key={h}
                  className="px-5 py-3.5 text-[10px] uppercase tracking-widest whitespace-nowrap"
                  style={{ ...MONO, color: "var(--db-text-muted)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
            ) : filtered.length === 0 ? (
              <EmptyState />
            ) : (
              filtered.map((job, i) => (
                <Fragment key={job.id}>
                  <JobRow
                    job={job}
                    onClose={closeJob}
                    index={i}
                    expanded={expandedJobId === job.id}
                    onToggleExpand={() => toggleExpand(job.id)}
                    onEdit={() => handleEdit(job.id)}
                    onViewDetails={() => setSelectedJobDetail(job)}
                  />
                  {expandedJobId === job.id && (
                    <ApplicantsExpansionRow
                      jobId={job.id}
                      state={applicantsByJob[job.id]}
                      onReview={handleReview}
                    />
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {!loading && filtered.length > 0 && (
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderTop: "1px solid var(--db-border)", background: "var(--db-table-head)" }}
        >
          <span className="text-[10px]" style={{ ...MONO, color: "var(--db-text-muted)" }}>
            Showing {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
          <a
            href="/employer/jobs"
            className="text-[10px] font-semibold transition-colors"
            style={{ color: "var(--db-primary)", ...MONO }}
          >
            View all listings &rarr;
          </a>
        </div>
      )}
    </section>
    </>
  );
}
