import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "@/lib/api";
import type { DialogJob } from "./jobs/JobDetailDialog";

const MONO    = { fontFamily: "'JetBrains Mono', monospace" };
const PRIMARY = "var(--db-primary)";

function salaryLabel(min: number, max: number, currency: string, undisclosed: boolean): string {
  if (undisclosed || (min === 0 && max === 0)) return "Competitive";
  const safeCurrency = currency || "USD";
  const fmt = (v: number) => new Intl.NumberFormat("en", {
    style: "currency", currency: safeCurrency, notation: "compact", maximumFractionDigits: 0,
  }).format(v);
  if (min > 0 && max > 0) return `${fmt(min)} – ${fmt(max)}`;
  if (min > 0) return `From ${fmt(min)}`;
  return `Up to ${fmt(max)}`;
}

export function SavedJobsPopover() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<DialogJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [fetchedOnce, setFetchedOnce] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const loadCount = useCallback(() => {
    apiFetch<{ jobs: DialogJob[] }>("/jobs/saved")
      .then(res => setCount(res.jobs.length))
      .catch(() => { /* silent — badge just won't show */ });
  }, []);

  useEffect(() => { loadCount(); }, [loadCount]);

  const loadJobs = useCallback(() => {
    setLoading(true);
    setError(null);
    apiFetch<{ jobs: DialogJob[] }>("/jobs/saved")
      .then(res => { setJobs(res.jobs); setCount(res.jobs.length); setFetchedOnce(true); })
      .catch(e => setError(e instanceof Error ? e.message : "Failed to load saved jobs"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (open && !fetchedOnce) loadJobs();
  }, [open, fetchedOnce, loadJobs]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleOpen = (jobId: string) => {
    setOpen(false);
    router.push(`/dashboard/job/${jobId}`);
  };

  const handleUnsave = (jobId: string) => {
    setJobs(prev => prev.filter(j => j.id !== jobId));
    setCount(c => Math.max(0, c - 1));
    apiFetch(`/jobs/${jobId}/save`, { method: "DELETE" }).catch(() => loadJobs());
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-10 h-10 flex items-center justify-center rounded-full border transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 relative"
        style={{
          background: open ? "var(--db-primary-10)" : "rgba(255, 255, 255, 0.05)",
          borderColor: open ? "var(--db-primary-20)" : "var(--db-border)",
        }}
        aria-label="Saved jobs"
        aria-expanded={open}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 20,
            color: open ? PRIMARY : "var(--db-text-secondary)",
            fontVariationSettings: count > 0 ? "'FILL' 1" : "'FILL' 0",
          }}
        >
          bookmark
        </span>
        {count > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full"
            style={{
              background: PRIMARY,
              color: "var(--db-primary-text)",
              border: "2px solid var(--db-card)",
              ...MONO,
            }}
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-[380px] rounded-[18px] border overflow-hidden z-50"
          style={{
            background: "var(--db-dialog-bg, #ffffff)",
            borderColor: "var(--db-border)",
            boxShadow: "0 20px 50px rgba(58,18,146,0.16), 0 0 0 1px var(--db-border)",
          }}
        >
          <div
            className="px-5 py-3.5 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--db-border)", background: "var(--db-primary-10)" }}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: PRIMARY, fontVariationSettings: "'FILL' 1" }}>bookmark</span>
              <span className="text-sm font-bold" style={{ color: PRIMARY }}>Saved Jobs</span>
              <span className="text-xs" style={{ color: "var(--db-text-muted)", ...MONO }}>
                {count} total
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
              style={{ color: "var(--db-text-muted)" }}
              aria-label="Close"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="px-5 py-8 text-center text-xs" style={{ color: "var(--db-text-muted)" }}>
                Loading saved jobs…
              </div>
            ) : error ? (
              <div className="px-5 py-8 text-center text-xs" style={{ color: "#f87171" }}>
                {error}
              </div>
            ) : jobs.length === 0 ? (
              <div className="px-5 py-10 text-center flex flex-col items-center gap-3">
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: "var(--db-text-muted)" }}>bookmark_border</span>
                <p className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>No saved jobs yet</p>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                  Bookmark roles to see them here.
                </p>
              </div>
            ) : (
              <ul>
                {jobs.slice(0, 8).map(job => (
                  <li
                    key={job.id}
                    className="px-5 py-3 flex items-start gap-3 cursor-pointer transition-colors"
                    onClick={() => handleOpen(job.id)}
                    style={{ borderBottom: "1px solid var(--db-border)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--db-primary-10)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ background: "linear-gradient(180deg,#f4f2ea 0%,#d8dfdb 100%)", color: "#2c3a4f" }}
                    >
                      {job.companyLogoText}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate" style={{ color: PRIMARY }}>{job.companyName}</p>
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--db-text)" }}>{job.title}</p>
                      <div className="mt-1 flex items-center gap-2 text-[10px]" style={{ color: "var(--db-text-muted)", ...MONO }}>
                        <span>{job.workMode}</span>
                        <span>·</span>
                        <span>{salaryLabel(job.salaryMin, job.salaryMax, job.salaryCurrency || "USD", job.undisclosedSalary)}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUnsave(job.id); }}
                      className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                      style={{ color: PRIMARY }}
                      title="Remove from saved"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {jobs.length > 0 && (
            <div
              className="px-5 py-2.5 text-right"
              style={{ borderTop: "1px solid var(--db-border)", background: "var(--db-surface)" }}
            >
              <button
                onClick={() => { setOpen(false); router.push("/dashboard/jobs"); }}
                className="text-[11px] font-bold"
                style={{ color: PRIMARY, ...MONO }}
              >
                BROWSE ALL JOBS &rarr;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
