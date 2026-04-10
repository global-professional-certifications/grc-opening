import React from "react";

function SparkBar({ h, active }: { h: string; active: boolean }) {
  return (
    <div className="w-1.5 rounded-t transition-all duration-300" style={{
      height: h,
      background: active ? "#ffffff" : "rgba(255, 255, 255, 0.2)",
      boxShadow: active ? "0 0 12px rgba(255, 255, 255, 0.4)" : undefined,
    }} />
  );
}

function StatCard({ children }: { children: React.ReactNode }) {
  // Brand Blue background, static elevation, white text foundation, no border
  return (
    <div 
      className="db-card p-6 shadow-xl" 
      style={{ 
        background: "var(--db-primary)", 
        color: "#ffffff",
        border: "none"
      }}
    >
      {children}
    </div>
  );
}

function Card1() {
  return (
    <StatCard>
      <div className="flex justify-between items-start mb-6">
        <p className="text-xs font-semibold tracking-wider uppercase opacity-80">Applications Sent</p>
        <div className="p-2 rounded-lg" style={{ background: "rgba(255, 255, 255, 0.15)" }}>
          <span className="material-symbols-outlined text-xl" style={{ color: "#ffffff" }}>send</span>
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-6">
        <h3 className="text-4xl font-bold tracking-tight">12</h3>
        <span className="text-sm font-medium" style={{ color: "rgba(255, 255, 255, 0.9)" }}>+14% ↑</span>
      </div>
      <div className="h-8 flex items-end gap-1.5 opacity-90">
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
      <div className="flex justify-between items-start mb-6">
        <p className="text-xs font-semibold tracking-wider uppercase opacity-80">Profile Views</p>
        <div className="p-2 rounded-lg" style={{ background: "rgba(255, 255, 255, 0.15)" }}>
          <span className="material-symbols-outlined text-xl" style={{ color: "#ffffff" }}>visibility</span>
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-6">
        <h3 className="text-4xl font-bold tracking-tight">47</h3>
        <span className="text-sm font-medium opacity-70">-- 0%</span>
      </div>
      <p className="text-xs opacity-70 font-medium">Viewed by 8 recruiters this week</p>
    </StatCard>
  );
}

function Card3() {
  return (
    <StatCard>
      <div className="flex justify-between items-start mb-6">
        <p className="text-xs font-semibold tracking-wider uppercase opacity-80">Saved Jobs</p>
        <div className="p-2 rounded-lg" style={{ background: "rgba(255, 255, 255, 0.15)" }}>
          <span className="material-symbols-outlined text-xl" style={{ color: "#ffffff" }}>bookmark</span>
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-6">
        <h3 className="text-4xl font-bold tracking-tight">8</h3>
        <span className="text-sm font-medium" style={{ color: "rgba(255, 255, 255, 0.9)" }}>+2 new</span>
      </div>
      <div className="flex -space-x-2">
        {["DS","GS","K"].map((i, idx) => (
          <div key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-primary font-bold ${["bg-slate-100","bg-slate-200","bg-slate-300"][idx]}`}
            style={{ border: "2px solid var(--db-primary)", color: "var(--db-primary)" }}>{i}</div>
        ))}
      </div>
    </StatCard>
  );
}

function Card4() {
  return (
    <StatCard>
      <div className="flex justify-between items-start mb-6">
        <p className="text-xs font-semibold tracking-wider uppercase opacity-80">Response Rate</p>
        <div className="p-2 rounded-lg" style={{ background: "rgba(255, 255, 255, 0.15)" }}>
          <span className="material-symbols-outlined text-xl" style={{ color: "#ffffff" }}>speed</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <h3 className="text-4xl font-bold tracking-tight">41%</h3>
        <div className="relative w-12 h-12">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="transparent" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="6" />
            <circle cx="32" cy="32" r="28" fill="transparent" stroke="#ffffff" strokeWidth="6" strokeDasharray="175" strokeDashoffset="103" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <p className="mt-4 text-xs opacity-70 font-medium tracking-tight">Top 15% among GRC candidates</p>
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
