import React, { useRef, useEffect, KeyboardEvent, ClipboardEvent, ChangeEvent } from "react";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export function OtpInput({ length = 6, value, onChange, disabled = false, error = false }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  // Auto-focus the first cell on mount
  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  function updateAt(index: number, char: string) {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join("").replace(/\s/g, ""));
  }

  function handleChange(index: number, e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      updateAt(index, "");
      return;
    }
    // If user typed/pasted multiple digits, fill from current cell forward
    const chars = raw.split("").slice(0, length - index);
    const next = digits.slice();
    chars.forEach((c, i) => { next[index + i] = c; });
    onChange(next.join("").replace(/\s/g, ""));
    const focusIdx = Math.min(index + chars.length, length - 1);
    refs.current[focusIdx]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        updateAt(index, "");
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
        updateAt(index - 1, "");
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, length - 1);
    refs.current[focusIdx]?.focus();
  }

  const cellBase: React.CSSProperties = {
    width: 48,
    height: 56,
    borderRadius: 10,
    border: `1.5px solid ${error ? "#f87171" : "rgba(148, 163, 184, 0.35)"}`,
    background: "var(--bg-card)",
    color: "var(--text-primary)",
    fontSize: "1.5rem",
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    textAlign: "center",
    outline: "none",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    caretColor: "transparent",
    cursor: disabled ? "not-allowed" : "text",
    opacity: disabled ? 0.55 : 1,
  };

  return (
    <div
      style={{ display: "flex", gap: 10, justifyContent: "center" }}
      role="group"
      aria-label="One-time password input"
    >
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          style={cellBase}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={e => {
            e.currentTarget.style.borderColor = error ? "#f87171" : "var(--border-focus)";
            e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? "rgba(248,113,113,0.15)" : "rgba(0,196,164,0.15)"}`;
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = error ? "#f87171" : "rgba(148, 163, 184, 0.35)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      ))}
    </div>
  );
}
