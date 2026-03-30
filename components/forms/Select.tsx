import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, id, className = "", ...props }: SelectProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <label htmlFor={id} className="grc-label">{label}</label>
      <div style={{ position: "relative" }}>
        <select
          id={id}
          className={`grc-input ${className}`}
          style={{ appearance: "none", paddingRight: 36, cursor: "pointer" }}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}
              style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>
              {opt.label}
            </option>
          ))}
        </select>
        <div style={{
          position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
          pointerEvents: "none", color: "var(--text-muted)"
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
