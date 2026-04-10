import React from "react";

export function ProfileCompletion() {
  const ITEMS = [
    { label: "Upload primary GRC certification",       done: true },
    { label: "Set job alert preferences",              done: true },
    { label: "Add 2+ years of SOX experience details", done: false },
    { label: "Request professional reference",         done: false },
  ];

  return (
    // db-card-hover: same lift effect as other cards for consistency
    <div className="db-card p-6 shadow-md border border-transparent">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold border-l-4 pl-3" style={{ color: "var(--db-text)", borderColor: "var(--db-primary)" }}>
          Profile Completion
        </h3>
        <span className="text-sm font-bold" style={{ color: "var(--db-primary)" }}>
          72% Completed
        </span>
      </div>
      <div className="space-y-4">
        {ITEMS.map(item => (
          <div key={item.label} className={`flex items-center gap-3 ${item.done ? "" : "opacity-60"}`}>
            <span className="material-symbols-outlined text-sm"
              style={{ color: item.done ? "var(--db-primary)" : "var(--db-text-muted)" }}>
              {item.done ? "check_circle" : "circle"}
            </span>
            <span className="text-sm font-medium"
              style={{ color: item.done ? "var(--db-text-secondary)" : "var(--db-text-muted)", fontStyle: item.done ? undefined : "italic" }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
      {/* db-btn-primary: themed button */}
      <button
        className="db-btn-primary mt-6 w-full py-2.5 text-xs font-bold uppercase tracking-widest rounded-full cursor-pointer transition-all duration-200"
        style={{ background: "var(--db-primary)", color: "#ffffff", boxShadow: "0 4px 12px var(--db-primary-20)" }}
      >
        Complete Profile
      </button>
    </div>
  );
}
