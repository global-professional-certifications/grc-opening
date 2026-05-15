import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { apiFetch } from "../../../lib/api";
import { JobDetailDialog } from "./JobDetailDialog";
import type { DialogJob, SupportedCurrency } from "./JobDetailDialog";
import { EmployerProfileModal, type EmployerForModal } from "../EmployerProfileModal";

// Types

type DiscoveryJob = {
  id: string;
  companyName: string;
  companyLogoText: string;
  title: string;
  category: string;
  location: string;
  workMode: "Remote" | "Hybrid" | "On-site";
  jobType: string;
  seniority: string;
  experienceLevel: string;
  postedAtLabel: string;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  undisclosedSalary: boolean;
  applicationWindowLabel: string;
  applyUrl: string;
  tags: string[];
  verified: boolean;
  description: string;
  niceToHave: string;
  isSaved: boolean;
  isApplied?: boolean;
  applicationId?: string | null;
};

type DiscoveryFilters = {
  categories: string[];
  workModes: Array<"Remote" | "Hybrid" | "On-site">;
  experienceLevels: string[];
  salaryRange: { min: number; max: number };
};

type DiscoveryResponse = {
  jobs: DiscoveryJob[];
  filters: DiscoveryFilters;
  meta: { totalJobs: number };
};

type EmployerPayload = {
  companyName?: string | null;
  industry?: string | null;
  companySize?: string | null;
  description?: string | null;
  tagline?: string | null;
  foundedYear?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  otherUrl?: string | null;
};

type JobDetailWithEmployerResponse = {
  job?: {
    employer?: EmployerPayload | null;
  } | null;
};

//  Constants
const POPPINS = { fontFamily: "'Poppins', sans-serif" };
const MONO    = { fontFamily: "'JetBrains Mono', monospace" };
const PAGE_SIZE = 4;

const PRIMARY        = "var(--db-primary)";
const SURFACE        = "var(--db-bg)";
const CARD           = "var(--db-card)";
const BORDER         = "var(--db-border)";
const TEXT_PRIMARY   = "var(--db-text)";
const TEXT_SECONDARY = "var(--db-text-secondary)";
const AMBER          = "#f59e0b";

const CURRENCY_RATES: Record<SupportedCurrency, number> = {
  USD: 1,      EUR: 0.92,   GBP: 0.79,   INR: 83.1,   CAD: 1.36,   AUD: 1.52,
  NZD: 1.63,   SGD: 1.34,   AED: 3.67,   SAR: 3.75,   QAR: 3.64,   KWD: 0.31,
  JPY: 149.5,  CNY: 7.24,   KRW: 1330,   RUB: 90.5,   BRL: 5.0,    MXN: 17.2,
  ZAR: 18.7,   NGN: 1550,   EGP: 48.5,   TRY: 32.5,   CHF: 0.89,   SEK: 10.5,
  NOK: 10.6,   DKK: 6.88,   PLN: 4.0,    UAH: 39.5,   IDR: 15700,  THB: 35.5,
  MYR: 4.7,    PHP: 56.5,   VND: 24800,  PKR: 278,     BDT: 110,    LKR: 325,
  NPR: 133,    ARS: 900,    CLP: 950,    COP: 4000,   PEN: 3.75,
};

const ALL_WORK_MODES = ["Remote", "Hybrid", "On-site"] as const;

const ALL_CATEGORIES: Array<{ value: string; label: string }> = [
  { value: "audit",      label: "Internal Audit" },
  { value: "compliance", label: "Compliance" },
  { value: "risk",       label: "Risk Management" },
  { value: "privacy",    label: "Data Privacy" },
  { value: "security",   label: "Information Security" },
  { value: "governance", label: "Corporate Governance" },
  { value: "regulatory", label: "Regulatory Affairs" },
];

const ALL_EXPERIENCE_LEVELS: Array<{ value: string; label: string }> = [
  { value: "0-2", label: "Entry Level (0–2 years)" },
  { value: "3-5", label: "Mid Level (3–5 years)" },
  { value: "5-8", label: "Senior (5–8 years)" },
  { value: "8+",  label: "Director / VP (8+ years)" },
];

function normalizeOptionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toEmployerForModal(employer: EmployerPayload | null | undefined, fallbackName: string): EmployerForModal {
  return {
    companyName: normalizeOptionalText(employer?.companyName) ?? fallbackName,
    industry: normalizeOptionalText(employer?.industry),
    companySize: normalizeOptionalText(employer?.companySize),
    description: normalizeOptionalText(employer?.description),
    tagline: normalizeOptionalText(employer?.tagline),
    foundedYear: normalizeOptionalText(employer?.foundedYear),
    website: normalizeOptionalText(employer?.website),
    address: normalizeOptionalText(employer?.address),
    city: normalizeOptionalText(employer?.city),
    state: normalizeOptionalText(employer?.state),
    country: normalizeOptionalText(employer?.country),
    otherUrl: normalizeOptionalText(employer?.otherUrl),
  };
}

function titleCaseCategory(value: string): string {
  const match = ALL_CATEGORIES.find((c) => c.value.toLowerCase() === value.toLowerCase());
  if (match) return match.label;
  return value.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
}

function titleCaseExperience(value: string): string {
  const match = ALL_EXPERIENCE_LEVELS.find((l) => l.value.toLowerCase() === value.toLowerCase());
  return match ? match.label : value;
}

const EMPTY_DISCOVERY_RESPONSE: DiscoveryResponse = {
  jobs: [],
  filters: { categories: [], workModes: [], experienceLevels: [], salaryRange: { min: 0, max: 250000 } },
  meta: { totalJobs: 0 },
};

//  Helpers

function convertAmount(value: number, sourceCurrency: string, targetCurrency: SupportedCurrency): number {
  const source = (sourceCurrency as SupportedCurrency) in CURRENCY_RATES
    ? (sourceCurrency as SupportedCurrency)
    : "USD";
  const usd = value / CURRENCY_RATES[source];
  return usd * CURRENCY_RATES[targetCurrency];
}

function formatSalary(value: number, sourceCurrency: string, targetCurrency: SupportedCurrency): string {
  return new Intl.NumberFormat("en", {
    style: "currency", currency: targetCurrency, notation: "compact", maximumFractionDigits: 1,
  }).format(convertAmount(value, sourceCurrency, targetCurrency));
}

function workModeMeta(workMode: string, location: string): { icon: string; label: string } {
  if (workMode === "Remote") return { icon: "wifi",       label: "Remote" };
  if (workMode === "Hybrid") return { icon: "home_work",  label: location ? `Hybrid · ${location}` : "Hybrid" };
  return                           { icon: "apartment",   label: location || "On-site" };
}

function salaryRangeLabel(min: number, max: number, sourceCurrency: string, targetCurrency: SupportedCurrency, undisclosed: boolean): string {
  if (undisclosed || (min === 0 && max === 0)) return "Competitive";
  if (min > 0 && max > 0) return `${formatSalary(min, sourceCurrency, targetCurrency)} – ${formatSalary(max, sourceCurrency, targetCurrency)}`;
  if (min > 0) return `From ${formatSalary(min, sourceCurrency, targetCurrency)}`;
  return `Up to ${formatSalary(max, sourceCurrency, targetCurrency)}`;
}

// Shared UI pieces

function DotToggle({ active }: { active: boolean }) {
  return (
    <span
      className="inline-flex h-[14px] w-[14px] shrink-0 rounded-full items-center justify-center transition-all duration-200"
      style={{
        background: active ? PRIMARY : "transparent",
        border: active ? "none" : `1px solid ${BORDER}`,
        boxShadow: active ? "0 0 0 4px var(--db-primary-10)" : "none",
      }}
    />
  );
}

function SearchField({ icon, placeholder, value, onChange }: {
  icon: string; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <label className="flex min-w-0 items-center gap-3">
      <span className="material-symbols-outlined shrink-0" style={{ fontSize: 22, color: PRIMARY }}>{icon}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[0.95rem] outline-none"
        style={{ color: TEXT_PRIMARY, ...POPPINS }}
      />
    </label>
  );
}

// Apply Modal

export function ApplyModal({
  job, selectedCurrency, onSubmit, onClose,
}: {
  job: DialogJob;
  selectedCurrency: SupportedCurrency;
  onSubmit: (notes: string) => Promise<void>;
  onClose: () => void;
}) {
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [visible, setVisible]         = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 200);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(coverLetter);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit application");
      setSubmitting(false);
    }
  }

  const salary = salaryRangeLabel(job.salaryMin, job.salaryMax, job.salaryCurrency || "USD", selectedCurrency, job.undisclosedSalary);

  return (
    <div
      className="fixed inset-0 z-[700] flex items-end sm:items-center justify-center p-0 sm:p-5"
      style={{
        background: visible ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0)",
        backdropFilter: visible ? "blur(8px)" : "blur(0px)",
        transition: "background 0.2s ease, backdrop-filter 0.2s ease",
      }}
      onClick={handleClose}
    >
      <div
        className="relative w-full sm:max-w-[520px] rounded-t-[28px] sm:rounded-[28px] overflow-hidden flex flex-col"
        style={{
          background: "var(--db-dialog-bg, #ffffff)",
          border: `1px solid ${BORDER}`,
          boxShadow: "0 40px 100px rgba(0,0,0,0.35)",
          transform: visible ? "translateY(0) scale(1)" : "translateY(40px) scale(0.97)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.22s cubic-bezier(0.34,1.36,0.64,1), opacity 0.18s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b flex items-start gap-3" style={{ borderColor: BORDER }}>
          <div
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl text-base font-bold"
            style={{ background: "linear-gradient(160deg,#f4f2ea 0%,#d8dfdb 100%)", color: "#2c3a4f", ...POPPINS }}
          >
            {job.companyLogoText}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[0.7rem] uppercase tracking-[0.2em] font-bold" style={{ color: PRIMARY, ...MONO }}>Apply Now</div>
            <h2 className="text-[1.15rem] font-bold leading-tight mt-0.5" style={{ color: TEXT_PRIMARY, ...POPPINS }}>{job.title}</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[0.78rem]" style={{ color: TEXT_SECONDARY }}>
              {job.experienceLevel && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>history</span>
                  {job.experienceLevel}
                </span>
              )}
              {salary !== "Competitive" && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>payments</span>
                  {salary}
                </span>
              )}
            </div>
          </div>
          <button onClick={handleClose} className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full border"
            style={{ borderColor: BORDER, color: TEXT_SECONDARY, background: "var(--db-bg)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          <div>
            <label className="block text-[0.68rem] uppercase tracking-[0.2em] font-bold mb-2" style={{ color: PRIMARY, ...MONO }}>
              Cover Letter <span style={{ color: TEXT_SECONDARY, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Tell the employer why you're a great fit for this role…"
              rows={5}
              className="w-full rounded-[12px] border px-4 py-3 text-[0.9rem] outline-none resize-none"
              style={{ background: "var(--db-bg)", borderColor: BORDER, color: TEXT_PRIMARY, ...POPPINS, lineHeight: 1.7 }}
            />
          </div>
          {error && (
            <p className="text-[0.78rem] flex items-center gap-1.5" style={{ color: "#f87171" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>error</span>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-end gap-3" style={{ borderColor: BORDER }}>
          <button onClick={handleClose} disabled={submitting}
            className="rounded-full px-6 py-2.5 text-[0.88rem] font-semibold border transition-all hover:scale-105 active:scale-95"
            style={{ borderColor: BORDER, color: TEXT_SECONDARY, background: "transparent" }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full px-8 py-2.5 text-[0.92rem] font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
            style={{ background: PRIMARY, color: "var(--db-primary-text)", boxShadow: "0 8px 20px var(--db-primary-20)" }}>
            {submitting ? (
              <><span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />Submitting…</>
            ) : (
              <>Submit Application<span className="material-symbols-outlined" style={{ fontSize: 17 }}>send</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Apply Success Toast ───────────────────────────────────────────────────────

export function ApplySuccessToast({ jobTitle, onDismiss }: { jobTitle: string; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true));
    const hide = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 350); }, 4000);
    return () => { cancelAnimationFrame(show); clearTimeout(hide); };
  }, [onDismiss]);

  return (
    <div
      className="fixed bottom-8 right-8 z-[700] flex items-center gap-3 rounded-[18px] border px-5 py-4 shadow-xl"
      style={{
        background: "var(--db-card)",
        borderColor: "rgba(16,185,129,0.4)",
        boxShadow: "0 20px 40px rgba(16,185,129,0.15)",
        transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.3s cubic-bezier(0.34,1.36,0.64,1), opacity 0.25s ease",
        maxWidth: 360,
      }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ background: "rgba(16,185,129,0.12)" }}>
        <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#10b981", fontVariationSettings: "'FILL' 1" }}>check_circle</span>
      </div>
      <div className="min-w-0">
        <div className="text-[0.8rem] font-bold" style={{ color: "#10b981", ...MONO }}>Applied Successfully!</div>
        <div className="text-[0.82rem] truncate mt-0.5" style={{ color: TEXT_SECONDARY, ...POPPINS }}>{jobTitle}</div>
      </div>
      <button onClick={onDismiss} className="shrink-0 ml-1" style={{ color: TEXT_SECONDARY }}>
        <span className="material-symbols-outlined" style={{ fontSize: 17 }}>close</span>
      </button>
    </div>
  );
}

// ─── Report Modal ─────────────────────────────────────────────────────────────

const REPORT_REASONS = [
  { value: "SPAM",          label: "Spam or scam" },
  { value: "MISLEADING",    label: "Misleading information" },
  { value: "INAPPROPRIATE", label: "Inappropriate content" },
  { value: "OTHER",         label: "Other" },
] as const;

export function ReportModal({ jobId, jobTitle, onClose }: { jobId: string; jobTitle: string; onClose: () => void }) {
  const [reason, setReason]       = useState<string>("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [visible, setVisible]     = useState(false);

  useEffect(() => { const id = requestAnimationFrame(() => setVisible(true)); return () => cancelAnimationFrame(id); }, []);
  useEffect(() => { const prev = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = prev; }; }, []);

  function handleClose() { setVisible(false); setTimeout(onClose, 200); }

  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); }; document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey); });

  async function handleSubmit() {
    if (!reason || submitting) return;
    setSubmitting(true); setError(null);
    try {
      await apiFetch(`/jobs/${jobId}/report`, { method: "POST", body: JSON.stringify({ reason, description: description.trim() || undefined }) });
      setDone(true);
      setTimeout(handleClose, 1800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit report");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[700] flex items-center justify-center p-4"
      style={{ background: visible ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0)", backdropFilter: visible ? "blur(6px)" : "none", transition: "background 0.2s ease, backdrop-filter 0.2s ease" }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-[440px] rounded-[24px] p-6"
        style={{
          background: "var(--db-card)", border: "1px solid var(--db-border)",
          boxShadow: "0 30px 60px rgba(0,0,0,0.22)",
          transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.22s cubic-bezier(0.34,1.36,0.64,1), opacity 0.18s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#f87171" }}>flag</span>
              <h3 className="text-[1rem] font-bold" style={{ color: "var(--db-text)", ...POPPINS }}>Report Job Posting</h3>
            </div>
            <p className="text-[0.78rem]" style={{ color: "var(--db-text-muted)" }}>{jobTitle}</p>
          </div>
          <button onClick={handleClose} className="rounded-full p-1 hover:bg-[var(--db-surface)]" style={{ color: "var(--db-text-muted)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <span className="material-symbols-outlined" style={{ fontSize: 44, color: "#10b981", fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <p className="text-[0.9rem] font-semibold" style={{ color: "var(--db-text)" }}>Report submitted. Thank you!</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-[0.72rem] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "var(--db-text-muted)", ...MONO }}>Reason</label>
              <div className="space-y-2">
                {REPORT_REASONS.map(r => (
                  <button key={r.value} type="button" onClick={() => setReason(r.value)}
                    className="w-full flex items-center gap-3 rounded-[12px] border px-4 py-2.5 text-[0.85rem] font-medium text-left transition-all"
                    style={{ background: reason === r.value ? "var(--db-primary-10)" : "var(--db-surface)", borderColor: reason === r.value ? PRIMARY : "var(--db-border)", color: reason === r.value ? PRIMARY : "var(--db-text)" }}>
                    <span className="h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center" style={{ borderColor: reason === r.value ? PRIMARY : "var(--db-border)" }}>
                      {reason === r.value && <span className="h-2 w-2 rounded-full block" style={{ background: PRIMARY }} />}
                    </span>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-[0.72rem] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "var(--db-text-muted)", ...MONO }}>Additional details <span className="normal-case font-normal">(optional)</span></label>
              <textarea
                value={description} onChange={e => setDescription(e.target.value)}
                rows={3} placeholder="Describe the issue…"
                className="w-full rounded-[12px] border px-4 py-3 text-[0.85rem] outline-none resize-none"
                style={{ background: "var(--db-surface)", borderColor: "var(--db-border)", color: "var(--db-text)" }}
              />
            </div>
            {error && <p className="text-[0.78rem] text-red-400 mb-3">{error}</p>}
            <div className="flex gap-3">
              <button onClick={handleClose} className="flex-1 rounded-full border py-2.5 text-[0.85rem] font-semibold transition-all hover:opacity-80" style={{ borderColor: "var(--db-border)", color: "var(--db-text-muted)" }}>Cancel</button>
              <button onClick={handleSubmit} disabled={!reason || submitting}
                className="flex-1 rounded-full py-2.5 text-[0.85rem] font-bold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "#ef4444", color: "#fff" }}>
                {submitting ? "Submitting…" : "Submit Report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Job List Card ────────────────────────────────────────────────────────────

function JobCard({
  job, selectedCurrency, isApplied, onRequestApply, onWithdraw, onReport, onToggleSave, onViewDetails, onViewCompany,
}: {
  job: DiscoveryJob;
  selectedCurrency: SupportedCurrency;
  isApplied: boolean;
  onRequestApply: () => void;
  onWithdraw: () => void;
  onReport: () => void;
  onToggleSave: () => void;
  onViewDetails: () => void;
  onViewCompany: () => void;
}) {
  const openOnKeyboard = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onViewDetails();
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onViewDetails}
      onKeyDown={openOnKeyboard}
      className="rounded-[20px] border px-5 py-5 md:px-6 md:py-6 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(145,170,200,0.20)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--db-primary)]"
      style={{ background: CARD, borderColor: BORDER, boxShadow: "0 18px 34px rgba(145,170,200,0.14)" }}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        {/* Left */}
        <div className="flex min-w-0 gap-4">
          <div
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(180deg,#f4f2ea 0%,#d8dfdb 100%)", color: "#2c3a4f", fontWeight: 700, fontSize: "1rem", ...POPPINS }}
          >
            {job.companyLogoText}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onViewCompany(); }}
                className="text-[0.98rem] font-bold transition-opacity hover:opacity-80 focus:outline-none"
                style={{ color: PRIMARY }}
                aria-label={`View ${job.companyName} profile`}
              >
                {job.companyName}
              </button>
              {job.verified && (
                <span className="material-symbols-outlined" style={{ fontSize: 17, color: PRIMARY }}>verified</span>
              )}
            </div>
            <h3 className="mt-1 text-[1.42rem] leading-tight md:text-[1.55rem]" style={{ color: TEXT_PRIMARY, fontWeight: 700, ...POPPINS }}>
              {job.title}
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.84rem]" style={{ color: TEXT_SECONDARY }}>
              {(() => {
                const meta = workModeMeta(job.workMode, job.location);
                return (
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{meta.icon}</span>
                    {meta.label}
                  </span>
                );
              })()}
              {job.jobType && (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>work</span>
                  {job.jobType}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>schedule</span>
                {job.postedAtLabel}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {job.tags.map((tag) => (
                <span key={tag} className="rounded-full px-2.5 py-1 text-[0.64rem] uppercase tracking-[0.16em]"
                  style={{ background: "var(--db-primary-10)", border: "1px solid var(--db-primary-20)", color: PRIMARY, fontWeight: 700, ...MONO }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="lg:min-w-[208px] lg:text-right">
          <div className="text-[1.4rem]" style={{ color: TEXT_PRIMARY, fontWeight: 700, ...POPPINS }}>
            {salaryRangeLabel(job.salaryMin, job.salaryMax, job.salaryCurrency || "USD", selectedCurrency, job.undisclosedSalary)}
          </div>
          <div className="mt-1 text-[0.68rem] uppercase tracking-[0.14em]"
            style={{ color: job.applicationWindowLabel.toLowerCase().includes("open") ? PRIMARY : AMBER, fontWeight: 700, ...MONO }}>
            {job.applicationWindowLabel.toUpperCase()}
          </div>

          <div className="mt-5 flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Bookmark */}
              <button
                onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all hover:scale-110 active:scale-95"
                style={{
                  background:  job.isSaved ? PRIMARY : CARD,
                  borderColor: job.isSaved ? PRIMARY : BORDER,
                  color:       job.isSaved ? "var(--db-primary-text)" : TEXT_SECONDARY,
                  boxShadow:   job.isSaved ? "0 4px 12px var(--db-primary-20)" : "none",
                }}
                aria-label={job.isSaved ? "Unsave job" : "Save job"}
              >
                <span className="material-symbols-outlined"
                  style={{ fontSize: 18, fontVariationSettings: job.isSaved ? "'FILL' 1" : "'FILL' 0" }}>
                  bookmark
                </span>
              </button>

              {/* Report flag */}
              <button
                onClick={(e) => { e.stopPropagation(); onReport(); }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all hover:scale-110 active:scale-95 shrink-0"
                style={{ background: "transparent", borderColor: "rgba(239,68,68,0.3)", color: "#f87171" }}
                aria-label="Report this job"
                title="Report this job"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>flag</span>
              </button>

              {/* Withdraw / Apply */}
              {isApplied ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onWithdraw(); }}
                  className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-[0.95rem] border transition-all hover:scale-105 active:scale-95"
                  style={{ background: "transparent", color: "#f87171", borderColor: "rgba(239,68,68,0.4)", fontWeight: 800 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>undo</span>
                  Withdraw
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onRequestApply(); }}
                  className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-[0.95rem] transition-all hover:scale-105 active:scale-95"
                  style={{ background: PRIMARY, color: "var(--db-primary-text)", border: "none", fontWeight: 800, boxShadow: "0 12px 24px var(--db-primary-20)" }}
                >
                  Apply Now<span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Job Grid Card ────────────────────────────────────────────────────────────

function JobGridCard({
  job, selectedCurrency, isApplied, onRequestApply, onWithdraw, onReport, onToggleSave, onViewDetails, onViewCompany,
}: {
  job: DiscoveryJob;
  selectedCurrency: SupportedCurrency;
  isApplied: boolean;
  onRequestApply: () => void;
  onWithdraw: () => void;
  onReport: () => void;
  onToggleSave: () => void;
  onViewDetails: () => void;
  onViewCompany: () => void;
}) {
  const openOnKeyboard = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onViewDetails();
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onViewDetails}
      onKeyDown={openOnKeyboard}
      className="flex flex-col rounded-[24px] border p-6 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(145,170,200,0.20)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--db-primary)]"
      style={{ background: CARD, borderColor: BORDER, boxShadow: "0 14px 28px rgba(145,170,200,0.12)" }}>
      <div className="flex items-start justify-between">
        <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-xl"
          style={{ background: "linear-gradient(180deg,#f4f2ea 0%,#d8dfdb 100%)", color: "#2c3a4f", fontWeight: 700, fontSize: "0.9rem", ...POPPINS }}>
          {job.companyLogoText}
        </div>
        <div className="rounded-full px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.12em]"
          style={{ background: job.applicationWindowLabel.toLowerCase().includes("open") ? "var(--db-primary-10)" : "rgba(244,177,26,0.08)", color: job.applicationWindowLabel.toLowerCase().includes("open") ? PRIMARY : AMBER, fontWeight: 700, ...MONO }}>
          {job.applicationWindowLabel}
        </div>
      </div>

      <div className="mt-5 grow">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onViewCompany(); }}
            className="text-[0.88rem] font-bold transition-opacity hover:opacity-80 focus:outline-none"
            style={{ color: PRIMARY }}
            aria-label={`View ${job.companyName} profile`}
          >
            {job.companyName}
          </button>
          {job.verified && <span className="material-symbols-outlined" style={{ fontSize: 16, color: PRIMARY }}>verified</span>}
        </div>
        <h3 className="mt-1 text-[1.25rem] leading-snug" style={{ color: TEXT_PRIMARY, fontWeight: 700, ...POPPINS }}>{job.title}</h3>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.78rem]" style={{ color: TEXT_SECONDARY }}>
          {(() => {
            const meta = workModeMeta(job.workMode, job.location);
            return (
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{meta.icon}</span>
                {meta.label}
              </span>
            );
          })()}
          {job.jobType && (
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>work</span>
              {job.jobType}
            </span>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {job.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.14em]"
              style={{ background: "var(--db-primary-10)", border: "1px solid var(--db-primary-20)", color: PRIMARY, fontWeight: 700, ...MONO }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 border-t pt-5" style={{ borderColor: BORDER }}>
        <div className="text-[1.15rem] mb-3" style={{ color: TEXT_PRIMARY, fontWeight: 700, ...POPPINS }}>
          {salaryRangeLabel(job.salaryMin, job.salaryMax, job.salaryCurrency || "USD", selectedCurrency, job.undisclosedSalary)}
        </div>
        <div className="flex items-center gap-2">
          {/* Bookmark */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all hover:scale-110 active:scale-95 shrink-0"
            style={{
              background:  job.isSaved ? PRIMARY : CARD,
              borderColor: job.isSaved ? PRIMARY : BORDER,
              color:       job.isSaved ? "var(--db-primary-text)" : TEXT_SECONDARY,
              boxShadow:   job.isSaved ? "0 4px 12px var(--db-primary-20)" : "none",
            }}
            aria-label={job.isSaved ? "Unsave job" : "Save job"}
          >
            <span className="material-symbols-outlined"
              style={{ fontSize: 16, fontVariationSettings: job.isSaved ? "'FILL' 1" : "'FILL' 0" }}>
              bookmark
            </span>
          </button>

          {/* Report flag */}
          <button
            onClick={(e) => { e.stopPropagation(); onReport(); }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all hover:scale-110 active:scale-95 shrink-0"
            style={{ background: "transparent", borderColor: "rgba(239,68,68,0.3)", color: "#f87171" }}
            aria-label="Report this job"
            title="Report this job"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>flag</span>
          </button>

          {/* Withdraw / Apply */}
          {isApplied ? (
            <button
              onClick={(e) => { e.stopPropagation(); onWithdraw(); }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[0.85rem] border transition-all hover:scale-105 active:scale-95"
              style={{ background: "transparent", color: "#f87171", borderColor: "rgba(239,68,68,0.4)", fontWeight: 800 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>undo</span>
              Withdraw
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onRequestApply(); }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[0.85rem] transition-all hover:scale-105 active:scale-95"
              style={{ background: PRIMARY, color: "var(--db-primary-text)", border: "none", fontWeight: 800, boxShadow: "0 8px 16px var(--db-primary-20)" }}
            >
              Apply<span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Filter Dropdown ─────────────────────────────────────────────────────────

function FilterDropdown({
  id, label, activeCount, openId, onToggle, children,
}: {
  id: string;
  label: string;
  activeCount: number;
  openId: string | null;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  const isOpen = openId === id;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onToggle(id); // closes by passing same id
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onToggle(id);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, id, onToggle]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={isOpen}
        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[0.82rem] font-semibold transition-all hover:border-[var(--db-primary)] hover:text-[var(--db-primary)] focus:outline-none"
        style={{
          background: isOpen || activeCount > 0 ? "var(--db-primary-10)" : "var(--db-card)",
          borderColor: isOpen || activeCount > 0 ? PRIMARY : BORDER,
          color: isOpen || activeCount > 0 ? PRIMARY : TEXT_SECONDARY,
          ...POPPINS,
        }}
      >
        {label}
        {activeCount > 0 && (
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.62rem] font-black"
            style={{ background: PRIMARY, color: "var(--db-primary-text)" }}
          >
            {activeCount}
          </span>
        )}
        <span
          className="material-symbols-outlined transition-transform duration-200"
          style={{ fontSize: 16, transform: isOpen ? "rotate(180deg)" : "none" }}
          aria-hidden="true"
        >
          expand_more
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-[calc(100%+8px)] z-[150] min-w-[220px] rounded-[16px] border shadow-xl"
          style={{
            background: "var(--db-card)",
            borderColor: BORDER,
            boxShadow: "0 16px 48px rgba(58,18,146,0.12), 0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function JobsMarketplaceRefined() {
  const [data, setData]             = useState<DiscoveryResponse>(EMPTY_DISCOVERY_RESPONSE);
  const [savedIds, setSavedIds]     = useState<Set<string>>(new Set());
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError]     = useState<string | null>(null);
  const [saveError, setSaveError]       = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<DiscoveryJob | null>(null);
  const [selectedEmployer, setSelectedEmployer] = useState<EmployerForModal | null>(null);
  const [employerError, setEmployerError] = useState<string | null>(null);

  const [query, setQuery]                       = useState("");
  const [location, setLocation]                 = useState("");
  const [categoryInput, setCategoryInput]       = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedWorkMode, setSelectedWorkMode] = useState<string>("");
  const [selectedExperience, setSelectedExperience] = useState<string>("");
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>("INR");
  const [salaryMinInput, setSalaryMinInput] = useState("");
  const [salaryMaxInput, setSalaryMaxInput] = useState("");
  const [applyTarget, setApplyTarget] = useState<DiscoveryJob | null>(null);
  const [applySuccess, setApplySuccess] = useState<{ jobTitle: string } | null>(null);
  const [reportTarget, setReportTarget] = useState<DiscoveryJob | null>(null);
  const [page, setPage]       = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const toggleFilter = useCallback((id: string) => {
    setOpenFilter(prev => prev === id ? null : id);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("grc_preferred_currency") as SupportedCurrency | null;
    if (stored && stored in CURRENCY_RATES) setSelectedCurrency(stored);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "grc_preferred_currency" && e.newValue && e.newValue in CURRENCY_RATES)
        setSelectedCurrency(e.newValue as SupportedCurrency);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    let mounted = true;
    apiFetch<DiscoveryResponse>("/jobs/discover")
      .then((res) => {
        if (!mounted) return;
        setData(res);
        setSavedIds(new Set(res.jobs.filter(j => j.isSaved).map(j => j.id)));
        setAppliedIds(new Set(res.jobs.filter(j => j.isApplied).map(j => j.id)));
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        setFetchError(e instanceof Error ? e.message : "Failed to load jobs");
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!saveError) return;
    const id = setTimeout(() => setSaveError(null), 5000);
    return () => clearTimeout(id);
  }, [saveError]);

  const makeWithdraw = useCallback((jobId: string) => async () => {
    try {
      await apiFetch(`/jobs/${jobId}/withdraw`, { method: "PATCH" });
      setAppliedIds(prev => { const next = new Set(prev); next.delete(jobId); return next; });
    } catch (e: unknown) {
      setWithdrawError(e instanceof Error ? e.message : "Failed to withdraw application");
    }
  }, []);

  const makeApply = useCallback((jobId: string) => async (notes: string) => {
    await apiFetch(`/jobs/${jobId}/apply`, { method: "POST", body: JSON.stringify({ notes }) });
    setAppliedIds(prev => new Set(prev).add(jobId));
  }, []);

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

  const openEmployerProfile = useCallback(async (job: Pick<DiscoveryJob, "id" | "companyName">) => {
    setEmployerError(null);
    try {
      const response = await apiFetch<JobDetailWithEmployerResponse>(`/jobs/${job.id}`);
      setSelectedEmployer(toEmployerForModal(response.job?.employer, job.companyName));
    } catch (e: unknown) {
      setEmployerError(e instanceof Error ? e.message : "Failed to load employer details");
    }
  }, []);

  const derivedCategories = useMemo(() => ALL_CATEGORIES.map((c) => c.value), []);
  const derivedExperienceLevels = useMemo(() => ALL_EXPERIENCE_LEVELS.map((l) => l.value), []);
  const derivedWorkModes = useMemo(() => [...ALL_WORK_MODES], []);

  const filteredJobs = useMemo(() => {
    const minVal = salaryMinInput !== "" ? Number(salaryMinInput) : null;
    const maxVal = salaryMaxInput !== "" ? Number(salaryMaxInput) : null;

    return data.jobs.filter((job) => {
      const q        = query.trim().toLowerCase();
      const loc      = location.trim().toLowerCase();
      const catInput = categoryInput.trim().toLowerCase();

      const jobMinInCurrency = job.salaryMin > 0 ? convertAmount(job.salaryMin, job.salaryCurrency || "USD", selectedCurrency) : 0;
      const jobMaxInCurrency = job.salaryMax > 0 ? convertAmount(job.salaryMax, job.salaryCurrency || "USD", selectedCurrency) : 0;

      const salaryOk =
        (minVal === null || job.undisclosedSalary || jobMaxInCurrency >= minVal) &&
        (maxVal === null || job.undisclosedSalary || jobMinInCurrency <= maxVal);

      return (
        (!q || job.title.toLowerCase().includes(q) || job.companyName.toLowerCase().includes(q) || job.tags.some(t => t.toLowerCase().includes(q))) &&
        (!loc || job.location.toLowerCase().includes(loc)) &&
        (!catInput || job.category.toLowerCase().includes(catInput)) &&
        (!selectedCategory || job.category === selectedCategory) &&
        (!selectedWorkMode || job.workMode === selectedWorkMode) &&
        (!selectedExperience || job.experienceLevel === selectedExperience) &&
        salaryOk
      );
    });
  }, [categoryInput, data.jobs, location, query, salaryMinInput, salaryMaxInput, selectedCurrency, selectedCategory, selectedExperience, selectedWorkMode]);

  const pageCount    = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const currentPage  = Math.min(page, pageCount);
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [query, location, categoryInput, selectedCategory, selectedWorkMode, selectedExperience, salaryMinInput, salaryMaxInput, selectedCurrency]);

  function clearFilters() {
    setQuery(""); setLocation(""); setCategoryInput(""); setSelectedCategory("");
    setSelectedWorkMode(""); setSelectedExperience(""); setSelectedCurrency("INR");
    setSalaryMinInput(""); setSalaryMaxInput("");
  }

  const pageButtons = pageCount <= 5
    ? Array.from({ length: pageCount }, (_, i) => String(i + 1))
    : ["1", "2", "3", "...", String(pageCount)];

  return (
    <section className="space-y-10" style={POPPINS}>
      {/* ── Dialogs / Toasts ── */}
      {selectedJob && (
        <JobDetailDialog
          job={{ ...selectedJob, isSaved: savedIds.has(selectedJob.id) }}
          selectedCurrency={selectedCurrency}
          isApplied={appliedIds.has(selectedJob.id)}
          onClose={() => setSelectedJob(null)}
          onRequestApply={() => { setSelectedJob(null); setApplyTarget(selectedJob); }}
          onWithdraw={makeWithdraw(selectedJob.id)}
          onReport={() => { setSelectedJob(null); setReportTarget(selectedJob); }}
          onToggleSave={makeToggleSave(selectedJob.id)}
        />
      )}
      {selectedEmployer && (
        <EmployerProfileModal employer={selectedEmployer} onClose={() => setSelectedEmployer(null)} />
      )}
      {applyTarget && (
        <ApplyModal
          job={applyTarget}
          selectedCurrency={selectedCurrency}
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
        <ReportModal
          jobId={reportTarget.id}
          jobTitle={reportTarget.title}
          onClose={() => setReportTarget(null)}
        />
      )}
      {employerError && (
        <div className="rounded-[20px] border px-6 py-5 flex items-center justify-between gap-4"
          style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.25)" }}>
          <div className="flex items-center gap-3 min-w-0">
            <span className="material-symbols-outlined shrink-0" style={{ fontSize: 20, color: "#f87171" }}>error</span>
            <span className="truncate" style={{ fontSize: "0.9rem", color: "#f87171" }}>Could not load employer details - {employerError}</span>
          </div>
          <button type="button" onClick={() => setEmployerError(null)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
            style={{ borderColor: "rgba(239,68,68,0.35)", color: "#f87171", background: "transparent" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-[34px] border"
        style={{ background: SURFACE, borderColor: BORDER, boxShadow: "0 22px 48px rgba(170,190,214,0.18)" }}>

        {/* ── Search bar ── */}
        <div className="border-b px-6 py-4 md:px-8 md:py-5" style={{ borderColor: BORDER }}>
          <div className="grid grid-cols-1 items-center gap-6 xl:grid-cols-[minmax(0,1fr)_220px]">
            <div className="grid grid-cols-1 items-center gap-6 rounded-[24px] border px-5 py-3 md:grid-cols-[1fr_auto]"
              style={{ background: "linear-gradient(180deg,#ffffff 0%,#f8fbff 100%)", borderColor: BORDER }}>
              <div className="grid min-w-0 grid-cols-1 items-center gap-4 md:grid-cols-[1fr_1px_0.9fr]">
                <SearchField icon="search"      placeholder="Job Title, Keywords..." value={query}    onChange={setQuery} />
                <div className="hidden h-10 md:block" style={{ width: 1, background: BORDER }} />
                <SearchField icon="location_on" placeholder="Location"               value={location} onChange={setLocation} />
              </div>
              <button type="button" aria-label="Search"
                className="inline-flex h-[50px] w-[50px] items-center justify-center justify-self-center rounded-full transition-transform hover:scale-110 active:scale-95 md:h-[54px] md:w-[54px] md:justify-self-end db-btn-primary"
                style={{ background: PRIMARY, color: "var(--db-primary-text)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28 }}>arrow_forward</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-5 xl:justify-end">
              <div className="text-right">
                <div className="text-[0.74rem] uppercase tracking-[0.28em]" style={{ color: PRIMARY, fontWeight: 700, ...MONO }}>Results</div>
                <div className="text-[1.03rem] font-semibold" style={{ color: TEXT_PRIMARY }}>
                  {filteredJobs.length.toLocaleString()} GRC jobs
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-full border p-1" style={{ background: CARD, borderColor: BORDER }}>
                {(["list", "grid"] as const).map((mode) => (
                  <button key={mode} type="button" onClick={() => setViewMode(mode)}
                    className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-all"
                    style={{ background: viewMode === mode ? "var(--db-primary-10)" : "transparent", color: viewMode === mode ? PRIMARY : TEXT_SECONDARY }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                      {mode === "list" ? "view_agenda" : "grid_view"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Filter bar ── */}
        {(() => {
          const activeFilters =
            (selectedCategory ? 1 : 0) +
            (selectedWorkMode ? 1 : 0) +
            (selectedExperience ? 1 : 0) +
            (salaryMinInput || salaryMaxInput ? 1 : 0);

          return (
            <div
              className="border-b px-6 py-3 md:px-8"
              style={{ borderColor: BORDER }}
            >
              <div className="flex flex-wrap items-center gap-2">

                {/* Category */}
                <FilterDropdown
                  id="category" label="Category"
                  activeCount={selectedCategory ? 1 : 0}
                  openId={openFilter} onToggle={toggleFilter}
                >
                  <div className="px-2 py-2">
                    <p className="px-3 pb-2 pt-1 text-[0.68rem] font-bold uppercase tracking-[0.2em]" style={{ color: PRIMARY, ...MONO }}>Category</p>
                    {derivedCategories.map((cat) => (
                      <button key={cat} type="button"
                        onClick={() => { setSelectedCategory(c => c === cat ? "" : cat); toggleFilter("category"); }}
                        className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[0.88rem] transition-colors hover:bg-[var(--db-primary-10)]"
                        style={{ color: selectedCategory === cat ? PRIMARY : TEXT_PRIMARY, fontWeight: selectedCategory === cat ? 700 : 400 }}
                      >
                        <DotToggle active={selectedCategory === cat} />
                        {titleCaseCategory(cat)}
                      </button>
                    ))}
                  </div>
                </FilterDropdown>

                {/* Work Mode */}
                <FilterDropdown
                  id="workmode" label="Work Mode"
                  activeCount={selectedWorkMode ? 1 : 0}
                  openId={openFilter} onToggle={toggleFilter}
                >
                  <div className="px-2 py-2">
                    <p className="px-3 pb-2 pt-1 text-[0.68rem] font-bold uppercase tracking-[0.2em]" style={{ color: PRIMARY, ...MONO }}>Work Mode</p>
                    <div className="flex flex-wrap gap-2 px-3 pb-3 pt-1">
                      {derivedWorkModes.map((mode) => {
                        const active = selectedWorkMode === mode;
                        return (
                          <button key={mode} type="button"
                            onClick={() => { setSelectedWorkMode(c => c === mode ? "" : mode); toggleFilter("workmode"); }}
                            className="rounded-full px-4 py-2 text-[0.8rem] font-semibold transition-all"
                            style={{ background: active ? PRIMARY : "var(--db-bg)", color: active ? "var(--db-primary-text)" : TEXT_PRIMARY, border: active ? "none" : `1px solid ${BORDER}` }}
                          >
                            {mode}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </FilterDropdown>

                {/* Expected Salary */}
                <FilterDropdown
                  id="salary" label="Expected Salary"
                  activeCount={salaryMinInput || salaryMaxInput ? 1 : 0}
                  openId={openFilter} onToggle={toggleFilter}
                >
                  <div className="px-4 py-3 w-[240px]">
                    <p className="pb-2 pt-1 text-[0.68rem] font-bold uppercase tracking-[0.2em]" style={{ color: PRIMARY, ...MONO }}>Expected Salary</p>
                    <div className="mb-3">
                      <p className="mb-1 text-[0.65rem] uppercase tracking-[0.16em] font-bold" style={{ color: "var(--db-text-muted)", ...MONO }}>Currency</p>
                      <select
                        value={selectedCurrency}
                        onChange={(e) => setSelectedCurrency(e.target.value as SupportedCurrency)}
                        className="w-full rounded-[10px] border px-3 py-2 text-[0.82rem] font-bold outline-none"
                        style={{ background: "var(--db-bg)", borderColor: BORDER, color: TEXT_PRIMARY, ...MONO }}
                      >
                        {(Object.keys(CURRENCY_RATES) as SupportedCurrency[]).map((curr) => (
                          <option key={curr} value={curr}>{curr}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="mb-1 text-[0.65rem] uppercase tracking-[0.16em] font-bold" style={{ color: "var(--db-text-muted)", ...MONO }}>Min</p>
                        <input type="number" min={0} placeholder="0"
                          value={salaryMinInput} onChange={(e) => setSalaryMinInput(e.target.value)}
                          className="w-full rounded-[10px] border px-3 py-2 text-[0.82rem] outline-none"
                          style={{ background: "var(--db-bg)", borderColor: BORDER, color: TEXT_PRIMARY, ...MONO }}
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-[0.65rem] uppercase tracking-[0.16em] font-bold" style={{ color: "var(--db-text-muted)", ...MONO }}>Max</p>
                        <input type="number" min={0} placeholder="Any"
                          value={salaryMaxInput} onChange={(e) => setSalaryMaxInput(e.target.value)}
                          className="w-full rounded-[10px] border px-3 py-2 text-[0.82rem] outline-none"
                          style={{ background: "var(--db-bg)", borderColor: BORDER, color: TEXT_PRIMARY, ...MONO }}
                        />
                      </div>
                    </div>
                    <button type="button" onClick={() => toggleFilter("salary")}
                      className="mt-3 w-full rounded-full py-2 text-[0.8rem] font-bold transition-all hover:opacity-90"
                      style={{ background: PRIMARY, color: "var(--db-primary-text)" }}>
                      Apply
                    </button>
                  </div>
                </FilterDropdown>

                {/* Experience Level */}
                <FilterDropdown
                  id="experience" label="Experience Level"
                  activeCount={selectedExperience ? 1 : 0}
                  openId={openFilter} onToggle={toggleFilter}
                >
                  <div className="px-2 py-2">
                    <p className="px-3 pb-2 pt-1 text-[0.68rem] font-bold uppercase tracking-[0.2em]" style={{ color: PRIMARY, ...MONO }}>Experience Level</p>
                    {derivedExperienceLevels.map((level) => (
                      <button key={level} type="button"
                        onClick={() => { setSelectedExperience(c => c === level ? "" : level); toggleFilter("experience"); }}
                        className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[0.88rem] transition-colors hover:bg-[var(--db-primary-10)]"
                        style={{ color: selectedExperience === level ? PRIMARY : TEXT_PRIMARY, fontWeight: selectedExperience === level ? 700 : 400 }}
                      >
                        <DotToggle active={selectedExperience === level} />
                        {titleCaseExperience(level)}
                      </button>
                    ))}
                  </div>
                </FilterDropdown>

                {/* Divider + Clear */}
                {activeFilters > 0 && (
                  <>
                    <div className="h-6 w-px mx-1" style={{ background: BORDER }} />
                    <button type="button" onClick={clearFilters}
                      className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[0.82rem] font-semibold transition-all hover:opacity-80"
                      style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                      Clear filters
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.62rem] font-black"
                        style={{ background: "#ef4444", color: "#fff" }}>
                        {activeFilters}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── Jobs ── */}
        <div className="px-6 py-8 md:px-8 md:py-9">
          <div className="space-y-6">
            {saveError && (
              <div className="rounded-[20px] border px-6 py-5 flex items-center justify-between gap-4"
                style={{ background: "rgba(245,158,11,0.10)", borderColor: "rgba(245,158,11,0.35)" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="material-symbols-outlined shrink-0" style={{ fontSize: 20, color: AMBER }}>warning</span>
                  <span className="truncate" style={{ fontSize: "0.9rem", color: TEXT_SECONDARY }}>Could not update saved jobs — {saveError}</span>
                </div>
                <button type="button" onClick={() => setSaveError(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
                  style={{ borderColor: "rgba(245,158,11,0.35)", color: AMBER, background: "transparent" }} aria-label="Dismiss">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                </button>
              </div>
            )}
            {withdrawError && (
              <div className="rounded-[20px] border px-6 py-5 flex items-center justify-between gap-4"
                style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.25)" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="material-symbols-outlined shrink-0" style={{ fontSize: 20, color: "#f87171" }}>error</span>
                  <span className="truncate" style={{ fontSize: "0.9rem", color: "#f87171" }}>Could not withdraw application — {withdrawError}</span>
                </div>
                <button type="button" onClick={() => setWithdrawError(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
                  style={{ borderColor: "rgba(239,68,68,0.35)", color: "#f87171", background: "transparent" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                </button>
              </div>
            )}
            {fetchError && (
              <div className="rounded-[20px] border px-6 py-5 flex items-center gap-3"
                style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.25)", color: "#f87171" }}>
                <span className="material-symbols-outlined shrink-0" style={{ fontSize: 20 }}>error</span>
                <span style={{ fontSize: "0.9rem" }}>Could not load jobs — {fetchError}. Please refresh.</span>
              </div>
            )}

            {loading ? (
              <div className="rounded-[20px] border px-8 py-8" style={{ background: CARD, borderColor: BORDER, color: TEXT_SECONDARY }}>
                Loading jobs…
              </div>
            ) : paginatedJobs.length > 0 ? (
              viewMode === "list" ? (
                <div className="space-y-6">
                  {paginatedJobs.map((job) => (
                    <JobCard key={job.id}
                      job={{ ...job, isSaved: savedIds.has(job.id) }}
                      selectedCurrency={selectedCurrency}
                      isApplied={appliedIds.has(job.id)}
                      onRequestApply={() => setApplyTarget(job)}
                      onWithdraw={makeWithdraw(job.id)}
                      onReport={() => setReportTarget(job)}
                      onToggleSave={makeToggleSave(job.id)}
                      onViewDetails={() => setSelectedJob(job)}
                      onViewCompany={() => openEmployerProfile(job)}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {paginatedJobs.map((job) => (
                    <JobGridCard key={job.id}
                      job={{ ...job, isSaved: savedIds.has(job.id) }}
                      selectedCurrency={selectedCurrency}
                      isApplied={appliedIds.has(job.id)}
                      onRequestApply={() => setApplyTarget(job)}
                      onWithdraw={makeWithdraw(job.id)}
                      onReport={() => setReportTarget(job)}
                      onToggleSave={makeToggleSave(job.id)}
                      onViewDetails={() => setSelectedJob(job)}
                      onViewCompany={() => openEmployerProfile(job)}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center rounded-[24px] border px-8 py-12 text-center"
                style={{ background: "var(--db-primary-10)", borderColor: "var(--db-primary-20)", color: PRIMARY }}>
                <span className="material-symbols-outlined mb-3" style={{ fontSize: 48, opacity: 0.8 }}>search_off</span>
                <div style={{ fontWeight: 700, fontSize: "1.1rem", ...POPPINS }}>No matching jobs found</div>
                <p className="mt-2 text-[0.92rem]" style={{ color: TEXT_SECONDARY, maxWidth: "300px" }}>
                  Try adjusting your filters or search keywords.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pagination */}
      {filteredJobs.length > 0 && (
        <div className="flex items-center justify-center gap-4">
          <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border disabled:opacity-40"
            style={{ background: CARD, borderColor: BORDER, color: PRIMARY }}>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="flex items-center gap-2 rounded-full border px-3 py-2" style={{ background: "var(--db-surface)", borderColor: BORDER }}>
            {pageButtons.map((v, i) => {
              const isCurrent   = v === String(currentPage);
              const isEllipsis  = v === "...";
              return (
                <button key={`${v}-${i}`} type="button" disabled={isEllipsis}
                  onClick={() => { if (!isEllipsis) setPage(Number(v)); }}
                  className="h-10 w-10 rounded-full text-[0.95rem]"
                  style={{ background: isCurrent ? PRIMARY : "transparent", color: isCurrent ? "var(--db-primary-text)" : TEXT_SECONDARY, fontWeight: isCurrent ? 800 : 700 }}>
                  {v}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={currentPage === pageCount}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border disabled:opacity-40"
            style={{ background: CARD, borderColor: BORDER, color: PRIMARY }}>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="flex flex-col gap-5 rounded-[26px] border px-6 py-6 lg:flex-row lg:items-center lg:justify-between"
        style={{ background: CARD, borderColor: BORDER }}>
        <div className="flex items-center gap-5">
          <div>
            <div className="text-[1.1rem]" style={{ color: TEXT_PRIMARY, fontWeight: 700, ...POPPINS }}>
              GRC <span style={{ color: PRIMARY }}>Openings</span>
            </div>
            <p className="mt-1 max-w-[620px] text-[0.96rem]" style={{ color: TEXT_SECONDARY }}>
              The leading niche job board for governance, risk, and compliance professionals worldwide.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-5" style={{ color: PRIMARY }}>
          <span className="material-symbols-outlined">language</span>
          <span className="material-symbols-outlined">mail</span>
          <span className="material-symbols-outlined">hub</span>
        </div>
      </footer>
    </section>
  );
}

