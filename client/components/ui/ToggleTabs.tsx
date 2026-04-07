import React from "react";

interface ToggleTabsProps {
  options: { id: string; label: string }[];
  activeId: string;
  onChange: (id: string) => void;
}

export function ToggleTabs({ options, activeId, onChange }: ToggleTabsProps) {
  return (
    <div style={{
      display: "flex",
      padding: 4,
      background: "var(--bg-toggle)",
      border: "1.5px solid var(--border)",
      borderRadius: 99,
      width: "100%",
    }}>
      {options.map(option => {
        const isActive = activeId === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            style={{
              flex: 1,
              padding: "8px 18px",
              fontSize: "0.875rem",
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              borderRadius: 99,
              border: "none",
              cursor: "pointer",
              transition: "all 0.25s ease",
              background: isActive ? "var(--brand)" : "transparent",
              color: isActive ? "#03120f" : "var(--text-secondary)",
            }}
            onMouseEnter={e => { if(!isActive) (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)"; }}
            onMouseLeave={e => { if(!isActive) (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
