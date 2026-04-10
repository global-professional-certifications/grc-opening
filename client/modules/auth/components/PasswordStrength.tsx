import React from "react";

export function getPasswordStrength(password: string): number {
  if (!password) return 0;
  let s = 0;
  if (password.length >= 8) s++;
  if (/[A-Z]/.test(password)) s++;
  if (/[0-9]/.test(password)) s++;
  if (/[^A-Za-z0-9]/.test(password)) s++;
  return s;
}

const COLORS = ["", "#f87171", "#fb923c", "#00D4B2", "#00D4B2"];
const LABELS = ["", "WEAK", "FAIR", "GOOD", "STRONG"];

export function PasswordStrength({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  if (!password) return null;

  return (
    <div style={{ marginTop: 5 }}>
      <div style={{ display: "flex", gap: 3 }}>
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            style={{
              height: 3,
              flex: 1,
              borderRadius: 99,
              background: i <= strength ? COLORS[strength] : "var(--border)",
              transition: "background 0.3s ease",
            }}
          />
        ))}
      </div>
      {strength > 0 && (
        <p style={{ fontSize: "0.6rem", fontWeight: 700, color: COLORS[strength], marginTop: 3 }}>
          {LABELS[strength]} PASSWORD
        </p>
      )}
    </div>
  );
}
