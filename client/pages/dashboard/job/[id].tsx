import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { apiFetch } from "@/lib/api";

const POPPINS = { fontFamily: "'Poppins', sans-serif" };
const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const PRIMARY = "var(--db-primary)";

type JobDetail = {
  id: string;
  title: string;
  description: string;
  responsibilities: string;
  qualifications: string;
  niceToHave: string;
  location: string;
  workMode: string;
  jobType: string;
  seniority: string;
  experience: string;
  deadline: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  undisclosedSalary: boolean;
  category: string;
  certifications: { id: string; name: string }[];
  employer: {
    companyName: string;
    industry: string | null;
    description: string | null;
    website: string | null;
  };
  hasApplied: boolean;
  isSaved: boolean;
  _count: { applications: number };
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3
        className="text-[0.78rem] uppercase tracking-[0.22em] mb-3 font-bold"
        style={{ color: PRIMARY, ...MONO }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span
      className="rounded-full px-3 py-1 text-[0.68rem] uppercase tracking-[0.14em] font-bold"
      style={{ background: "var(--db-primary-10)", border: "1px solid var(--db-primary-20)", color: PRIMARY, ...MONO }}
    >
      {label}
    </span>
  );
}

export default function JobDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiFetch<{ job: JobDetail }>(`/jobs/${id}`)
      .then(res => {
        setJob(res.job);
        setApplied(res.job.hasApplied);
        setIsSaved(res.job.isSaved);
      })
      .catch(e => setError(e instanceof Error ? e.message : "Failed to load job"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleApply() {
    if (!job || applying || applied) return;
    setApplying(true);
    setApplyError(null);
    try {
      await apiFetch(`/jobs/${job.id}/apply`, { method: "POST" });
      setApplied(true);
    } catch (e: unknown) {
      setApplyError(e instanceof Error ? e.message : "Failed to apply");
    } finally {
      setApplying(false);
    }
  }

  function handleToggleSave() {
    if (!job) return;
    const nowSaved = !isSaved;
    setIsSaved(nowSaved);
    apiFetch(`/jobs/${job.id}/save`, { method: nowSaved ? "POST" : "DELETE" }).catch(() => setIsSaved(!nowSaved));
  }

  function formatSalary(min: number | null, max: number | null, currency: string, undisclosed: boolean) {
    if (undisclosed) return "Competitive";
    if (!min && !max) return "Competitive";
    const fmt = (v: number) =>
      new Intl.NumberFormat("en", { style: "currency", currency, notation: "compact", maximumFractionDigits: 0 }).format(v);
    if (min && max) return `${fmt(min)} – ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    return `Up to ${fmt(max!)}`;
  }

  function formatDeadline(deadline: string | null): string | null {
    if (!deadline) return null;
    const dt = new Date(deadline);
    if (Number.isNaN(dt.getTime())) return null;
    return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "2-digit" }).format(dt);
  }

  return (
    <DashboardLayout>
      {loading ? (
        <div className="flex items-center justify-center py-24" style={{ color: "var(--db-text-muted)" }}>
          Loading job details…
        </div>
      ) : error || !job ? (
        <div className="rounded-2xl border px-8 py-10 text-center" style={{ borderColor: "rgba(239,68,68,0.25)", color: "#f87171", background: "rgba(239,68,68,0.06)" }}>
          <span className="material-symbols-outlined mb-3 block" style={{ fontSize: 40 }}>error</span>
          <p>{error ?? "Job not found"}</p>
          <button onClick={() => router.back()} className="mt-4 text-sm underline" style={{ color: PRIMARY }}>← Go back</button>
        </div>
      ) : (
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* Back */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--db-text-muted)", ...POPPINS }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
            Back to Jobs
          </button>

          {/* Header card */}
          <div
            className="rounded-[24px] border p-8"
            style={{ background: "var(--db-card)", borderColor: "var(--db-border)" }}
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex gap-5 min-w-0">
                <div
                  className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-2xl text-xl font-bold"
                  style={{ background: "linear-gradient(180deg,#f4f2ea 0%,#d8dfdb 100%)", color: "#2c3a4f", ...POPPINS }}
                >
                  {job.employer.companyName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold" style={{ color: PRIMARY }}>{job.employer.companyName}</p>
                  {job.employer.industry && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--db-text-muted)" }}>{job.employer.industry}</p>
                  )}
                  <h1 className="mt-2 text-2xl md:text-3xl font-bold leading-tight" style={{ color: "var(--db-text)", ...POPPINS }}>
                    {job.title}
                  </h1>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm" style={{ color: "var(--db-text-secondary)" }}>
                    {job.location && (
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>location_on</span>
                        {job.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                        {job.workMode === "REMOTE" ? "wifi" : job.workMode === "HYBRID" ? "home_work" : "apartment"}
                      </span>
                      {job.workMode === "REMOTE" ? "Remote" : job.workMode === "HYBRID" ? "Hybrid" : "On-site"}
                    </span>
                    {job.jobType && (
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>work</span>
                        {job.jobType}
                      </span>
                    )}
                    {job.seniority && (
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>bar_chart</span>
                        {job.seniority}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
                <div className="text-2xl font-bold" style={{ color: "var(--db-text)", ...POPPINS }}>
                  {formatSalary(job.salaryMin, job.salaryMax, job.currency, job.undisclosedSalary)}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleSave}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all hover:scale-110"
                    style={{
                      background: isSaved ? "var(--db-primary-10)" : "var(--db-card)",
                      borderColor: isSaved ? PRIMARY : "var(--db-border)",
                      color: isSaved ? PRIMARY : "var(--db-text-secondary)",
                    }}
                    aria-label={isSaved ? "Unsave" : "Save"}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>
                  </button>
                  <button
                    onClick={handleApply}
                    disabled={applying || applied}
                    className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-[0.95rem] font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{
                      background: applied ? "transparent" : PRIMARY,
                      color: applied ? PRIMARY : "var(--db-primary-text)",
                      border: applied ? `1.5px solid ${PRIMARY}` : "none",
                      boxShadow: applied ? "none" : "0 12px 24px var(--db-primary-20)",
                    }}
                  >
                    {applying ? (
                      <><span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />Applying…</>
                    ) : applied ? (
                      <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>Applied!</>
                    ) : (
                      <>Apply Now<span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span></>
                    )}
                  </button>
                </div>
                {applyError && <p className="text-xs" style={{ color: "#f87171" }}>{applyError}</p>}
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{job._count.applications} applicant{job._count.applications !== 1 ? "s" : ""}</p>
              </div>
            </div>

            {job.certifications.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {job.certifications.map(c => <Badge key={c.id} label={c.name} />)}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="rounded-[20px] border p-7 space-y-8" style={{ background: "var(--db-card)", borderColor: "var(--db-border)" }}>
                <Section title="About the Role">
                  <p className="text-[0.95rem] leading-relaxed whitespace-pre-line" style={{ color: "var(--db-text-secondary)" }}>
                    {job.description}
                  </p>
                </Section>

                {job.responsibilities && (
                  <Section title="Responsibilities">
                    <p className="text-[0.95rem] leading-relaxed whitespace-pre-line" style={{ color: "var(--db-text-secondary)" }}>
                      {job.responsibilities}
                    </p>
                  </Section>
                )}

                {job.qualifications && (
                  <Section title="Qualifications">
                    <p className="text-[0.95rem] leading-relaxed whitespace-pre-line" style={{ color: "var(--db-text-secondary)" }}>
                      {job.qualifications}
                    </p>
                  </Section>
                )}

                {job.niceToHave && (
                  <Section title="Nice to Have">
                    <p className="text-[0.95rem] leading-relaxed whitespace-pre-line" style={{ color: "var(--db-text-secondary)" }}>
                      {job.niceToHave}
                    </p>
                  </Section>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              <div className="rounded-[20px] border p-6 space-y-5" style={{ background: "var(--db-card)", borderColor: "var(--db-border)" }}>
                <Section title="Job Details">
                  <dl className="space-y-3 text-sm">
                    {[
                      { label: "Category", value: job.category },
                      { label: "Type", value: job.jobType },
                      { label: "Seniority", value: job.seniority },
                      { label: "Experience", value: job.experience },
                      { label: "Work Mode", value: job.workMode === "REMOTE" ? "Remote" : job.workMode === "HYBRID" ? "Hybrid" : "On-site" },
                      { label: "Deadline", value: formatDeadline(job.deadline) },
                    ]
                      .filter(r => r.value)
                      .map(r => (
                        <div key={r.label} className="flex justify-between gap-2">
                          <dt style={{ color: "var(--db-text-muted)" }}>{r.label}</dt>
                          <dd className="font-semibold text-right" style={{ color: "var(--db-text)" }}>{r.value}</dd>
                        </div>
                      ))}
                  </dl>
                </Section>
              </div>

              {job.employer.description && (
                <div className="rounded-[20px] border p-6" style={{ background: "var(--db-card)", borderColor: "var(--db-border)" }}>
                  <Section title="About the Company">
                    <p className="text-[0.88rem] leading-relaxed mt-0" style={{ color: "var(--db-text-secondary)" }}>
                      {job.employer.description}
                    </p>
                    {job.employer.website && (
                      <a
                        href={job.employer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold hover:underline"
                        style={{ color: PRIMARY }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>language</span>
                        Visit website
                      </a>
                    )}
                  </Section>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
