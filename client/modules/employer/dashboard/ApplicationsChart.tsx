import React from "react";

const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const SYNE = { fontFamily: "'Syne', sans-serif" };

// Daily application counts across Oct 1ΓÇô31
const DATA = [
  { day: "01", week: "OCT 01", value: 4  },
  { day: "02", week: "",       value: 6  },
  { day: "03", week: "",       value: 5  },
  { day: "04", week: "",       value: 8  },
  { day: "05", week: "",       value: 7  },
  { day: "06", week: "",       value: 3  },
  { day: "07", week: "",       value: 5  },
  { day: "08", week: "OCT 08", value: 9  },
  { day: "09", week: "",       value: 11 },
  { day: "10", week: "",       value: 8  },
  { day: "11", week: "",       value: 13 },
  { day: "12", week: "",       value: 10 },
  { day: "13", week: "",       value: 7  },
  { day: "14", week: "",       value: 9  },
  { day: "15", week: "OCT 15", value: 15 },
  { day: "16", week: "",       value: 18 },
  { day: "17", week: "",       value: 14 },
  { day: "18", week: "",       value: 20 },
  { day: "19", week: "",       value: 17 },
  { day: "20", week: "",       value: 12 },
  { day: "21", week: "",       value: 14 },
  { day: "22", week: "OCT 22", value: 22 },
  { day: "23", week: "",       value: 19 },
  { day: "24", week: "",       value: 25 },
  { day: "25", week: "",       value: 21 },
  { day: "26", week: "",       value: 18 },
  { day: "27", week: "",       value: 16 },
  { day: "28", week: "",       value: 13 },
  { day: "29", week: "OCT 29", value: 11 },
  { day: "30", week: "",       value: 8  },
];

const WEEK_LABELS = ["OCT 01", "OCT 08", "OCT 15", "OCT 22", "OCT 29"];
const PEAK = 25; // max value for scaling

export function ApplicationsChart() {
  return (
    <div className="db-card p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold" style={{ ...SYNE, color: "var(--db-text)" }}>
            Applications Over Time
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--db-text-muted)" }}>
            Daily volume across all job listings
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: "var(--db-surface)", color: "var(--db-text-secondary)", ...MONO }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>calendar_month</span>
          OCT 2023
        </div>
      </div>

      {/* Chart area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Y-axis labels + bars */}
        <div className="flex gap-2 flex-1">
          {/* Y labels */}
          <div
            className="flex flex-col justify-between text-right pr-2 pb-6 flex-shrink-0"
            style={{ ...MONO }}
          >
            {[25, 20, 15, 10, 5, 0].map((v) => (
              <span key={v} className="text-[9px] leading-none" style={{ color: "var(--db-text-muted)" }}>
                {v}
              </span>
            ))}
          </div>

          {/* Bars + x-axis wrapper */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Horizontal grid lines + bars */}
            <div className="flex-1 relative">
              {/* Grid lines */}
              {[0, 20, 40, 60, 80, 100].map((pct) => (
                <div
                  key={pct}
                  className="absolute left-0 right-0"
                  style={{
                    top: `${pct}%`,
                    height: 1,
                    background: "var(--db-border)",
                    opacity: 0.5,
                  }}
                />
              ))}

              {/* Bars */}
              <div className="absolute inset-0 flex items-end gap-[2px] px-1">
                {DATA.map((d, i) => {
                  const heightPct = (d.value / PEAK) * 100;
                  const isPeak = d.value === PEAK;
                  const isRecent = i >= DATA.length - 7;
                  return (
                    <div
                      key={d.day}
                      className="flex-1 rounded-t group relative"
                      style={{
                        height: `${heightPct}%`,
                        minHeight: 3,
                        background: isPeak
                          ? "var(--db-primary)"
                          : isRecent
                          ? "var(--db-primary-40)"
                          : "var(--db-primary-20)",
                        boxShadow: isPeak ? "0 0 10px var(--db-primary-40)" : undefined,
                        transition: "filter 0.15s ease",
                      }}
                      title={`Oct ${d.day}: ${d.value} applications`}
                    >
                      {/* Tooltip on hover */}
                      <div
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded text-[9px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity"
                        style={{
                          background: "var(--db-card)",
                          border: "1px solid var(--db-border)",
                          color: "var(--db-text)",
                          ...MONO,
                        }}
                      >
                        {d.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* X-axis week labels */}
            <div className="flex justify-between mt-3 px-1">
              {WEEK_LABELS.map((label) => (
                <span
                  key={label}
                  className="text-[9px] uppercase"
                  style={{ ...MONO, color: "var(--db-text-muted)" }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: "1px solid var(--db-border)" }}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ background: "var(--db-primary)" }} />
          <span className="text-[10px]" style={{ ...MONO, color: "var(--db-text-muted)" }}>Peak day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ background: "var(--db-primary-20)" }} />
          <span className="text-[10px]" style={{ ...MONO, color: "var(--db-text-muted)" }}>Other days</span>
        </div>
        <div className="ml-auto text-xs font-semibold" style={{ color: "var(--db-primary)", ...MONO }}>
          ╬ú 398 total
        </div>
      </div>
    </div>
  );
}
