import React, { useState } from "react";
import { useEmployerJobs, EmployerJob } from "../../../contexts/EmployerJobsContext";

const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const SYNE = { fontFamily: "'Syne', sans-serif" };

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
  ACTIVE: { bg: "rgba(16,185,129,0.12)", color: "#10b981", label: "Active" },
  CLOSED: { bg: "rgba(100,116,139,0.15)", color: "#64748b", label: "Closed" },
  DRAFT:  { bg: "rgba(245,158,11,0.12)",  color: "#f59e0b", label: "Draft"  },
};

const TABLE_HEADERS = ["Job Title", "Category", "Work Mode", "Posted", "Status", "Applicants", "Actions"];

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

function JobRow({ job, onClose, index }: { job: EmployerJob; onClose: (id: string) => void; index: number }) {
  const s  = STATUS_STYLES[job.status] ?? STATUS_STYLES.CLOSED;
  const cat = CATEGORY_LABELS[job.category] ?? job.category ?? "—";

  return (
    <tr
      style={{
        borderTop: index > 0 ? "1px solid var(--db-border)" : undefined,
        transition: "background-color 0.15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--db-table-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
    >
      {/* Job Title */}
      <td className="px-5 py-4">
        <p className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>
          {job.title}
        </p>
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
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: "var(--db-text)", ...MONO }}>
            {job.applicantCount}
          </span>
          <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>applied</span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-1">
          {/* Edit */}
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: "var(--db-text-muted)" }}
            title="Edit listing"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.1)";
              (e.currentTarget as HTMLButtonElement).style.color = "#6366f1";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--db-text-muted)";
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
          </button>

          {/* Close (only if ACTIVE) */}
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

export function ActiveJobListings() {
  const { jobs, loading, closeJob } = useEmployerJobs();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "ACTIVE" | "CLOSED">("all");

  const filtered = jobs.filter((j) => {
    const matchSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      (j.category ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || j.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <section className="db-card overflow-hidden">
      {/* Header */}
      <div
        className="p-5 flex flex-wrap items-center justify-between gap-3"
        style={{ borderBottom: "1px solid var(--db-border)" }}
      >
        <div>
          <h3 className="text-lg font-semibold" style={{ ...SYNE, color: "var(--db-text)" }}>
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
            {(["all", "ACTIVE", "CLOSED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="px-3 py-1.5 text-[10px] font-bold uppercase transition-all"
                style={{
                  ...MONO,
                  background: filterStatus === s ? "var(--db-primary)" : "var(--db-card)",
                  color: filterStatus === s ? "var(--db-primary-text)" : "var(--db-text-muted)",
                  borderRight: s !== "CLOSED" ? "1px solid var(--db-border)" : undefined,
                }}
              >
                {s === "all" ? "All" : s === "ACTIVE" ? "Active" : "Closed"}
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
                <JobRow key={job.id} job={job} onClose={closeJob} index={i} />
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
  );
}
