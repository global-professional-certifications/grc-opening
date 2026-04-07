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
    <div className="db-card db-card-hover p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold" style={{ fontFamily: "'Syne', sans-serif", color: "var(--db-text)" }}>
          Profile Completion
        </h3>
        <span className="text-sm font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--db-primary)" }}>
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
            <span className="text-sm"
              style={{ color: item.done ? "var(--db-text-secondary)" : "var(--db-text-muted)", fontStyle: item.done ? undefined : "italic" }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
      {/* db-btn-secondary: scale-up on hover, darker bg */}
      <button
        className="db-btn-secondary mt-6 w-full py-2 text-xs font-bold uppercase tracking-widest rounded-full"
        style={{ background: "var(--db-btn-sec)", color: "var(--db-text-secondary)", border: "1px solid var(--db-border)" }}
      >
        Complete Profile
      </button>
    </div>
  );
}
