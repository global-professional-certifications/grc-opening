import React, { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DialogJob = {
  id: string;
  companyName: string;
  companyLogoText: string;
  title: string;
  category: string;
  location: string;
  workMode: string;
  jobType: string;
  seniority: string;
  experienceLevel: string;
  postedAtLabel: string;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  undisclosedSalary: boolean;
  applicationWindowLabel: string;
  tags: string[];
  verified: boolean;
  description: string;
  niceToHave: string;
  isSaved: boolean;
  applicationId?: string | null;
};

export type SupportedCurrency =
  | "USD" | "EUR" | "GBP" | "INR" | "CAD" | "AUD"
  | "NZD" | "SGD" | "AED" | "SAR" | "QAR" | "KWD"
  | "JPY" | "CNY" | "KRW" | "RUB" | "BRL" | "MXN"
  | "ZAR" | "NGN" | "EGP" | "TRY" | "CHF" | "SEK"
  | "NOK" | "DKK" | "PLN" | "UAH" | "IDR" | "THB"
  | "MYR" | "PHP" | "VND" | "PKR" | "BDT" | "LKR"
  | "NPR" | "ARS" | "CLP" | "COP" | "PEN";

// ─── Constants ────────────────────────────────────────────────────────────────

const POPPINS = { fontFamily: "'Poppins', sans-serif" };
const MONO    = { fontFamily: "'JetBrains Mono', monospace" };
const PRIMARY = "var(--db-primary)";
const BORDER  = "var(--db-border)";
const TEXT_PRIMARY   = "var(--db-text)";
const TEXT_SECONDARY = "var(--db-text-secondary)";

const CURRENCY_RATES: Record<SupportedCurrency, number> = {
  USD: 1,      EUR: 0.92,   GBP: 0.79,   INR: 83.1,   CAD: 1.36,   AUD: 1.52,
  NZD: 1.63,   SGD: 1.34,   AED: 3.67,   SAR: 3.75,   QAR: 3.64,   KWD: 0.31,
  JPY: 149.5,  CNY: 7.24,   KRW: 1330,   RUB: 90.5,   BRL: 5.0,    MXN: 17.2,
  ZAR: 18.7,   NGN: 1550,   EGP: 48.5,   TRY: 32.5,   CHF: 0.89,   SEK: 10.5,
  NOK: 10.6,   DKK: 6.88,   PLN: 4.0,    UAH: 39.5,   IDR: 15700,  THB: 35.5,
  MYR: 4.7,    PHP: 56.5,   VND: 24800,  PKR: 278,     BDT: 110,    LKR: 325,
  NPR: 133,    ARS: 900,    CLP: 950,    COP: 4000,   PEN: 3.75,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function convertAmount(value: number, sourceCurrency: string, targetCurrency: SupportedCurrency): number {
  const source = (sourceCurrency as SupportedCurrency) in CURRENCY_RATES
    ? (sourceCurrency as SupportedCurrency)
    : "USD";
  const usd = value / CURRENCY_RATES[source];
  return usd * CURRENCY_RATES[targetCurrency];
}

function fmt(value: number, sourceCurrency: string, targetCurrency: SupportedCurrency): string {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: targetCurrency,
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(convertAmount(value, sourceCurrency, targetCurrency));
}

function salaryLabel(min: number, max: number, sourceCurrency: string, targetCurrency: SupportedCurrency, undisclosed: boolean): string {
  if (undisclosed || (min === 0 && max === 0)) return "Competitive";
  if (min > 0 && max > 0) return `${fmt(min, sourceCurrency, targetCurrency)} – ${fmt(max, sourceCurrency, targetCurrency)}`;
  if (min > 0) return `From ${fmt(min, sourceCurrency, targetCurrency)}`;
  return `Up to ${fmt(max, sourceCurrency, targetCurrency)}`;
}

function workModeIcon(wm: string): string {
  if (wm === "Remote") return "wifi";
  if (wm === "Hybrid") return "home_work";
  return "apartment";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <h4
      className="text-[0.7rem] uppercase tracking-[0.26em] font-bold mb-3"
      style={{ color: PRIMARY, ...MONO }}
    >
      {text}
    </h4>
  );
}

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeRichHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?(iframe|object|embed|link|meta|base)[^>]*>/gi, "")
    .replace(/\son\w+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, " $1=\"#\"");
}

function toContentHtml(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (HTML_TAG_PATTERN.test(trimmed)) return sanitizeRichHtml(trimmed);
  return escapeHtml(trimmed).replace(/\n/g, "<br />");
}

function ContentBlock({ text }: { text: string }) {
  if (text.trim()) {
    const html = toContentHtml(text);
    return (
      <div
        className="text-[0.92rem] leading-[1.78] [&_p]:mb-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1"
        style={{ color: TEXT_SECONDARY }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return (
    <p className="text-[0.85rem] italic" style={{ color: "var(--db-text-muted)" }}>
      Not specified
    </p>
  );
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────

export function JobDetailDialog({
  job,
  selectedCurrency,
  isApplied,
  onClose,
  onRequestApply,
  onWithdraw,
  onReport,
  onToggleSave,
}: {
  job: DialogJob;
  selectedCurrency: SupportedCurrency;
  isApplied: boolean;
  onClose: () => void;
  onRequestApply: () => void;
  onWithdraw?: () => void;
  onReport?: () => void;
  onToggleSave: () => void;
}) {
  const [visible, setVisible]       = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Animate in on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 220);
  }

  // ESC key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const salary    = salaryLabel(job.salaryMin, job.salaryMax, job.salaryCurrency || "USD", selectedCurrency, job.undisclosedSalary);
  const isSaved   = job.isSaved;

  const detailRows = [
    job.category       && { icon: "category",  label: "Category",    value: job.category },
    job.jobType        && { icon: "work",       label: "Type",        value: job.jobType },
    job.seniority      && { icon: "bar_chart",  label: "Seniority",   value: job.seniority },
    job.experienceLevel && { icon: "history",   label: "Experience",  value: job.experienceLevel },
    { icon: workModeIcon(job.workMode), label: "Work Mode", value: job.workMode || "—" },
    job.workMode !== "Remote" && job.location && { icon: "location_on", label: "Location", value: job.location },
  ].filter(Boolean) as { icon: string; label: string; value: string }[];

  return (
    <div
      className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center p-0 sm:p-5"
      style={{
        background: visible ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0)",
        backdropFilter: visible ? "blur(8px)" : "blur(0px)",
        transition: "background 0.22s ease, backdrop-filter 0.22s ease",
      }}
      onClick={handleClose}
    >
      <div
        className="relative flex flex-col w-full sm:max-w-[880px] rounded-t-[28px] sm:rounded-[28px] overflow-hidden"
        style={{
          background: "var(--db-dialog-bg, #ffffff)",
          border: `1px solid ${BORDER}`,
          boxShadow: "0 40px 100px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)",
          maxHeight: "92vh",
          transform: visible ? "translateY(0) scale(1)" : "translateY(44px) scale(0.96)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.22s cubic-bezier(0.34,1.36,0.64,1), opacity 0.18s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className="shrink-0 px-6 py-5 sm:px-8 sm:py-6 border-b"
          style={{ borderColor: BORDER }}
        >
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div
              className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-2xl text-xl font-bold"
              style={{
                background: "linear-gradient(160deg,#f4f2ea 0%,#d8dfdb 100%)",
                color: "#2c3a4f",
                ...POPPINS,
              }}
            >
              {job.companyLogoText}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[0.88rem] font-bold" style={{ color: PRIMARY }}>
                  {job.companyName}
                </span>
                {job.verified && (
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: PRIMARY }}>
                    verified
                  </span>
                )}
                <span
                  className="rounded-full px-2.5 py-0.5 text-[0.6rem] uppercase tracking-wider font-bold"
                  style={{ background: "var(--db-primary-10)", color: PRIMARY, ...MONO }}
                >
                  {job.postedAtLabel}
                </span>
              </div>

              <h2
                className="mt-1.5 text-xl sm:text-[1.55rem] font-bold leading-tight"
                style={{ color: TEXT_PRIMARY, ...POPPINS }}
              >
                {job.title}
              </h2>

              <div
                className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[0.8rem]"
                style={{ color: TEXT_SECONDARY }}
              >
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    {workModeIcon(job.workMode)}
                  </span>
                  {job.workMode === "Remote"
                    ? "Remote"
                    : job.workMode === "Hybrid"
                    ? (job.location ? `Hybrid · ${job.location}` : "Hybrid")
                    : (job.location || "On-site")}
                </span>
                {job.jobType && (
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>work</span>
                    {job.jobType}
                  </span>
                )}
                {job.seniority && (
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>bar_chart</span>
                    {job.seniority}
                  </span>
                )}
              </div>
            </div>

            {/* Close */}
            <button
              onClick={handleClose}
              className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full border transition-all hover:scale-110 active:scale-95"
              style={{
                background: "var(--db-bg)",
                borderColor: BORDER,
                color: TEXT_SECONDARY,
              }}
              aria-label="Close dialog"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
            </button>
          </div>

          {/* Tags */}
          {job.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {job.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.14em] font-bold"
                  style={{
                    background: "var(--db-primary-10)",
                    border: "1px solid var(--db-primary-20)",
                    color: PRIMARY,
                    ...MONO,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Scrollable Body ─────────────────────────────────────────────── */}
        {/* flex row: left scrolls, right is pinned at its natural height */}
        <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>

          {/* Left — independently scrollable JD content */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain px-6 py-7 sm:px-8 space-y-8 border-r"
            style={{ borderColor: BORDER }}
          >
            <div>
              <SectionLabel text="About the Role" />
              <ContentBlock text={job.description} />
            </div>

            <div>
              <SectionLabel text="Nice to Have" />
              <ContentBlock text={job.niceToHave} />
            </div>
          </div>

          {/* Right — fixed-width sidebar, does not scroll with left */}
          <div
            className="w-[230px] shrink-0 px-5 py-7 space-y-7 overflow-y-auto"
            style={{ background: "var(--db-bg)" }}
          >
            {/* Salary */}
            <div>
              <p
                className="text-[0.65rem] uppercase tracking-[0.24em] font-bold mb-2"
                style={{ color: "var(--db-text-muted)", ...MONO }}
              >
                Salary
              </p>
              <p className="text-[1.45rem] font-bold leading-tight" style={{ color: TEXT_PRIMARY, ...POPPINS }}>
                {salary}
              </p>
              {!job.undisclosedSalary && salary !== "Competitive" && (
                <p className="text-[0.72rem] mt-0.5" style={{ color: "var(--db-text-muted)" }}>
                  {selectedCurrency} · per year
                </p>
              )}
            </div>

            {/* Details */}
            {detailRows.length > 0 && (
              <div>
                <p
                  className="text-[0.65rem] uppercase tracking-[0.24em] font-bold mb-4"
                  style={{ color: "var(--db-text-muted)", ...MONO }}
                >
                  Details
                </p>
                <dl className="space-y-4">
                  {detailRows.map((row) => (
                    <div key={row.label} className="flex items-start gap-3">
                      <span
                        className="material-symbols-outlined mt-0.5 shrink-0"
                        style={{ fontSize: 15, color: PRIMARY }}
                      >
                        {row.icon}
                      </span>
                      <div>
                        <dt
                          className="text-[0.62rem] uppercase tracking-wider font-bold"
                          style={{ color: "var(--db-text-muted)", ...MONO }}
                        >
                          {row.label}
                        </dt>
                        <dd
                          className="text-[0.88rem] font-semibold mt-0.5"
                          style={{ color: TEXT_PRIMARY }}
                        >
                          {row.value}
                        </dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Application window */}
            <div
              className="rounded-xl px-4 py-3.5"
              style={{
                background: "var(--db-primary-10)",
                border: "1px solid var(--db-primary-20)",
              }}
            >
              <p
                className="text-[0.62rem] uppercase tracking-wider font-bold mb-1"
                style={{ color: PRIMARY, ...MONO }}
              >
                Application Window
              </p>
              <p className="text-[0.85rem] font-semibold" style={{ color: PRIMARY }}>
                {job.applicationWindowLabel}
              </p>
            </div>
          </div>
        </div>

        {/* ── Footer CTA ──────────────────────────────────────────────────── */}
        <div
          className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-4 sm:px-8 border-t"
          style={{ borderColor: BORDER, background: "var(--db-dialog-bg, var(--db-surface))" }}
        >
          {/* Left: Save + Report */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSave}
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[0.88rem] font-bold border transition-all hover:scale-105 active:scale-95"
              style={{
                background:  isSaved ? PRIMARY : "transparent",
                color:       isSaved ? "var(--db-primary-text)" : TEXT_SECONDARY,
                borderColor: isSaved ? PRIMARY : BORDER,
                boxShadow:   isSaved ? "0 6px 18px var(--db-primary-20)" : "none",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 17, fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}>
                bookmark
              </span>
              {isSaved ? "Saved" : "Save Job"}
            </button>

            {onReport && (
              <button
                onClick={onReport}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border transition-all hover:scale-110 active:scale-95"
                style={{ background: "transparent", borderColor: "rgba(239,68,68,0.3)", color: "#f87171" }}
                aria-label="Report this job"
                title="Report this job"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>flag</span>
              </button>
            )}
          </div>

          {/* Right: Withdraw / Apply */}
          {isApplied && onWithdraw ? (
            <button
              onClick={onWithdraw}
              className="inline-flex items-center justify-center gap-2 rounded-full px-10 py-3 text-[0.95rem] font-bold w-full sm:w-auto border transition-all hover:scale-105 active:scale-95"
              style={{ background: "transparent", color: "#f87171", borderColor: "rgba(239,68,68,0.4)" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>undo</span>
              Withdraw Application
            </button>
          ) : (
            <button
              onClick={isApplied ? undefined : onRequestApply}
              disabled={isApplied}
              className="inline-flex items-center justify-center gap-2 rounded-full px-10 py-3 text-[0.95rem] font-bold w-full sm:w-auto transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: isApplied ? "var(--db-border)" : PRIMARY,
                color:      isApplied ? "var(--db-text-muted)" : "var(--db-primary-text)",
                border:     isApplied ? `1.5px solid ${BORDER}` : "none",
                boxShadow:  isApplied ? "none" : "0 12px 28px var(--db-primary-20)",
                opacity:    isApplied ? 0.75 : 1,
              }}
            >
              {isApplied ? (
                <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>Applied!</>
              ) : (
                <>Apply Now<span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
