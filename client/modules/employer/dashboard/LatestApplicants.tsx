import React, { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const SYNE = { fontFamily: "'Syne', sans-serif" };

const AVATAR_COLORS = [
  "#6366f1", "#8b5cf6", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444",
];

interface Applicant {
  id: string;
  seekerName: string;
  jobTitle: string;
  status: string;
  appliedAt: string;
  certifications: string[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map(n => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ApplicantCard({ applicant, colorIdx }: { applicant: Applicant; colorIdx: number }) {
  const color = AVATAR_COLORS[colorIdx % AVATAR_COLORS.length];
  const initials = getInitials(applicant.seekerName);

  return (
    <div className="db-card db-card-hover p-5 flex flex-col gap-4 min-w-[200px] w-[220px] shrink-0">
      {/* Avatar + meta */}
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ background: color, ...MONO }}
        >
          {initials}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--db-text)" }}>
            {applicant.seekerName}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--db-text-muted)" }}>
            {applicant.jobTitle}
          </p>
        </div>
      </div>

      {/* Certifications */}
      <div className="flex flex-wrap gap-1.5">
        {applicant.certifications.slice(0, 3).map((cert) => (
          <span
            key={cert}
            className="px-2 py-0.5 text-[10px] font-bold rounded uppercase"
            style={{
              ...MONO,
              background: "var(--db-primary-10)",
              color: "var(--db-primary)",
              letterSpacing: "0.05em",
            }}
          >
            {cert}
          </span>
        ))}
        {applicant.certifications.length === 0 && (
          <span className="text-[10px]" style={{ color: "var(--db-text-muted)", ...MONO }}>
            No certs listed
          </span>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between mt-auto pt-2"
        style={{ borderTop: "1px solid var(--db-border)" }}
      >
        <span className="text-[10px]" style={{ ...MONO, color: "var(--db-text-muted)" }}>
          {timeAgo(applicant.appliedAt)}
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

function SkeletonCard() {
  return (
    <div className="db-card p-5 min-w-[200px] w-[220px] shrink-0 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-full shrink-0" style={{ background: "var(--db-border)" }} />
        <div className="flex-1">
          <div className="h-3 rounded mb-2" style={{ background: "var(--db-border)", width: "70%" }} />
          <div className="h-2 rounded" style={{ background: "var(--db-border)", width: "50%" }} />
        </div>
      </div>
      <div className="h-6 rounded" style={{ background: "var(--db-border)" }} />
    </div>
  );
}

export function LatestApplicants() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ applicants: Applicant[] }>("/jobs/recent-applicants")
      .then(res => setApplicants(res.applicants))
      .catch(err => console.error("Failed to load applicants:", err))
      .finally(() => setLoading(false));
  }, []);

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
          View All &rarr;
        </a>
      </div>

      {/* Horizontal scroll cards */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {loading
          ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
          : applicants.length === 0
          ? (
            <div className="db-card p-8 flex flex-col items-center justify-center gap-3 w-full text-center">
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: "var(--db-text-muted)" }}>
                person_search
              </span>
              <p className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>No applicants yet</p>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                Applications will appear here once candidates apply to your listings.
              </p>
            </div>
          )
          : (
            <>
              {applicants.map((a, idx) => (
                <ApplicantCard key={a.id} applicant={a} colorIdx={idx} />
              ))}
              {/* "More" card */}
              <div
                className="db-card flex flex-col items-center justify-center min-w-[200px] w-[220px] shrink-0 gap-3 cursor-pointer transition-all db-card-hover"
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
            </>
          )
        }
      </div>
    </section>
  );
}
