import React, { useCallback, useEffect, useState } from "react";

export const MONO = { fontFamily: "'JetBrains Mono', monospace" };
export const SYNE = { fontFamily: "'Poppins', sans-serif" };

export const BASE_INPUT: React.CSSProperties = {
  width: "100%",
  background: "var(--db-surface)",
  border: "1.5px solid var(--db-border)",
  borderRadius: 8,
  padding: "8px 12px",
  color: "var(--db-text)",
  fontSize: "0.875rem",
  outline: "none",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  fontFamily: "'Poppins', sans-serif",
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

const DROPDOWN_HEIGHT_PX = 260;

function resolveDropUp(container: HTMLDivElement | null): boolean {
  if (!container) return false;
  const rect = container.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  return spaceBelow < DROPDOWN_HEIGHT_PX && spaceAbove > spaceBelow;
}

function useDropdownLifecycle({
  containerRef,
  isOpen,
  setDropUp,
  closeDropdown,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  setDropUp: React.Dispatch<React.SetStateAction<boolean>>;
  closeDropdown: () => void;
}) {
  const recalculateDropDirection = useCallback(() => {
    setDropUp(resolveDropUp(containerRef.current));
  }, [containerRef, setDropUp]);

  useEffect(() => {
    if (!isOpen) return;
    recalculateDropDirection();

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!containerRef.current?.contains(target)) {
        closeDropdown();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!containerRef.current?.contains(target)) {
        closeDropdown();
      }
    };

    const handleScroll = (event: Event) => {
      const target = event.target;
      if (target instanceof Node && containerRef.current?.contains(target)) {
        // Keep the dropdown open while scrolling inside it, but update direction.
        recalculateDropDirection();
        return;
      }
      closeDropdown();
    };

    const handleResize = () => recalculateDropDirection();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [closeDropdown, containerRef, isOpen, recalculateDropDirection]);

  return recalculateDropDirection;
}

// Section card wrapper
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
      className="db-card rounded-2xl p-6 space-y-5"
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

// Text input field
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

// Select field
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
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const closeDropdown = useCallback(() => setIsOpen(false), []);
  const recalculateDropDirection = useDropdownLifecycle({
    containerRef,
    isOpen,
    setDropUp,
    closeDropdown,
  });
  
  const allOptions = options.map((o) => (typeof o === "string" ? { label: o, value: o } : o));
  const selectedLabel = allOptions.find((o) => o.value === value)?.label || placeholder || "Select...";

  const toggleDropdown = () => {
    if (disabled) return;
    if (!isOpen) {
      recalculateDropDirection();
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <div className={`relative ${colSpan ? "col-span-2" : ""}`} ref={containerRef}>
      <label htmlFor={id} style={LABEL_STYLE}>
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </label>
      <div className="relative">
        <button
          type="button"
          id={id}
          disabled={disabled}
          onClick={toggleDropdown}
          className="group"
          style={{
            ...BASE_INPUT,
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderColor: error ? "#ef4444" : isOpen ? "var(--db-primary)" : "var(--db-border)",
            boxShadow: isOpen ? (error ? "0 0 0 3px rgba(239, 68, 68, 0.1)" : "0 0 0 3px var(--db-primary-10)") : "none",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
            paddingRight: "12px",
          }}
        >
          <span className={`truncate ${!value ? "text-gray-400" : "text-[var(--db-text)]"}`}>
            {selectedLabel}
          </span>
          <span 
            className="material-symbols-outlined text-[20px] text-gray-400 transition-transform duration-200"
            style={{ transform: `rotate(${isOpen ? "180deg" : "0deg"})` }}
          >
            expand_more
          </span>
        </button>

        {isOpen && !disabled && (
          <div 
            className={`absolute left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] z-50 max-h-[240px] overflow-y-auto p-1.5 animate-in fade-in duration-200 ${dropUp ? "bottom-[calc(100%+8px)] slide-in-from-bottom-2" : "mt-1.5 top-full slide-in-from-top-2"}`}
          >
            {allOptions.length > 0 ? (
              allOptions.map((opt) => (
                <div
                  key={opt.value}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent blur before selection
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`
                    px-3 py-2 text-[13.5px] font-medium rounded-lg cursor-pointer transition-colors mb-0.5 last:mb-0
                    ${value === opt.value ? "bg-[#3a1292] text-white" : "text-gray-700 hover:bg-gray-50"}
                  `}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-xs text-gray-400 font-medium">
                No options available
              </div>
            )}
          </div>
        )}
      </div>
      {error && (
        <p className="text-[10px] mt-1.5" style={{ ...MONO, color: "#ef4444" }}>
          {error}
        </p>
      )}
    </div>
  );
}

// Textarea field
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
  const [dropUp, setDropUp] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const closeDropdown = useCallback(() => setIsOpen(false), []);
  const recalculateDropDirection = useDropdownLifecycle({
    containerRef,
    isOpen,
    setDropUp,
    closeDropdown,
  });

  // Sync searchTerm when value changes externally
  React.useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  const allOptions = options.map((o) => (typeof o === "string" ? { label: o, value: o } : o));
  
  const selectedLabel = allOptions.find((o) => o.value === value)?.label || "";
  const isDefaultTerm = searchTerm === selectedLabel;

  const filteredOptions = (searchTerm && !isDefaultTerm)
    ? allOptions.filter((o) => o.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : allOptions;

  const handleSelect = (val: string) => {
    onChange(val);
    setSearchTerm(val);
    closeDropdown();
  };

  const handleInputChange = (v: string) => {
    setSearchTerm(v);
    onChange(v);
    if (!isOpen) {
      recalculateDropDirection();
      setIsOpen(true);
    }
  };

  const handleFocus = () => {
    recalculateDropDirection();
    setFocused(true);
    setIsOpen(true);
  };

  return (
    <div className={`relative ${colSpan ? "col-span-2" : ""}`} ref={containerRef}>
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
          onFocus={handleFocus}
          onBlur={() => setFocused(false)}
          onChange={(e) => handleInputChange(e.target.value)}
          style={{
            ...BASE_INPUT,
            paddingRight: 36,
            borderColor: error ? "#ef4444" : focused ? "var(--db-primary)" : "var(--db-border)",
            boxShadow: focused ? (error ? "0 0 0 3px rgba(239, 68, 68, 0.1)" : "0 0 0 3px var(--db-primary-10)") : "none",
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? "not-allowed" : undefined,
          }}
        />
        
        <span 
            className="material-symbols-outlined absolute right-3 top-1/2 text-[20px] text-gray-400 pointer-events-none transition-transform duration-200"
            style={{ 
              transform: `translateY(-50%) rotate(${isOpen ? "180deg" : "0deg"})`,
              zIndex: 10
            }}
        >
          expand_more
        </span>

        {isOpen && !disabled && (filteredOptions.length > 0) && (
          <div 
            className={`absolute left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] z-50 max-h-[240px] overflow-y-auto overflow-x-hidden p-1.5 animate-in fade-in duration-200 ${dropUp ? "bottom-[calc(100%+8px)] slide-in-from-bottom-2" : "mt-1.5 top-full slide-in-from-top-2"}`}
          >
            {filteredOptions.map((opt) => (
              <div
                key={opt.value}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent blur before selection
                  handleSelect(opt.value);
                }}
                className={`
                  px-3 py-1.5 text-[13.5px] font-medium rounded-lg cursor-pointer transition-colors
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

// Toggle switch
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
