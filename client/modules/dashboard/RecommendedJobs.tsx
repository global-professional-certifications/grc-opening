import React, { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { JobDetailDialog, DialogJob, SupportedCurrency } from "./jobs/JobDetailDialog";
import { ApplyModal, ApplySuccessToast, ReportModal } from "./jobs/JobsMarketplaceRefined";

const PRIMARY = "var(--db-primary)";
const CARD    = "var(--db-card)";

function CertTag({ label }: { label: string }) {
  return (
    <span
      className="px-2 py-1 rounded text-[10px] font-semibold"
      style={{ background: "rgba(255,255,255,0.05)", color: "var(--db-text-secondary)", border: "1px solid var(--db-border)" }}
    >
      {label}
    </span>
  );
}

function ActiveBadge({ pulse }: { pulse?: boolean }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
      style={{ background: "var(--db-primary-10)", color: PRIMARY }}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${pulse ? "animate-pulse" : ""}`} style={{ background: PRIMARY }} />
      Actively hiring
    </div>
  );
}

interface JobCardProps {
  job: DialogJob;
  isSaved: boolean;
  isApplied: boolean;
  onViewDetails: () => void;
  onRequestApply: () => void;
  onWithdraw: () => void;
  onReport: () => void;
  onToggleSave: () => void;
}

function JobCard({ job, isSaved, isApplied, onViewDetails, onRequestApply, onWithdraw, onReport, onToggleSave }: JobCardProps) {
  return (
    <div
      className="db-card p-6 flex flex-col justify-between border-transparent shadow-md min-w-[300px] max-w-[320px] lg:max-w-none lg:w-[calc(33.333%-1rem)] shrink-0 cursor-pointer"
      style={{ scrollSnapAlign: "start" }}
      onClick={onViewDetails}
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center p-2 overflow-hidden shadow-sm font-bold text-xl"
            style={{ border: "1px solid var(--db-border)", background: "linear-gradient(135deg, var(--db-primary-10), var(--db-surface))", color: PRIMARY }}
          >
            {job.companyLogoText}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
              className="w-8 h-8 rounded-full border flex items-center justify-center transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-(--db-primary) focus:ring-offset-1"
              style={{
                background:  isSaved ? PRIMARY : "transparent",
                color:       isSaved ? "var(--db-primary-text, #fff)" : "var(--db-text-secondary)",
                borderColor: isSaved ? PRIMARY : "var(--db-border)",
                boxShadow:   isSaved ? "0 4px 12px var(--db-primary-20)" : "none",
              }}
              aria-label={isSaved ? "Unsave job" : "Save job"}
              aria-pressed={isSaved}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }} aria-hidden="true">
                bookmark
              </span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onReport(); }}
              className="w-8 h-8 rounded-full border flex items-center justify-center transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
              style={{ background: "transparent", borderColor: "rgba(239,68,68,0.3)", color: "#f87171" }}
              aria-label="Report this job"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }} aria-hidden="true">flag</span>
            </button>
            <ActiveBadge pulse />
          </div>
        </div>

        <h4 className="text-lg font-bold mb-1 line-clamp-2" style={{ color: "var(--db-text)" }}>{job.title}</h4>
        <p className="text-sm mb-4 font-medium" style={{ color: "var(--db-text-secondary)" }}>
          {job.companyName} · {job.location || job.workMode}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {job.tags.slice(0, 3).map(t => <CertTag key={t} label={t} />)}
          {job.tags.length > 3 && <CertTag label={`+${job.tags.length - 3}`} />}
        </div>
      </div>

      <div className="flex gap-2 mt-auto">
        <button
          onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
          className="flex-1 py-2.5 font-bold text-sm rounded-full border transition-all hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-(--db-primary) focus:ring-offset-1"
          style={{ borderColor: PRIMARY, color: PRIMARY, background: "transparent" }}
        >
          View Details
        </button>
        {isApplied ? (
          <button
            onClick={(e) => { e.stopPropagation(); onWithdraw(); }}
            className="flex-1 py-2.5 font-bold text-sm rounded-full border transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
            style={{ background: "transparent", color: "#f87171", borderColor: "rgba(239,68,68,0.4)" }}
          >
            Withdraw
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onRequestApply(); }}
            className="flex-1 py-2.5 font-bold text-sm rounded-full transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-(--db-primary) focus:ring-offset-1"
            style={{ background: PRIMARY, color: "#fff", border: "none", boxShadow: "0 4px 12px var(--db-primary-20)" }}
          >
            Apply Now
          </button>
        )}
      </div>
    </div>
  );
}

export function RecommendedJobs() {
  const [jobs, setJobs]           = useState<DialogJob[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selectedJob, setSelectedJob] = useState<DialogJob | null>(null);
  const [savedIds, setSavedIds]   = useState<Set<string>>(new Set());
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [saveError, setSaveError]       = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [applyTarget, setApplyTarget] = useState<DialogJob | null>(null);
  const [applySuccess, setApplySuccess] = useState<{ jobTitle: string } | null>(null);
  const [reportTarget, setReportTarget] = useState<DialogJob | null>(null);
  const [currency, setCurrency]   = useState<SupportedCurrency>("USD");
  const scrollContainerRef        = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("grc_preferred_currency") as SupportedCurrency | null;
    if (stored) setCurrency(stored);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "grc_preferred_currency" && e.newValue) setCurrency(e.newValue as SupportedCurrency);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    let mounted = true;
    apiFetch<{ jobs: DialogJob[] }>("/jobs/discover")
      .then(res => {
        if (!mounted) return;
        setJobs(res.jobs);
        setSavedIds(new Set(res.jobs.filter(j => j.isSaved).map(j => j.id)));
        setAppliedIds(new Set((res.jobs as any[]).filter((j: any) => j.isApplied).map((j: any) => j.id)));

      })
      .catch(err => console.error("Error fetching recommended jobs:", err))
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!saveError) return;
    const id = setTimeout(() => setSaveError(null), 5000);
    return () => clearTimeout(id);
  }, [saveError]);

  const makeToggleSave = useCallback((jobId: string) => () => {
    const nowSaved = !savedIds.has(jobId);
    setSaveError(null);
    setSavedIds(prev => {
      const next = new Set(prev);
      if (nowSaved) next.add(jobId);
      else next.delete(jobId);
      return next;
    });
    apiFetch(`/jobs/${jobId}/save`, { method: nowSaved ? "POST" : "DELETE" }).catch((e: unknown) => {
      setSavedIds(prev => {
        const next = new Set(prev);
        if (nowSaved) next.delete(jobId);
        else next.add(jobId);
        return next;
      });
      setSaveError(e instanceof Error ? e.message : "Failed to update saved jobs");
    });
  }, [savedIds]);

  const makeWithdraw = useCallback((jobId: string) => async () => {
    try {
      await apiFetch(`/jobs/${jobId}/withdraw`, { method: "PATCH" });
      setAppliedIds(prev => { const next = new Set(prev); next.delete(jobId); return next; });
    } catch (e: unknown) {
      setWithdrawError(e instanceof Error ? e.message : "Failed to withdraw application");
    }
  }, []);

  const makeApply = useCallback((jobId: string) => async (notes: string): Promise<void> => {
    await apiFetch(`/jobs/${jobId}/apply`, { method: "POST", body: JSON.stringify({ notes }) });
    setAppliedIds(prev => new Set(prev).add(jobId));
  }, []);

  const scrollLeft  = () => scrollContainerRef.current?.scrollBy({ left: -320, behavior: "smooth" });
  const scrollRight = () => scrollContainerRef.current?.scrollBy({ left:  320, behavior: "smooth" });

  return (
    <section>
      {withdrawError && (
        <div className="mb-5 rounded-[18px] border px-5 py-4 flex items-center justify-between gap-4"
          style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.25)" }}>
          <div className="flex items-center gap-3 min-w-0">
            <span className="material-symbols-outlined shrink-0" style={{ fontSize: 20, color: "#f87171" }}>error</span>
            <span className="truncate" style={{ fontSize: "0.9rem", color: "#f87171" }}>
              Could not withdraw application — {withdrawError}
            </span>
          </div>
          <button type="button" onClick={() => setWithdrawError(null)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
            style={{ borderColor: "rgba(239,68,68,0.35)", color: "#f87171", background: "transparent" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>
      )}
      {saveError && (
        <div
          className="mb-5 rounded-[18px] border px-5 py-4 flex items-center justify-between gap-4"
          style={{ background: "rgba(245,158,11,0.10)", borderColor: "rgba(245,158,11,0.35)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="material-symbols-outlined shrink-0" style={{ fontSize: 20, color: "#f59e0b" }}>warning</span>
            <span className="truncate" style={{ fontSize: "0.9rem", color: "var(--db-text-secondary)" }}>
              Could not update saved jobs — {saveError}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSaveError(null)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
            style={{ borderColor: "rgba(245,158,11,0.35)", color: "#f59e0b", background: "transparent" }}
            aria-label="Dismiss save error"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>
      )}
      {applyTarget && (
        <ApplyModal
          job={applyTarget}
          selectedCurrency={currency}
          onSubmit={async (notes) => {
            await makeApply(applyTarget.id)(notes);
            setApplySuccess({ jobTitle: applyTarget.title });
            setApplyTarget(null);
          }}
          onClose={() => setApplyTarget(null)}
        />
      )}
      {applySuccess && (
        <ApplySuccessToast jobTitle={applySuccess.jobTitle} onDismiss={() => setApplySuccess(null)} />
      )}
      {reportTarget && (
        <ReportModal jobId={reportTarget.id} jobTitle={reportTarget.title} onClose={() => setReportTarget(null)} />
      )}
      <div className="flex justify-between items-end mb-6">
        <h3 className="text-xl font-bold border-l-4 pl-3" style={{ color: "var(--db-text)", borderColor: PRIMARY }}>
          Recommended Jobs
        </h3>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex gap-2">
            <button
              onClick={scrollLeft}
              className="w-8 h-8 rounded-full border flex items-center justify-center transition-colors hover:bg-[var(--db-primary-10)]"
              style={{ borderColor: "var(--db-border)", color: "var(--db-text-secondary)" }}
            >
              <span className="material-symbols-outlined shrink-0" style={{ fontSize: 18 }}>chevron_left</span>
            </button>
            <button
              onClick={scrollRight}
              className="w-8 h-8 rounded-full border flex items-center justify-center transition-colors hover:bg-[var(--db-primary-10)]"
              style={{ borderColor: "var(--db-border)", color: "var(--db-text-secondary)" }}
            >
              <span className="material-symbols-outlined shrink-0" style={{ fontSize: 18 }}>chevron_right</span>
            </button>
          </div>
          <a href="/dashboard/jobs" className="text-sm font-bold hover:opacity-80 transition-opacity whitespace-nowrap" style={{ color: PRIMARY }}>
            View all roles
          </a>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center text-sm font-medium" style={{ color: "var(--db-text-muted)" }}>
          Loading recommendations…
        </div>
      ) : jobs.length === 0 ? (
        <div className="py-12 flex justify-center text-sm font-medium" style={{ color: "var(--db-text-muted)" }}>
          No recommendations found matching your profile.
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar"
          style={{ scrollSnapType: "x mandatory", msOverflowStyle: "none", scrollbarWidth: "none" }}
        >
          <style dangerouslySetInnerHTML={{ __html: ".hide-scrollbar::-webkit-scrollbar{display:none}" }} />
          {jobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              isSaved={savedIds.has(job.id)}
              isApplied={appliedIds.has(job.id)}
              onViewDetails={() => setSelectedJob(job)}
              onRequestApply={() => setApplyTarget(job)}
              onWithdraw={makeWithdraw(job.id)}
              onReport={() => setReportTarget(job)}
              onToggleSave={makeToggleSave(job.id)}
            />
          ))}
        </div>
      )}

      {selectedJob && (
        <JobDetailDialog
          job={{ ...selectedJob, isSaved: savedIds.has(selectedJob.id) }}
          selectedCurrency={currency}
          isApplied={appliedIds.has(selectedJob.id)}
          onClose={() => setSelectedJob(null)}
          onRequestApply={() => { setSelectedJob(null); setApplyTarget(selectedJob); }}
          onWithdraw={makeWithdraw(selectedJob.id)}
          onReport={() => { setSelectedJob(null); setReportTarget(selectedJob); }}
          onToggleSave={makeToggleSave(selectedJob.id)}
        />
      )}
    </section>
  );
}
