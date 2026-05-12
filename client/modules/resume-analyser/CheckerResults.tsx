import React, { useState } from "react";
import type { EnhancedResume } from "./ResumeAnalyser";
import { ResumePreview } from "./ResumePreview";

// ── Exact types from /openapi.json ────────────────────────────

type IssueLevel = "no_issues" | "warning" | "error";
type HyperlinkStatus = "ok" | "broken" | "timeout";

interface CategoryIssue {
  message: string;
  original_text?: string | null;
  corrected_text?: string | null;
  suggestion: string;
}

interface CategoryResult {
  name: string;
  score: number;
  issue_count: number;
  level: IssueLevel;
  issues: CategoryIssue[];
  passed: boolean;
}

interface SectionResult {
  name: string;
  present: boolean;
}

interface HyperlinkResult {
  url: string;
  status: HyperlinkStatus;
  status_code?: number | null;
  source?: string;
}

export interface CheckerResult {
  overall_score: number;
  total_issues: number;
  ats_parse_rate: CategoryResult;
  quantifying_impact: CategoryResult;
  repetition: CategoryResult;
  spelling_grammar: CategoryResult;
  format: CategoryResult;
  style: CategoryResult;
  sections_found: SectionResult[];
  hyperlinks: HyperlinkResult[];
  enhancements: string[];
}

interface CheckerResultsProps {
  data: CheckerResult;
  onReset: () => void;
  enhancedData?: EnhancedResume | null;
}

const CATEGORY_KEYS: (keyof CheckerResult)[] = [
  "ats_parse_rate",
  "quantifying_impact",
  "repetition",
  "spelling_grammar",
  "format",
  "style",
];

const CATEGORY_ICONS: Record<string, string> = {
  ats_parse_rate:      "scanner",
  quantifying_impact:  "bar_chart",
  repetition:          "content_copy",
  spelling_grammar:    "spellcheck",
  format:              "format_align_left",
  style:               "style",
};

function scoreColor(score: number) {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

function levelColor(level: IssueLevel) {
  if (level === "no_issues") return "#22c55e";
  if (level === "warning")   return "#f59e0b";
  return "#ef4444";
}

function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const color = scoreColor(score);
  const label = score >= 80 ? "Great" : score >= 60 ? "Fair" : "Poor";
  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <div
        className="rounded-full flex items-center justify-center font-black border-4"
        style={{ width: size, height: size, borderColor: color, color, fontSize: size * 0.28 }}
      >
        {score}
      </div>
      <span
        className="text-[9px] uppercase tracking-widest font-bold"
        style={{ color, fontFamily: "'JetBrains Mono', monospace" }}
      >
        {label}
      </span>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = scoreColor(score);
  return (
    <div className="flex items-center gap-2 w-full min-w-0">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--db-border)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums w-7 text-right shrink-0" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

function HyperlinkBadge({ status }: { status: HyperlinkStatus }) {
  const MAP = {
    ok:      { color: "#22c55e", icon: "check_circle", label: "OK"      },
    broken:  { color: "#ef4444", icon: "cancel",       label: "Broken"  },
    timeout: { color: "#f59e0b", icon: "schedule",     label: "Timeout" },
  };
  const s = MAP[status] ?? MAP.broken;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold shrink-0"
      style={{ background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}40` }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 12 }} aria-hidden="true">{s.icon}</span>
      {s.label}
    </span>
  );
}

export function CheckerResults({ data, onReset, enhancedData }: CheckerResultsProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const categories = CATEGORY_KEYS.map(k => data[k] as CategoryResult);

  // ── Preview Mode ─────────────────────────────────────────────
  if (showPreview && enhancedData) {
    return <ResumePreview data={enhancedData} onBack={() => setShowPreview(false)} />;
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header: overall score + summary ── */}
      <div
        className="rounded-xl border p-5 flex flex-col sm:flex-row items-center sm:items-start gap-5"
        style={{ background: "var(--db-card)", borderColor: "var(--db-border)" }}
      >
        <ScoreRing score={data.overall_score} size={80} />
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <h3 className="text-lg font-bold" style={{ color: "var(--db-text)" }}>Resume Check Complete</h3>
          <p className="text-sm mt-0.5" style={{ color: "var(--db-text-muted)" }}>
            Found <strong style={{ color: data.total_issues > 0 ? "#ef4444" : "#22c55e" }}>{data.total_issues} issue{data.total_issues !== 1 ? "s" : ""}</strong> across 6 categories.
          </p>
          {/* Mini score grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 mt-3">
            {categories.map((cat) => (
              <div key={cat.name} className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: levelColor(cat.level) }}
                />
                <span className="text-xs truncate" style={{ color: "var(--db-text-secondary)" }}>
                  {cat.name}
                </span>
                <span className="text-xs font-bold ml-auto shrink-0" style={{ color: scoreColor(cat.score) }}>
                  {cat.score}
                </span>
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all hover:opacity-80 shrink-0 self-start"
          style={{ color: "var(--db-text-muted)", borderColor: "var(--db-border)", background: "var(--db-card)" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden="true">refresh</span>
          Check Another
        </button>
      </div>

      {/* ── Category breakdown ── */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: "var(--db-border)", background: "var(--db-card)" }}
      >
        <div className="px-5 py-3 border-b" style={{ borderColor: "var(--db-border)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--db-text-muted)" }}>
            Category Breakdown
          </p>
        </div>
        {categories.map((cat, idx) => {
          const isOpen = openIdx === idx;
          const icon = CATEGORY_ICONS[CATEGORY_KEYS[idx] as string] ?? "check";
          return (
            <div key={cat.name} className="border-b last:border-b-0" style={{ borderColor: "var(--db-border)" }}>
              <button
                type="button"
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors"
                style={{ background: isOpen ? "var(--db-table-hover)" : "transparent" }}
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                aria-expanded={isOpen}
              >
                {/* Icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: cat.passed ? "rgba(34,197,94,0.1)" : `${levelColor(cat.level)}18` }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16, color: cat.passed ? "#22c55e" : levelColor(cat.level) }}
                    aria-hidden="true"
                  >
                    {icon}
                  </span>
                </div>
                {/* Name + bar */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>{cat.name}</p>
                  <ScoreBar score={cat.score} />
                </div>
                {/* Issue pill */}
                <div className="flex items-center gap-2 shrink-0">
                  {cat.issue_count > 0 ? (
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${levelColor(cat.level)}18`, color: levelColor(cat.level) }}
                    >
                      {cat.issue_count} issue{cat.issue_count !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#22c55e" }} aria-hidden="true">check_circle</span>
                  )}
                  {cat.issues.length > 0 && (
                    <span
                      className="material-symbols-outlined transition-transform duration-200"
                      style={{ fontSize: 16, color: "var(--db-text-muted)", transform: isOpen ? "rotate(180deg)" : "none" }}
                      aria-hidden="true"
                    >
                      expand_more
                    </span>
                  )}
                </div>
              </button>

              {/* Issue list */}
              {isOpen && cat.issues.length > 0 && (
                <div className="px-5 pb-4 flex flex-col gap-3" style={{ borderTop: "1px solid var(--db-border)" }}>
                  {cat.issues.map((issue, iIdx) => (
                    <div
                      key={iIdx}
                      className="rounded-lg p-3 flex flex-col gap-2"
                      style={{ background: "var(--db-bg)", border: "1px solid var(--db-border)", marginTop: iIdx === 0 ? 12 : 0 }}
                    >
                      {/* Message */}
                      <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>{issue.message}</p>

                      {/* Original → Corrected */}
                      {(issue.original_text || issue.corrected_text) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {issue.original_text && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wide mb-1 font-bold" style={{ color: "#ef4444", fontFamily: "'JetBrains Mono', monospace" }}>Original</p>
                              <p
                                className="text-xs px-3 py-2 rounded leading-relaxed"
                                style={{ background: "rgba(239,68,68,0.06)", color: "var(--db-text)", border: "1px solid rgba(239,68,68,0.2)" }}
                              >
                                &ldquo;{issue.original_text}&rdquo;
                              </p>
                            </div>
                          )}
                          {issue.corrected_text && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wide mb-1 font-bold" style={{ color: "#22c55e", fontFamily: "'JetBrains Mono', monospace" }}>Suggested</p>
                              <p
                                className="text-xs px-3 py-2 rounded leading-relaxed"
                                style={{ background: "rgba(34,197,94,0.06)", color: "var(--db-text)", border: "1px solid rgba(34,197,94,0.2)" }}
                              >
                                &ldquo;{issue.corrected_text}&rdquo;
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Suggestion */}
                      <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined mt-0.5 shrink-0" style={{ fontSize: 14, color: "var(--db-primary)" }} aria-hidden="true">lightbulb</span>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--db-text-muted)" }}>{issue.suggestion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Sections Found ── */}
      {data.sections_found.length > 0 && (
        <div
          className="rounded-xl border p-5"
          style={{ borderColor: "var(--db-border)", background: "var(--db-card)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--db-text-muted)" }}>
            Resume Sections
          </p>
          <div className="flex flex-wrap gap-2">
            {data.sections_found.map((sec) => (
              <span
                key={sec.name}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: sec.present ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                  color: sec.present ? "#22c55e" : "#ef4444",
                  border: `1px solid ${sec.present ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 12 }} aria-hidden="true">
                  {sec.present ? "check" : "close"}
                </span>
                {sec.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Hyperlinks ── */}
      {data.hyperlinks.length > 0 && (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: "var(--db-border)", background: "var(--db-card)" }}
        >
          <div className="px-5 py-3 border-b" style={{ borderColor: "var(--db-border)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--db-text-muted)" }}>
              Hyperlink Validation
            </p>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--db-border)" }}>
            {data.hyperlinks.map((link, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4 px-5 py-3">
                <p
                  className="text-xs truncate flex-1"
                  style={{ color: "var(--db-text-muted)", fontFamily: "'JetBrains Mono', monospace" }}
                  title={link.url}
                >
                  {link.url}
                </p>
                <HyperlinkBadge status={link.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Enhancement Tips ── */}
      {data.enhancements.length > 0 && (
        <div
          className="rounded-xl border p-5"
          style={{ borderColor: "var(--db-border)", background: "var(--db-card)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--db-text-muted)" }}>
            Enhancement Tips
          </p>
          <ol className="flex flex-col gap-3">
            {data.enhancements.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                  style={{ background: "var(--db-primary-10)", color: "var(--db-primary)", border: "1px solid var(--db-primary-20)" }}
                >
                  {idx + 1}
                </span>
                <p className="text-sm leading-relaxed" style={{ color: "var(--db-text)" }}>{tip}</p>
              </li>
            ))}
          </ol>
        </div>
      )}


      {/* ── Enhanced Resume Preview & Export CTA ── */}
      {enhancedData && (
        <div className="ra-preview-cta">
          <div className="ra-preview-cta-text">
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: "var(--db-primary)" }}>draft</span>
            <div>
              <h4>Your AI-enhanced resume is ready!</h4>
              <p>We've improved your resume based on the analysis. Preview it and export as PDF or DOCX.</p>
            </div>
          </div>
          <button
            className="ra-preview-btn"
            onClick={() => setShowPreview(true)}
            type="button"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>visibility</span>
            Preview & Export Resume
          </button>
        </div>
      )}
    </div>
  );
}
