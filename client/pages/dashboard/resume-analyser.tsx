import React, { useEffect, useState } from "react";
import Head from "next/head";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { ResumeChecker } from "../../modules/resume-analyser/ResumeChecker";
import { ResumeAnalyser } from "../../modules/resume-analyser/ResumeAnalyser";

type Tool = "checker" | "enhancer" | null;

const TOOLS = [
  {
    id: "checker" as Tool,
    badge: "Basic",
    icon: "fact_check",
    title: "AI Resume Checker",
    description:
      "Instant quality check — typos, grammar, ambiguity, broken links, section structure, and per-category scores.",
    bullets: ["Typo & grammar scan", "Hyperlink validation", "Section detection", "Actionable tips"],
  },
  {
    id: "enhancer" as Tool,
    badge: "Intermediate",
    icon: "auto_awesome",
    title: "AI Resume Enhancer",
    description:
      "Tailor your resume to a specific job description. AI rewrites and enhances your resume for maximum ATS impact.",
    bullets: ["Job-description matching", "ATS keyword weaving", "Style templates", "Full rewrite"],
  },
];

export default function ResumeToolsPage() {
  const [activeTool, setActiveTool] = useState<Tool>(null);

  useEffect(() => {
    const toggle = document.querySelector<HTMLElement>(".theme-toggle");
    if (toggle) toggle.style.display = "none";
    return () => { if (toggle) toggle.style.display = ""; };
  }, []);

  return (
    <DashboardLayout>
      <Head>
        <title>AI Resume Tools | GRC Openings</title>
        <meta
          name="description"
          content="Check and enhance your GRC resume with AI. Choose a basic check or a full job-tailored enhancement."
        />
      </Head>

      {/* ── Page header ── */}
      <header className="mb-8">
        <h2 className="text-3xl font-bold" style={{ color: "var(--db-text)" }}>
          AI Resume Tools
        </h2>
        <p className="mt-1 text-sm font-medium" style={{ color: "var(--db-text-muted)" }}>
          Choose a tool to improve your resume — from a quick quality check to a full AI enhancement.
        </p>
      </header>

      {/* ── Tool selector tiles ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {TOOLS.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => setActiveTool(isActive ? null : tool.id)}
              className="text-left rounded-xl border p-5 flex flex-col gap-4 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2"
              style={{
                background: isActive ? "var(--db-primary-10)" : "var(--db-card)",
                borderColor: isActive ? "var(--db-primary)" : "var(--db-border)",
                boxShadow: isActive ? "0 0 0 1px var(--db-primary-20)" : undefined,
                // @ts-ignore
                "--tw-ring-color": "var(--db-primary-40)",
              }}
              aria-pressed={isActive}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: isActive ? "var(--db-primary)" : "var(--db-primary-10)",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 22, color: isActive ? "#fff" : "var(--db-primary)" }}
                    aria-hidden="true"
                  >
                    {tool.icon}
                  </span>
                </div>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mt-0.5"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    background: isActive ? "var(--db-primary)" : "var(--db-primary-10)",
                    color: isActive ? "#fff" : "var(--db-primary)",
                  }}
                >
                  {tool.badge}
                </span>
              </div>

              {/* Title + description */}
              <div>
                <h3 className="text-base font-bold mb-1" style={{ color: "var(--db-text)" }}>
                  {tool.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--db-text-muted)" }}>
                  {tool.description}
                </p>
              </div>

              {/* Bullet list */}
              <ul className="flex flex-col gap-1.5 mt-auto">
                {tool.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2">
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 14, color: "var(--db-primary)" }}
                      aria-hidden="true"
                    >
                      check
                    </span>
                    <span className="text-xs" style={{ color: "var(--db-text-secondary)" }}>{b}</span>
                  </li>
                ))}
              </ul>

              {/* CTA hint */}
              <div
                className="flex items-center gap-1.5 text-xs font-semibold mt-1"
                style={{ color: isActive ? "var(--db-primary)" : "var(--db-text-muted)" }}
              >
                <span
                  className="material-symbols-outlined transition-transform duration-200"
                  style={{ fontSize: 16, transform: isActive ? "rotate(90deg)" : "none" }}
                  aria-hidden="true"
                >
                  {isActive ? "keyboard_arrow_down" : "keyboard_arrow_right"}
                </span>
                {isActive ? "Click to collapse" : "Click to open"}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Active tool panel ── */}
      {activeTool === "checker" && (
        <section aria-label="AI Resume Checker">
          <div className="flex items-center gap-3 mb-5">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, color: "var(--db-primary)" }}
              aria-hidden="true"
            >
              fact_check
            </span>
            <h3 className="text-lg font-bold" style={{ color: "var(--db-text)" }}>
              AI Resume Checker
            </h3>
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full"
              style={{ fontFamily: "'JetBrains Mono', monospace", background: "var(--db-primary-10)", color: "var(--db-primary)" }}
            >
              Basic
            </span>
          </div>
          <ResumeChecker isPublic={false} />
        </section>
      )}

      {activeTool === "enhancer" && (
        <section aria-label="AI Resume Enhancer">
          <div className="flex items-center gap-3 mb-5">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, color: "var(--db-primary)" }}
              aria-hidden="true"
            >
              auto_awesome
            </span>
            <h3 className="text-lg font-bold" style={{ color: "var(--db-text)" }}>
              AI Resume Enhancer
            </h3>
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full"
              style={{ fontFamily: "'JetBrains Mono', monospace", background: "var(--db-primary-10)", color: "var(--db-primary)" }}
            >
              Intermediate
            </span>
          </div>
          <ResumeAnalyser isPublic={false} />
        </section>
      )}
    </DashboardLayout>
  );
}
