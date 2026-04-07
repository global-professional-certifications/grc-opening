import React from "react";

const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const SYNE = { fontFamily: "'Syne', sans-serif" };

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
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
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
  const max = Math.max(...values);
  return (
    <div className="flex items-end gap-1 h-8">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t"
          style={{
            height: `${(v / max) * 100}%`,
            minHeight: 3,
            background:
              i === activeIdx
                ? "var(--db-primary)"
                : "var(--db-primary-20)",
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

export function EmployerStatsOverview() {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

      {/* Active Job Postings */}
      <StatCard
        label="Active Job Postings"
        value={7}
        badge="+1 New"
        badgeType="positive"
        icon="work"
      >
        <SparkBars values={[3, 4, 4, 6, 5, 7, 7]} activeIdx={6} />
      </StatCard>

      {/* Total Applicants */}
      <StatCard
        label="Total Applicants"
        value={134}
        badge="+12% vs LW"
        badgeType="positive"
        icon="group"
      >
        <SparkBars values={[60, 75, 80, 95, 110, 120, 134]} activeIdx={6} />
      </StatCard>

      {/* Shortlisted */}
      <StatCard
        label="Shortlisted"
        value={23}
        badge="Stable"
        badgeType="muted"
        icon="star"
        iconColor="#f59e0b"
      >
        <div className="flex items-center gap-2 mt-1">
          <div className="flex -space-x-2">
            {["MK", "SJ", "DC", "AR"].map((initials, idx) => (
              <div
                key={initials}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold"
                style={{
                  background: ["#6366f1","#8b5cf6","#ec4899","#f59e0b"][idx],
                  border: "2px solid var(--db-card)",
                  color: "#fff",
                  ...MONO,
                }}
              >
                {initials}
              </div>
            ))}
          </div>
          <span className="text-xs" style={{ ...MONO, color: "var(--db-text-muted)" }}>candidates</span>
        </div>
      </StatCard>

      {/* Jobs Closed */}
      <StatCard
        label="Jobs Closed"
        value={3}
        badge="Total MTD"
        badgeType="neutral"
        icon="check_circle"
        iconColor="#10b981"
      >
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            Month to date
          </p>
          <CircleProgress pct={43} />
        </div>
      </StatCard>

    </section>
  );
}
