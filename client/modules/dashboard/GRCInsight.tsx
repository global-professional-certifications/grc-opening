import React from "react";

export function GRCInsight() {
  return (
    <div className="db-card p-6 relative overflow-hidden shadow-sm"
      style={{ background: "var(--db-card)", color: "var(--db-text)" }}>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <span className="material-symbols-outlined text-amber-500">lightbulb</span>
        </div>
        <h3 className="text-lg font-bold">
          GRC Market Insight
        </h3>
      </div>

      <div className="relative mb-8">
        <span className="material-symbols-outlined absolute -left-2 -top-4 text-6xl select-none" style={{ color: "var(--db-primary)", opacity: 0.4 }}>format_quote</span>
        <blockquote className="leading-relaxed relative z-10 text-sm font-medium italic pl-4" style={{ color: "var(--db-text-secondary)" }}>
          &ldquo;Candidates with active{" "}
          <span className="font-bold not-italic underline decoration-primary underline-offset-4 text-primary" style={{ color: "var(--db-primary)" }}>CISA certifications</span>{" "}
          are seeing a 22% higher interview conversion rate in the current financial services sector.&rdquo;
        </blockquote>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-dashed" style={{ borderColor: "var(--db-border)" }}>
        <div className="flex items-center gap-4">
          <div className="h-10 w-px" style={{ background: "var(--db-border)" }} />
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: "var(--db-text-muted)" }}>
              Market Confidence
            </p>
            <p className="text-xs font-bold" style={{ color: "var(--db-text-secondary)" }}>High Growth Sector</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{ background: "var(--db-primary-10)", color: "var(--db-primary)" }}>
          <span className="material-symbols-outlined text-sm font-bold">trending_up</span>
          Rising
        </div>
      </div>
    </div>
  );
}
