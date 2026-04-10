import React, { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const SYNE = { fontFamily: "'Syne', sans-serif" };

interface DashboardStats {
  activeJobCount: number;
  closedJobCount: number;
  totalApplicants: number;
  shortlisted: number;
}

interface StatCardProps {
  label: string;
  value: string | number;
  badge: string;
  badgeType: "positive" | "neutral" | "muted";
  icon: string;
  iconColor?: string;
  children?: React.ReactNode;
}

function StatCard({ label, value, badge, badgeType, icon, iconColor, children }: StatCardProps) {
  const badgeStyle =
    badgeType === "positive"
      ? { background: "rgba(16,185,129,0.12)", color: "#10b981" }
      : badgeType === "neutral"
      ? { background: "var(--db-primary-10)", color: "var(--db-primary)" }
      : { background: "var(--db-table-head)", color: "var(--db-text-muted)" };

  return (
    <div className="db-card p-6">
      <div className="flex items-start justify-between mb-4">
        <p
          className="text-[10px] uppercase tracking-widest leading-tight"
          style={{ ...MONO, color: "var(--db-text-muted)" }}
        >
          {label}
        </p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: iconColor ? `${iconColor}18` : "var(--db-primary-10)" }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: iconColor ?? "var(--db-primary)" }}
          >
            {icon}
          </span>
        </div>
      </div>

      <div className="flex items-baseline gap-3">
        <h3 className="text-4xl font-bold" style={{ ...SYNE, color: "var(--db-text)" }}>
          {value}
        </h3>
        <span
          className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
          style={badgeStyle}
        >
          {badge}
        </span>
      </div>

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

function SparkBars({ values, activeIdx }: { values: number[]; activeIdx: number }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1 h-8">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t"
          style={{
            height: `${(v / max) * 100}%`,
            minHeight: 3,
            background: i === activeIdx ? "var(--db-primary)" : "var(--db-primary-20)",
            boxShadow: i === activeIdx ? "0 0 8px var(--db-primary-40)" : undefined,
          }}
        />
      ))}
    </div>
  );
}

function CircleProgress({ pct }: { pct: number }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
      <circle cx="32" cy="32" r={r} fill="transparent" stroke="var(--db-ring-track)" strokeWidth="4" />
      <circle
        cx="32" cy="32" r={r} fill="transparent"
        stroke="var(--db-primary)" strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

function SkeletonCard() {
  return (
    <div className="db-card p-6 animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-24 mb-4" style={{ background: "var(--db-border)" }} />
      <div className="h-10 bg-gray-200 rounded w-16" style={{ background: "var(--db-border)" }} />
    </div>
  );
}

export function EmployerStatsOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ stats: DashboardStats }>("/jobs/stats")
      .then(res => setStats(res.stats))
      .catch(err => console.error("Failed to load stats:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </section>
    );
  }

  const activeCount = stats?.activeJobCount ?? 0;
  const totalApplicants = stats?.totalApplicants ?? 0;
  const shortlisted = stats?.shortlisted ?? 0;
  const closedCount = stats?.closedJobCount ?? 0;
  const closedPct = (activeCount + closedCount) > 0
    ? Math.round((closedCount / (activeCount + closedCount)) * 100)
    : 0;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

      {/* Active Job Postings */}
      <StatCard
        label="Active Job Postings"
        value={activeCount}
        badge={activeCount > 0 ? `${activeCount} live` : "None"}
        badgeType={activeCount > 0 ? "positive" : "muted"}
        icon="work"
      >
        <SparkBars values={[0, 0, 0, 0, 0, 0, activeCount]} activeIdx={6} />
      </StatCard>

      {/* Total Applicants */}
      <StatCard
        label="Total Applicants"
        value={totalApplicants}
        badge={totalApplicants > 0 ? "All time" : "None yet"}
        badgeType={totalApplicants > 0 ? "positive" : "muted"}
        icon="group"
      >
        <SparkBars values={[0, 0, 0, 0, 0, 0, totalApplicants]} activeIdx={6} />
      </StatCard>

      {/* Shortlisted */}
      <StatCard
        label="Shortlisted"
        value={shortlisted}
        badge={shortlisted > 0 ? "In review" : "None"}
        badgeType={shortlisted > 0 ? "neutral" : "muted"}
        icon="star"
        iconColor="#f59e0b"
      >
        <p className="text-xs mt-1" style={{ color: "var(--db-text-muted)" }}>
          Reviewing + Interviewing stage
        </p>
      </StatCard>

      {/* Jobs Closed */}
      <StatCard
        label="Jobs Closed"
        value={closedCount}
        badge="Total MTD"
        badgeType="neutral"
        icon="check_circle"
        iconColor="#10b981"
      >
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            Month to date
          </p>
          <CircleProgress pct={closedPct} />
        </div>
      </StatCard>

    </section>
  );
}
