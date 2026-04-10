import React from "react";

export function GRCInsight() {
  return (
    <div className="db-card-hover p-6 relative overflow-hidden"
      style={{
        background: "var(--db-surface)",
        border: "1px solid var(--db-primary-20)",
        borderRadius: "8px",
        boxShadow: "var(--db-card-shadow)",
      }}>
      {/* Ambient glow */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: "var(--db-primary-10)", filter: "blur(24px)" }} />

      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-amber-500">lightbulb</span>
        <h3 className="text-lg font-semibold" style={{ fontFamily: "'Syne', sans-serif", color: "var(--db-text)" }}>
          GRC Market Insight
        </h3>
      </div>

      <blockquote className="leading-relaxed mb-6 italic" style={{ color: "var(--db-text-secondary)" }}>
        &ldquo;Candidates with active{" "}
        <span className="font-bold not-italic" style={{ color: "var(--db-primary)" }}>CISA certifications</span>{" "}
        are seeing a 22% higher interview conversion rate in the current financial services sector.&rdquo;
      </blockquote>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-px" style={{ background: "var(--db-border)" }} />
          <div>
            <p className="text-[10px] uppercase" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--db-text-muted)" }}>
              Market Confidence
            </p>
            <p className="text-xs font-bold" style={{ color: "var(--db-text-secondary)" }}>High Growth Sector</p>
          </div>
        </div>
        <span className="material-symbols-outlined text-4xl" style={{ color: "var(--db-primary-40)" }}>trending_up</span>
      </div>
    </div>
  );
}
