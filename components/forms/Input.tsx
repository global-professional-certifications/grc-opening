import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
}

export function Input({ label, icon, error, id, className = "", ...props }: InputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <label htmlFor={id} className="grc-label">{label}</label>
      <div style={{ position: "relative" }}>
        {icon && (
          <span style={{
            position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
            color: "var(--text-muted)", display: "flex", alignItems: "center"
          }}>
            {icon}
          </span>
        )}
        <input
          id={id}
          className={`grc-input ${error ? "grc-input-error" : ""} ${className}`}
          style={{ paddingLeft: icon ? 42 : 16 }}
          {...props}
        />
      </div>
      {error && (
        <p style={{ fontSize: "0.75rem", color: "#f87171", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
