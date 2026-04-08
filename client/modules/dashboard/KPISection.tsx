import React from "react";

const MONO = { fontFamily: "'JetBrains Mono', monospace" };

function SparkBar({ h, active }: { h: string; active: boolean }) {
  return (
    <div className="w-1.5 rounded-t" style={{
      height: h,
      background: active ? "var(--db-primary)" : "var(--db-primary-20)",
      boxShadow: active ? "0 0 10px var(--db-primary-40)" : undefined,
    }} />
  );
}

function StatCard({ children }: { children: React.ReactNode }) {
  // db-card: base elevation   db-card-hover: lift + glow on hover
  return <div className="db-card db-card-hover p-6">{children}</div>;
}

function Card1() {
  return (
    <StatCard>
      <div className="flex justify-between items-start mb-4">
        <p className="text-xs uppercase tracking-wider" style={{ ...MONO, color: "var(--db-text-muted)" }}>Applications Sent</p>
        <span className="material-symbols-outlined text-xl" style={{ color: "var(--db-primary)" }}>send</span>
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-bold" style={{ color: "var(--db-text)" }}>12</h3>
        <span className="text-xs" style={{ ...MONO, color: "var(--db-primary)" }}>+14% ↑</span>
      </div>
      <div className="mt-4 h-8 flex items-end gap-1">
        <SparkBar h="40%" active={false} /><SparkBar h="60%" active={false} />
        <SparkBar h="45%" active={false} /><SparkBar h="80%" active={true} />
        <SparkBar h="65%" active={true} />
      </div>
    </StatCard>
  );
}

function Card2() {
  return (
    <StatCard>
      <div className="flex justify-between items-start mb-4">
        <p className="text-xs uppercase tracking-wider" style={{ ...MONO, color: "var(--db-text-muted)" }}>Profile Views</p>
        <span className="material-symbols-outlined text-xl" style={{ color: "var(--db-text-muted)" }}>visibility</span>
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-bold" style={{ color: "var(--db-text)" }}>47</h3>
        <span className="text-xs" style={{ ...MONO, color: "var(--db-text-muted)" }}>-- 0%</span>
      </div>
      <p className="mt-4 text-xs" style={{ color: "var(--db-text-muted)" }}>Viewed by 8 recruiters this week</p>
    </StatCard>
  );
}

function Card3() {
  return (
    <StatCard>
      <div className="flex justify-between items-start mb-4">
        <p className="text-xs uppercase tracking-wider" style={{ ...MONO, color: "var(--db-text-muted)" }}>Saved Jobs</p>
        <span className="material-symbols-outlined text-xl" style={{ color: "var(--db-text-muted)" }}>bookmark</span>
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-bold" style={{ color: "var(--db-text)" }}>8</h3>
        <span className="text-xs" style={{ ...MONO, color: "var(--db-primary)" }}>+2 new</span>
      </div>
      <div className="mt-4 flex -space-x-2">
        {["DS","GS","K"].map((i, idx) => (
          <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white ${["bg-slate-500","bg-slate-600","bg-slate-700"][idx]}`}
            style={{ border: "2px solid var(--db-card)" }}>{i}</div>
        ))}
      </div>
    </StatCard>
  );
}

function Card4() {
  return (
    <StatCard>
      <div className="flex items-center justify-between h-full">
        <div>
          <p className="text-xs uppercase tracking-wider mb-4" style={{ ...MONO, color: "var(--db-text-muted)" }}>Response Rate</p>
          <h3 className="text-3xl font-bold" style={{ color: "var(--db-text)" }}>41%</h3>
        </div>
        <div className="relative w-16 h-16">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="transparent" stroke="var(--db-ring-track)" strokeWidth="4" />
            <circle cx="32" cy="32" r="28" fill="transparent" stroke="var(--db-primary)" strokeWidth="4" strokeDasharray="175" strokeDashoffset="103" />
          </svg>
        </div>
      </div>
    </StatCard>
  );
}

export function KPISection() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card1 /><Card2 /><Card3 /><Card4 />
    </section>
  );
}
