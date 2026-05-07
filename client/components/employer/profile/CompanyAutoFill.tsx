import React, { useState } from "react";
import { apiFetch } from "../../../lib/api";
import type { EmployerProfileData } from "./types";
import { SYNE, MONO } from "./shared";

interface Props {
  currentName: string;
  onApply: (data: Partial<EmployerProfileData>) => void;
}

export function CompanyAutoFill({ currentName, onApply }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Partial<EmployerProfileData> | null>(null);

  async function handleLookup() {
    if (!currentName || currentName.trim().length < 2) {
      setError("Please enter at least 2 characters of the company name first.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await apiFetch<{ success: boolean; data: any }>(
        `/company-lookup?q=${encodeURIComponent(currentName)}`
      );
      
      if (res.data) {
        setResult(res.data);
      } else {
        setError("No company details found. Please fill in manually.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to look up company details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6">
      {!result && !loading && (
        <button
          type="button"
          onClick={handleLookup}
          className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg transition-all"
          style={{
            background: "linear-gradient(135deg, var(--db-primary-20) 0%, var(--db-primary-10) 100%)",
            color: "var(--db-primary)",
            border: "1px dashed var(--db-primary-40)",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            auto_awesome
          </span>
          Auto-fill details
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-3 text-sm" style={{ color: "var(--db-primary)" }}>
          <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          Searching public databases for {currentName}...
        </div>
      )}

      {error && (
        <div className="text-sm px-4 py-3 rounded-lg" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", ...MONO }}>
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-xl overflow-hidden mt-2" style={{ border: "1px solid var(--db-primary-40)", background: "var(--db-primary-10)" }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "var(--db-primary-20)" }}>
            <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--db-text)", ...SYNE }}>
              <span className="material-symbols-outlined text-green-500" style={{ fontSize: 18 }}>check_circle</span>
              Found Company Details
            </h4>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3 text-xs" style={{ color: "var(--db-text-secondary)" }}>
            {result.industry && <div><strong className="block text-[10px] uppercase tracking-wider mb-1" style={MONO}>Industry</strong>{result.industry}</div>}
            {result.companySize && <div><strong className="block text-[10px] uppercase tracking-wider mb-1" style={MONO}>Size</strong>{result.companySize} employees</div>}
            {result.foundedYear && <div><strong className="block text-[10px] uppercase tracking-wider mb-1" style={MONO}>Founded</strong>{result.foundedYear}</div>}
            {result.website && <div className="col-span-2"><strong className="block text-[10px] uppercase tracking-wider mb-1" style={MONO}>Website</strong>{result.website}</div>}
            {result.address && <div className="col-span-2"><strong className="block text-[10px] uppercase tracking-wider mb-1" style={MONO}>Location</strong>{[result.address, result.city, result.state, result.country].filter(Boolean).join(", ")}</div>}
          </div>
          <div className="px-4 py-3 bg-white/50 flex items-center justify-end gap-3 border-t" style={{ borderColor: "var(--db-primary-20)" }}>
            <button
              onClick={() => setResult(null)}
              className="text-xs font-semibold px-3 py-1.5 rounded"
              style={{ color: "var(--db-text-muted)" }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onApply(result);
                setResult(null); // hide after apply
              }}
              className="text-xs font-bold px-4 py-1.5 rounded-lg shadow-sm"
              style={{ background: "var(--db-primary)", color: "var(--db-primary-text)" }}
            >
              Apply to Form
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
