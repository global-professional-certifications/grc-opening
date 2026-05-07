import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Status = "PENDING" | "REVIEWING" | "SHORTLISTED" | "INTERVIEWING" | "REJECTED" | "HIRED";

const STATUS: Record<Status, { bg: string; color: string; label: string }> = {
  PENDING:      { bg: "var(--db-primary-10)", color: "var(--db-primary)", label: "Submitted" },
  REVIEWING:    { bg: "rgba(59,130,246,0.1)", color: "#3b82f6", label: "Reviewing" },
  SHORTLISTED:  { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", label: "Shortlisted" },
  INTERVIEWING: { bg: "rgba(168,85,247,0.1)", color: "#a855f7", label: "Interviewing" },
  REJECTED:     { bg: "rgba(239,68,68,0.1)", color: "#ef4444", label: "Rejected" },
  HIRED:        { bg: "rgba(34,197,94,0.1)", color: "#22c55e", label: "Hired" },
};

type ApplicationData = {
  id: string;
  appliedAt: string;
  status: Status;
  job: {
    title: string;
    employer: {
      companyName: string;
    }
  }
};

export function RecentApplications() {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiFetch<{ applications: ApplicationData[] }>('/applications/me')
      .then((res) => {
        if (mounted) {
          setApplications(res.applications);
        }
      })
      .catch((err) => {
        console.error("Error fetching recent applications:", err);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  return (
    <section className="db-card overflow-hidden">
      <div className="p-6 flex justify-between items-center" style={{ borderBottom: "1px solid var(--db-border)" }}>
        <h3 className="text-lg font-bold border-l-4 pl-3" style={{ color: "var(--db-text)", borderColor: "var(--db-primary)" }}>
          Recent Applications
        </h3>
        <span className="text-xs font-semibold" style={{ color: "var(--db-text-muted)" }}>Live Updates</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr style={{ background: "var(--db-table-head)" }}>
              {["Job Title","Company","Date Applied","Status","Action"].map(h => (
                <th key={h} className="px-6 py-4 text-[10px] uppercase font-bold tracking-widest"
                  style={{ color: "var(--db-text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm" style={{ color: "var(--db-text-muted)" }}>
                  Loading applications...
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm" style={{ color: "var(--db-text-muted)" }}>
                  No applications found.
                </td>
              </tr>
            ) : applications.map((app, i) => {
              const statusConfig = STATUS[app.status] || STATUS.PENDING;
              return (
                <tr key={app.id}
                  className="group"
                  style={{
                    borderTop: i > 0 ? "1px solid var(--db-border)" : undefined,
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--db-table-hover)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}>
                  <td className="px-6 py-4 font-medium text-sm" style={{ color: "var(--db-text)" }}>{app.job.title}</td>
                  <td className="px-6 py-4 text-sm" style={{ color: "var(--db-text-secondary)" }}>{app.job.employer.companyName}</td>
                  <td className="px-6 py-4 text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>
                    {new Date(app.appliedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-[10px] font-bold rounded-full uppercase"
                      style={{ background: statusConfig.bg, color: statusConfig.color }}>
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button style={{ color: "var(--db-text-muted)" }}>
                      <span className="material-symbols-outlined text-lg">more_horiz</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

