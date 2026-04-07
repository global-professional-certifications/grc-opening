import React from "react";

const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const SYNE = { fontFamily: "'Syne', sans-serif" };

interface Applicant {
  initials: string;
  avatarColor: string;
  name: string;
  role: string;
  tags: string[];
  appliedAt: string;
}

const APPLICANTS: Applicant[] = [
  {
    initials: "MT",
    avatarColor: "#6366f1",
    name: "Marcus Thorne",
    role: "Compliance Officer",
    tags: ["CISA", "CRISC"],
    appliedAt: "2h ago",
  },
  {
    initials: "SJ",
    avatarColor: "#8b5cf6",
    name: "Sarah Jenkins",
    role: "Risk Analyst",
    tags: ["CISA", "CIA"],
    appliedAt: "5h ago",
  },
  {
    initials: "DC",
    avatarColor: "#0ea5e9",
    name: "David Chen",
    role: "Senior GRC Lead",
    tags: ["CISM", "CISSP"],
    appliedAt: "1d ago",
  },
  {
    initials: "AR",
    avatarColor: "#f59e0b",
    name: "Amara Rivera",
    role: "Privacy Officer",
    tags: ["ISO 27001", "GDPR"],
    appliedAt: "1d ago",
  },
];

function ApplicantCard({ applicant }: { applicant: Applicant }) {
  return (
    <div
      className="db-card db-card-hover p-5 flex flex-col gap-4 min-w-[200px] w-[220px] flex-shrink-0"
    >
      {/* Avatar + meta */}
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{ background: applicant.avatarColor, ...MONO }}
        >
          {applicant.initials}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--db-text)" }}>
            {applicant.name}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--db-text-muted)" }}>
            {applicant.role}
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {applicant.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 text-[10px] font-bold rounded uppercase"
            style={{
              ...MONO,
              background: "var(--db-primary-10)",
              color: "var(--db-primary)",
              letterSpacing: "0.05em",
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: "1px solid var(--db-border)" }}>
        <span className="text-[10px]" style={{ ...MONO, color: "var(--db-text-muted)" }}>
          {applicant.appliedAt}
        </span>
        <button
          className="text-xs font-semibold px-3 py-1 rounded-full transition-all db-btn-primary"
          style={{ background: "var(--db-primary)", color: "var(--db-primary-text)" }}
        >
          Review
        </button>
      </div>
    </div>
  );
}

export function LatestApplicants() {
  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold" style={{ ...SYNE, color: "var(--db-text)" }}>
            Latest Applicants
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--db-text-muted)" }}>
            Most recent applications across all active listings
          </p>
        </div>
        <a
          href="/employer/applicants"
          className="text-xs font-semibold transition-colors"
          style={{ color: "var(--db-primary)", ...MONO }}
        >
          View All ΓåÆ
        </a>
      </div>

      {/* Horizontal scroll cards */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {APPLICANTS.map((a) => (
          <ApplicantCard key={a.name} applicant={a} />
        ))}

        {/* "More" placeholder card */}
        <div
          className="db-card flex flex-col items-center justify-center min-w-[200px] w-[220px] flex-shrink-0 gap-3 cursor-pointer transition-all db-card-hover"
          onClick={() => (window.location.href = "/employer/applicants")}
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: "var(--db-primary-10)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: "var(--db-primary)" }}>
              arrow_forward
            </span>
          </div>
          <p className="text-sm font-semibold text-center" style={{ color: "var(--db-text-secondary)" }}>
            View all applicants
          </p>
        </div>
      </div>
    </section>
  );
}
