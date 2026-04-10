import React from "react";

function CertTag({ label }: { label: string }) {
  return (
    <span className="px-2 py-1 rounded text-[10px] font-semibold"
      style={{ background: "rgba(255, 255, 255, 0.05)", color: "var(--db-text-secondary)", border: "1px solid var(--db-border)" }}>
      {label}
    </span>
  );
}

interface JobCardProps { logo: React.ReactNode; badge: React.ReactNode; title: string; company: string; tags: string[]; }

function JobCard({ logo, badge, title, company, tags }: JobCardProps) {
  return (
    // db-card: base styling
    <div className="db-card p-6 flex flex-col justify-between border-transparent shadow-md">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-2 overflow-hidden shadow-sm"
            style={{ border: "1px solid var(--db-border)" }}>{logo}</div>
          {badge}
        </div>
        <h4 className="text-lg font-bold mb-1" style={{ color: "var(--db-text)" }}>{title}</h4>
        <p className="text-sm mb-4 font-medium" style={{ color: "var(--db-text-secondary)" }}>{company}</p>
        <div className="flex flex-wrap gap-2 mb-6">{tags.map(t => <CertTag key={t} label={t} />)}</div>
      </div>

      <button
        className="db-btn-primary w-full py-2.5 font-bold text-sm rounded-full cursor-pointer transition-all duration-200"
        style={{ background: "var(--db-primary)", color: "#ffffff", boxShadow: "0 4px 12px var(--db-primary-20)" }}
      >
        Apply Now
      </button>
    </div>
  );
}

function ActiveBadge({ pulse }: { pulse?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
      style={{ background: "var(--db-primary-10)", color: "var(--db-primary)" }}>
      <span className={`w-1.5 h-1.5 rounded-full ${pulse ? "animate-pulse" : ""}`} style={{ background: "var(--db-primary)" }} />
      Actively hiring
    </div>
  );
}

export function RecommendedJobs() {
  return (
    <section>
      <div className="flex justify-between items-end mb-6">
        <h3 className="text-xl font-bold border-l-4 pl-3" style={{ color: "var(--db-text)", borderColor: "var(--db-primary)" }}>Recommended Jobs</h3>
        <a href="#" className="text-sm font-bold hover:opacity-80 transition-opacity" style={{ color: "var(--db-primary)" }}>View all roles</a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <JobCard
          logo={<div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 rounded-sm" />}
          badge={<ActiveBadge pulse />} title="Senior GRC Analyst" company="Deloitte • Risk Advisory" tags={["CISA","SOX","ISO27001"]} />
        <JobCard
          logo={<div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 border-4 rounded-full" style={{ borderColor: "var(--db-primary)" }} /></div>}
          badge={<ActiveBadge />} title="Compliance Manager" company="Goldman Sachs • FinTech" tags={["CISM","SEC","GDPR"]} />
        <JobCard
          logo={<div className="w-full h-full bg-blue-500 transform rotate-45" />}
          badge={<div className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase"
            style={{ background: "var(--db-btn-sec)", color: "var(--db-text-secondary)" }}>2 days ago</div>}
          title="IT Audit Specialist" company="KPMG • Assurance Services" tags={["CISA","NIST"]} />
      </div>
    </section>
  );
}
