import React, { useRef, useEffect, useState } from "react";
import type { ProfileFormData } from "./types";

interface FinancialInfoSectionProps {
  data: ProfileFormData;
  onChange: (updates: Partial<ProfileFormData>) => void;
}

export function FinancialInfoSection({ data, onChange }: FinancialInfoSectionProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(data.openToShareCriticalInfo ? undefined : 0);

  useEffect(() => {
    if (data.openToShareCriticalInfo && contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
      // Optional: After animation, set height to auto in case content changes
      const timeout = setTimeout(() => setHeight(undefined), 300);
      return () => clearTimeout(timeout);
    } else {
      setHeight(0);
    }
  }, [data.openToShareCriticalInfo]);

  return (
    <section className="db-card rounded-2xl p-6 lg:p-8 space-y-6" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
      <div>
        <h3 className="text-lg font-bold" style={{ color: "var(--db-text)" }}>Critical Information</h3>
        <p className="text-sm mt-1" style={{ color: "var(--db-text-muted)" }}>
          Optionally share your current compensation, expectations, and availability to help match with the right opportunities.
        </p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            type="checkbox"
            className="peer appearance-none w-5 h-5 rounded border border-[var(--db-border)] bg-[var(--db-bg)] checked:bg-[var(--db-primary)] checked:border-[var(--db-primary)] transition-all cursor-pointer focus:ring-2 focus:ring-[var(--db-primary-20)]"
            checked={data.openToShareCriticalInfo}
            onChange={(e) => onChange({ openToShareCriticalInfo: e.target.checked })}
          />
          <span className="material-symbols-outlined absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white" style={{ fontSize: 16 }}>
            check
          </span>
        </div>
        <span className="text-sm font-semibold select-none transition-colors group-hover:text-[var(--db-primary)]" style={{ color: data.openToShareCriticalInfo ? "var(--db-primary)" : "var(--db-text)" }}>
          I am open to sharing my critical information with employers
        </span>
      </label>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ height }}
      >
        <div ref={contentRef} className="pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-xl border" style={{ background: "var(--db-bg)", borderColor: "var(--db-border)" }}>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest" style={{ color: "var(--db-text-muted)" }}>
                Current CTC
              </label>
              <div className="flex w-full h-11 rounded-lg transition-colors overflow-hidden focus-within:ring-2 focus-within:ring-[var(--db-primary-20)]" style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}>
                <select
                  className="h-full px-3 text-sm font-bold bg-transparent outline-none cursor-pointer border-r"
                  style={{ color: "var(--db-text)", borderRightColor: "var(--db-border)" }}
                  value={data.ctcCurrency || "INR"}
                  onChange={(e) => onChange({ ctcCurrency: e.target.value })}
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                  <option value="SGD">SGD</option>
                  <option value="AED">AED</option>
                </select>
                <input
                  type="text"
                  className="flex-1 h-full px-3 text-sm font-medium bg-transparent outline-none"
                  style={{ color: "var(--db-text)" }}
                  placeholder="e.g., 100000"
                  value={data.currentCtc || ""}
                  onChange={(e) => onChange({ currentCtc: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest" style={{ color: "var(--db-text-muted)" }}>
                Expected CTC
              </label>
              <div className="flex w-full h-11 rounded-lg transition-colors overflow-hidden focus-within:ring-2 focus-within:ring-[var(--db-primary-20)]" style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}>
                <select
                  className="h-full px-3 text-sm font-bold bg-transparent outline-none cursor-pointer border-r"
                  style={{ color: "var(--db-text)", borderRightColor: "var(--db-border)" }}
                  value={data.ctcCurrency || "INR"}
                  onChange={(e) => onChange({ ctcCurrency: e.target.value })}
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                  <option value="SGD">SGD</option>
                  <option value="AED">AED</option>
                </select>
                <input
                  type="text"
                  className="flex-1 h-full px-3 text-sm font-medium bg-transparent outline-none"
                  style={{ color: "var(--db-text)" }}
                  placeholder="e.g., 150000"
                  value={data.expectedCtc || ""}
                  onChange={(e) => onChange({ expectedCtc: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest" style={{ color: "var(--db-text-muted)" }}>
                Notice Period
              </label>
              <select
                className="w-full h-11 px-4 rounded-lg text-sm font-medium transition-colors"
                style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
                value={data.noticePeriod || ""}
                onChange={(e) => onChange({ noticePeriod: e.target.value })}
              >
                <option value="">Select notice period</option>
                <option value="Immediate">Immediate</option>
                <option value="15 Days">15 Days</option>
                <option value="30 Days">30 Days</option>
                <option value="60 Days">60 Days</option>
                <option value="90 Days">90 Days</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest" style={{ color: "var(--db-text-muted)" }}>
                Option to Buy Back
              </label>
              <select
                className="w-full h-11 px-4 rounded-lg text-sm font-medium transition-colors"
                style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
                value={data.buybackOption || ""}
                onChange={(e) => onChange({ buybackOption: e.target.value })}
              >
                <option value="">Select option</option>
                <option value="Yes">Yes, negotiable</option>
                <option value="No">No, fixed</option>
                <option value="Not Applicable">Not Applicable</option>
              </select>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
