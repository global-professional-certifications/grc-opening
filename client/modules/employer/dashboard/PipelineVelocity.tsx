import React from "react";

const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const SYNE = { fontFamily: "'Syne', sans-serif" };

interface MetricRowProps {
  label: string;
  valueLabel: string;
  pct: number;
  barColor?: string;
}

function MetricRow({ label, valueLabel, pct, barColor }: MetricRowProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>
          {label}
        </span>
        <span className="text-sm font-bold" style={{ ...MONO, color: "var(--db-text)" }}>
          {valueLabel}
        </span>
      </div>
      <div
        className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ background: "var(--db-ring-track)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: barColor ?? "var(--db-primary)",
            boxShadow: `0 0 8px ${barColor ?? "var(--db-primary-40)"}`,
            transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </div>
    </div>
  );
}

export function PipelineVelocity() {
  return (
    <div className="db-card p-6 flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold" style={{ ...SYNE, color: "var(--db-text)" }}>
          Pipeline Velocity
        </h3>
        <p className="text-xs mt-0.5" style={{ color: "var(--db-text-muted)" }}>
          Hiring performance indicators
        </p>
      </div>

      {/* Metrics */}
      <div className="space-y-5 flex-1">
        <MetricRow
          label="Time to Shortlist"
          valueLabel="4.2 Days"
          pct={58}
        />
        <MetricRow
          label="Application Quality"
          valueLabel="88% Match"
          pct={88}
        />
        <MetricRow
          label="Offer Acceptance"
          valueLabel="92%"
          pct={92}
          barColor="#10b981"
        />
      </div>

      {/* Divider */}
      <div className="my-5" style={{ height: 1, background: "var(--db-border)" }} />

      {/* Insight quote */}
      <div
        className="p-4 rounded-lg"
        style={{ background: "var(--db-primary-10)", border: "1px solid var(--db-primary-20)" }}
      >
        <div className="flex items-start gap-3">
          <span
            className="material-symbols-outlined flex-shrink-0 mt-0.5"
            style={{ fontSize: 18, color: "var(--db-primary)" }}
          >
            emoji_objects
          </span>
          <p className="text-xs leading-relaxed italic" style={{ color: "var(--db-text-secondary)" }}>
            &quot;Your listing{" "}
            <span style={{ color: "var(--db-primary)", fontStyle: "normal", fontWeight: 600 }}>
              &apos;Senior GRC Lead&apos;
            </span>{" "}
            is outperforming 90% of similar roles in your region.&quot;
          </p>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-3 mt-5">
        <a
          href="/employer/analytics"
          className="flex-1 text-center text-xs font-semibold py-2 rounded-lg transition-all db-btn-secondary"
          style={{
            background: "var(--db-btn-sec)",
            color: "var(--db-text-secondary)",
            ...MONO,
          }}
        >
          Full Report
        </a>
        <a
          href="/employer/applicants"
          className="flex-1 text-center text-xs font-semibold py-2 rounded-lg transition-all db-btn-primary"
          style={{
            background: "var(--db-primary)",
            color: "var(--db-primary-text)",
            ...MONO,
          }}
        >
          Review Pipeline
        </a>
      </div>
    </div>
  );
}
