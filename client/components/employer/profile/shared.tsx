import React, { useState } from "react";

export const MONO = { fontFamily: "'JetBrains Mono', monospace" };
export const SYNE = { fontFamily: "'Syne', sans-serif" };

export const BASE_INPUT: React.CSSProperties = {
  width: "100%",
  background: "var(--db-surface)",
  border: "1.5px solid var(--db-border)",
  borderRadius: 8,
  padding: "10px 14px",
  color: "var(--db-text)",
  fontSize: "0.875rem",
  outline: "none",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  fontFamily: "'Manrope', sans-serif",
};

export const LABEL_STYLE: React.CSSProperties = {
  fontSize: "0.625rem",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--db-text-muted)",
  marginBottom: 6,
  display: "block",
  ...MONO,
};

// ΓöÇΓöÇ Section card wrapper ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export function SectionCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="db-card db-card-hover rounded-2xl p-6 space-y-5"
      style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
    >
      <div className="flex items-center gap-2">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: "var(--db-primary)" }}
        >
          {icon}
        </span>
        <h3
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ ...MONO, color: "var(--db-text-muted)" }}
        >
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

// ΓöÇΓöÇ Text input field ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  colSpan,
  disabled,
  hint,
  error,
  id,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  colSpan?: boolean;
  disabled?: boolean;
  hint?: string;
  error?: string;
  id?: string;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className={colSpan ? "col-span-2" : ""}>
      <label htmlFor={id} style={LABEL_STYLE}>
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...BASE_INPUT,
          borderColor: error ? "#ef4444" : focused ? "var(--db-primary)" : "var(--db-border)",
          boxShadow: focused ? (error ? "0 0 0 3px rgba(239, 68, 68, 0.1)" : "0 0 0 3px var(--db-primary-10)") : "none",
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? "not-allowed" : undefined,
        }}
      />
      {error && (
        <p className="text-[10px] mt-1.5" style={{ ...MONO, color: "#ef4444" }}>
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="text-[10px] mt-1.5" style={{ ...MONO, color: "var(--db-text-muted)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

// ΓöÇΓöÇ Select field ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  colSpan,
  error,
  id,
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[] | string[];
  placeholder?: string;
  colSpan?: boolean;
  error?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className={colSpan ? "col-span-2" : ""}>
      <label htmlFor={id} style={LABEL_STYLE}>
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...BASE_INPUT,
          borderColor: error ? "#ef4444" : focused ? "var(--db-primary)" : "var(--db-border)",
          boxShadow: focused ? (error ? "0 0 0 3px rgba(239, 68, 68, 0.1)" : "0 0 0 3px var(--db-primary-10)") : "none",
          cursor: disabled ? "not-allowed" : "pointer",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 14px center",
          paddingRight: 36,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => {
          const val = typeof o === "string" ? o : o.value;
          const lbl = typeof o === "string" ? o : o.label;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
      {error && (
        <p className="text-[10px] mt-1.5" style={{ ...MONO, color: "#ef4444" }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ΓöÇΓöÇ Textarea field ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  maxChars,
  colSpan,
  error,
  id,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  maxChars?: number;
  colSpan?: boolean;
  error?: string;
  id?: string;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const overLimit = maxChars !== undefined && value.length > maxChars * 0.9;
  return (
    <div className={colSpan ? "col-span-2" : ""}>
      <label htmlFor={id} style={LABEL_STYLE}>
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </label>
      <textarea
        id={id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => {
          if (maxChars === undefined || e.target.value.length <= maxChars) {
            onChange(e.target.value);
          }
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...BASE_INPUT,
          borderColor: error ? "#ef4444" : focused ? "var(--db-primary)" : "var(--db-border)",
          boxShadow: focused ? (error ? "0 0 0 3px rgba(239, 68, 68, 0.1)" : "0 0 0 3px var(--db-primary-10)") : "none",
          resize: "vertical",
          lineHeight: 1.65,
        }}
      />
      {error && (
        <p className="text-[10px] mt-1.5" style={{ ...MONO, color: "#ef4444" }}>
          {error}
        </p>
      )}
      {maxChars !== undefined && (
        <p
          className="text-right text-[10px] mt-1.5"
          style={{ ...MONO, color: overLimit ? "var(--db-primary)" : "var(--db-text-muted)" }}
        >
          {value.length} / {maxChars}
        </p>
      )}
    </div>
  );
}

// ─── Combobox / Autocomplete Field ──────────────────────────────────────────
export function ComboboxField({
  label,
  value,
  onChange,
  options,
  placeholder,
  colSpan,
  error,
  id,
  required,
  disabled,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[] | string[];
  placeholder?: string;
  colSpan?: boolean;
  error?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);

  // Sync searchTerm when value changes externally
  React.useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  const allOptions = options.map((o) => (typeof o === "string" ? { label: o, value: o } : o));
  const filteredOptions = searchTerm
    ? allOptions.filter((o) => o.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : allOptions;

  const handleSelect = (val: string) => {
    onChange(val);
    setSearchTerm(val);
    setIsOpen(false);
  };

  const handleInputChange = (v: string) => {
    setSearchTerm(v);
    onChange(v);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div className={`relative ${colSpan ? "col-span-2" : ""}`}>
      <label htmlFor={id} style={LABEL_STYLE}>
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </label>
      
      <div className="relative">
        <input
          id={id}
          type="text"
          value={searchTerm}
          disabled={disabled}
          autoComplete="off"
          placeholder={placeholder}
          onFocus={() => {
            setFocused(true);
            setIsOpen(true);
          }}
          onBlur={() => {
            setFocused(false);
            // Delay closing to allow clicking options
            setTimeout(() => setIsOpen(false), 200);
          }}
          onChange={(e) => handleInputChange(e.target.value)}
          style={{
            ...BASE_INPUT,
            borderColor: error ? "#ef4444" : focused ? "var(--db-primary)" : "var(--db-border)",
            boxShadow: focused ? (error ? "0 0 0 3px rgba(239, 68, 68, 0.1)" : "0 0 0 3px var(--db-primary-10)") : "none",
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? "not-allowed" : undefined,
          }}
        />
        
        <span 
          className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-gray-400 pointer-events-none transition-transform duration-200"
          style={{ transform: `translateY(-50%) rotate(${isOpen ? '180deg' : '0deg'})` }}
        >
          expand_more
        </span>

        {isOpen && !disabled && (filteredOptions.length > 0) && (
          <div 
            className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] z-[100] max-h-[220px] overflow-y-auto overflow-x-hidden p-1.5 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            {filteredOptions.map((opt) => (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`
                  px-3 py-2 text-[13.5px] font-medium rounded-lg cursor-pointer transition-colors
                  ${value === opt.value ? "bg-[#3a1292] text-white" : "text-gray-700 hover:bg-gray-50"}
                `}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-[10px] mt-1.5" style={{ ...MONO, color: "#ef4444" }}>
          {error}
        </p>
      ) : hint ? (
        <p className="text-[10px] mt-1.5" style={{ ...MONO, color: "var(--db-text-muted)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

// ΓöÇΓöÇ Toggle switch ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex items-center flex-shrink-0 rounded-full transition-colors duration-200"
      style={{
        width: 40,
        height: 22,
        background: checked ? "var(--db-primary)" : "var(--db-border)",
        boxShadow: checked ? "0 0 8px var(--db-primary-40)" : "none",
        border: "none",
        cursor: "pointer",
        outline: "none",
      }}
    >
      <span
        className="inline-block rounded-full transition-transform duration-200"
        style={{
          width: 16,
          height: 16,
          background: "#fff",
          transform: checked ? "translateX(20px)" : "translateX(3px)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}
