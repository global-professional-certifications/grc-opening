import React, { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const SYNE = { fontFamily: "'Syne', sans-serif" };

// Map Prisma JobStatus enum to the frontend type
type JobStatus = "PUBLISHED" | "CLOSED" | "DRAFT";

interface Certification {
  id: string;
  name: string;
}

interface Job {
  id: string;
  title: string;
  location: string | null;
  workMode: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  certifications: Certification[];
  _count: { applications: number };
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PUBLISHED: { bg: "rgba(16,185,129,0.12)", color: "#10b981", label: "Active" },
  CLOSED:    { bg: "rgba(100,116,139,0.15)", color: "#64748b", label: "Closed" },
  DRAFT:     { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", label: "Draft" },
};

const TABLE_HEADERS = ["Job Title", "Category", "Posted", "Status", "Applicants", "Actions"];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function workModeLabel(mode: string): string {
  if (mode === "REMOTE") return "Remote";
  if (mode === "HYBRID") return "Hybrid";
  return "On-site";
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={6}>
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
            className="px-4 py-2 text-sm font-semibold rounded-full db-btn-primary"
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
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 rounded animate-pulse" style={{ background: "var(--db-border)", width: `${60 + i * 10}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function ActiveJobListings() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "PUBLISHED" | "CLOSED">("all");

  useEffect(() => {
    apiFetch<{ jobs: Job[] }>("/jobs/my-postings")
      .then(res => setJobs(res.jobs))
      .catch(err => console.error("Failed to load job listings:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(j => {
    const matchSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      (j.certifications.some(c => c.name.toLowerCase().includes(search.toLowerCase())));
    const matchStatus = filterStatus === "all" || j.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleClose = async (jobId: string) => {
    try {
      await apiFetch(`/jobs/${jobId}/close`, { method: "PATCH" });
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: "CLOSED" as JobStatus } : j));
    } catch (err) {
      console.error("Failed to close job:", err);
    }
  };

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
            {loading ? "Loading..." : `${filtered.length} of ${jobs.length} listing${jobs.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter */}
          <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid var(--db-border)" }}>
            {(["all", "PUBLISHED", "CLOSED"] as const).map((s) => (
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
                {s === "all" ? "All" : s === "PUBLISHED" ? "Active" : "Closed"}
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
              filtered.map((job, i) => {
                const s = STATUS_STYLES[job.status] ?? STATUS_STYLES.CLOSED;
                const categoryLabel = job.certifications.length > 0
                  ? job.certifications.map(c => c.name).join(", ")
                  : "—";
                const locationStr = job.location
                  ? `${job.location} \u2022 ${workModeLabel(job.workMode)}`
                  : workModeLabel(job.workMode);
                return (
                  <tr
                    key={job.id}
                    className="group"
                    style={{
                      borderTop: i > 0 ? "1px solid var(--db-border)" : undefined,
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
                      <p className="text-[10px] mt-0.5" style={{ ...MONO, color: "var(--db-text-muted)" }}>
                        {locationStr}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="px-5 py-4 text-sm" style={{ color: "var(--db-text-secondary)" }}>
                      {categoryLabel}
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
                          {job._count.applications}
                        </span>
                        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>applied</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                          style={{ color: "var(--db-text-muted)" }}
                          title="View listing"
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = "var(--db-primary-10)";
                            (e.currentTarget as HTMLButtonElement).style.color = "var(--db-primary)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = "";
                            (e.currentTarget as HTMLButtonElement).style.color = "var(--db-text-muted)";
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>visibility</span>
                        </button>
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
                        {job.status === "PUBLISHED" && (
                          <button
                            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                            style={{ color: "var(--db-text-muted)" }}
                            title="Close listing"
                            onClick={() => handleClose(job.id)}
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
              })
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
