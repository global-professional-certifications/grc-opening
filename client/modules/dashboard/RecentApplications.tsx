import React from "react";

type Status = "shortlisted" | "submitted" | "interviewing";

const STATUS: Record<Status, { bg: string; color: string }> = {
  shortlisted:  { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" },
  submitted:    { bg: "var(--db-primary-10)", color: "var(--db-primary)" },
  interviewing: { bg: "rgba(168,85,247,0.1)", color: "#a855f7" },
};

const ROWS = [
  { title: "Lead GRC Architect",          company: "American Express", date: "2023-11-28", status: "shortlisted"  as Status },
  { title: "Data Privacy Officer",         company: "Meta",             date: "2023-11-24", status: "submitted"    as Status },
  { title: "Risk & Compliance Associate",  company: "PwC",              date: "2023-11-20", status: "interviewing" as Status },
];

export function RecentApplications() {
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
            {ROWS.map((row, i) => (
              <tr key={row.title}
                className="group"
                style={{
                  borderTop: i > 0 ? "1px solid var(--db-border)" : undefined,
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--db-table-hover)")}
                onMouseLeave={e => (e.currentTarget.style.background = "")}>
                <td className="px-6 py-4 font-medium text-sm" style={{ color: "var(--db-text)" }}>{row.title}</td>
                <td className="px-6 py-4 text-sm" style={{ color: "var(--db-text-secondary)" }}>{row.company}</td>
                <td className="px-6 py-4 text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>{row.date}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 text-[10px] font-bold rounded-full uppercase"
                    style={{ background: STATUS[row.status].bg, color: STATUS[row.status].color }}>
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button style={{ color: "var(--db-text-muted)" }}>
                    <span className="material-symbols-outlined text-lg">more_horiz</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
