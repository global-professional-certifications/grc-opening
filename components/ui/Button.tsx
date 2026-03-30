import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline";
  fullWidth?: boolean;
}

export function Button({ children, variant = "primary", fullWidth = false, style = {}, ...props }: ButtonProps) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    fontSize: "0.9rem",
    borderRadius: 99,
    padding: "11px 24px",
    border: "1.5px solid transparent",
    cursor: "pointer",
    transition: "all 0.2s ease",
    width: fullWidth ? "100%" : undefined,
    letterSpacing: "0.01em",
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: "var(--brand)",
      color: "#03120f",
      borderColor: "var(--brand)",
    },
    outline: {
      background: "transparent",
      color: "var(--text-primary)",
      borderColor: "var(--border)",
    },
  };

  return (
    <button
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => {
        const el = e.currentTarget;
        if (variant === "primary") { el.style.filter = "brightness(1.1)"; el.style.transform = "translateY(-1px)"; }
        else { el.style.borderColor = "var(--brand)"; el.style.color = "var(--brand)"; }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget;
        el.style.filter = ""; el.style.transform = ""; el.style.borderColor = variants[variant].borderColor as string;
        el.style.color = variants[variant].color as string;
      }}
      {...props}
    >
      {children}
    </button>
  );
}
