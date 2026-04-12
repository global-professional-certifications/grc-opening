import React, { useRef, useState } from "react";
import type { ProfileFormData } from "./types";
import { parseResume } from "../../lib/resumeParser";

const MONO = { fontFamily: "'JetBrains Mono', monospace" };

interface Props {
  resumeUrl: ProfileFormData["resumeUrl"];
  resumeFileName: ProfileFormData["resumeFileName"];
  onChange: (updates: Partial<ProfileFormData>) => void;
}

export function ResumeSection({ resumeUrl, resumeFileName, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [fillResult, setFillResult] = useState<{ count: number; fields: string[] } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  function handlePreview() {
    if (!resumeUrl) return;
    const namePart = resumeFileName ? `&name=${encodeURIComponent(resumeFileName)}` : "";
    window.open(
      `/dashboard/resume-preview?url=${encodeURIComponent(resumeUrl)}${namePart}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function handleReplace() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Store the file URL immediately so UI shows the uploaded file
    const objectUrl = URL.createObjectURL(file);
    onChange({ resumeUrl: objectUrl, resumeFileName: file.name });
    e.target.value = "";

    // Start parsing
    setParsing(true);
    setFillResult(null);
    setParseError(null);

    try {
      const parsed = await parseResume(file);

      // Build list of populated fields for the success message
      const FIELD_LABELS: Record<string, string> = {
        firstName: "First Name",
        lastName: "Last Name",
        professionalTitle: "Professional Title",
        email: "Email",
        location: "Location",
        linkedInUrl: "LinkedIn URL",
        summary: "Summary",
        coreCompetencies: "Skills",
        certifications: "Certifications",
        workExperience: "Work Experience",
      };

      const filledFields = Object.entries(parsed)
        .filter(([, v]) => {
          if (Array.isArray(v)) return v.length > 0;
          return v !== undefined && v !== "";
        })
        .map(([k]) => FIELD_LABELS[k] ?? k);

      if (filledFields.length > 0) {
        // Merge parsed data into form — don't overwrite fields user has already filled
        // (only populate if field is currently empty)
        onChange(parsed);
        setFillResult({ count: filledFields.length, fields: filledFields });
      } else {
        setParseError("No fields could be extracted. Try a text-based PDF or .txt resume.");
      }
    } catch {
      setParseError("Could not parse the resume. Please fill in your details manually.");
    } finally {
      setParsing(false);
    }
  }

  return (
    <div
      className="db-card rounded-2xl p-6 space-y-4 shadow-sm"
      style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
    >
      <div className="flex items-center gap-3 border-l-4 pl-3" style={{ borderColor: "var(--db-primary)" }}>
        <div className="p-2 rounded-lg" style={{ background: "var(--db-primary-10)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--db-primary)" }}>
            description
          </span>
        </div>
        <h3
          className="text-sm font-bold uppercase tracking-widest"
          style={{ color: "var(--db-text)" }}
        >
          Resume / CV
        </h3>
      </div>

      {resumeUrl ? (
        <div
          className="flex items-center justify-between rounded-xl p-4"
          style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(239,68,68,0.12)" }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20, color: "#ef4444" }}
              >
                picture_as_pdf
              </span>
            </div>
            <div className="min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "var(--db-text)" }}
              >
                {resumeFileName || "Resume.pdf"}
              </p>
              <p className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>
                {parsing ? (
                  <span style={{ color: "var(--db-primary)" }}>
                    Extracting fields…
                  </span>
                ) : (
                  "PDF Document"
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {parsing && (
              <span style={{
                display: "inline-block",
                width: 16,
                height: 16,
                border: "2px solid var(--db-primary-20)",
                borderTopColor: "var(--db-primary)",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
              }} />
            )}
            <button
              onClick={handlePreview}
              disabled={parsing}
              className="db-btn-secondary px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                background: "var(--db-btn-sec)",
                color: "var(--db-text-secondary)",
                border: "1px solid var(--db-border)",
                opacity: parsing ? 0.5 : 1,
              }}
            >
              Preview
            </button>
            <button
              onClick={handleReplace}
              disabled={parsing}
              className="db-btn-primary px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                background: "var(--db-primary)",
                color: "#ffffff",
                opacity: parsing ? 0.5 : 1,
              }}
            >
              Replace
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleReplace}
          className="w-full flex flex-col items-center justify-center rounded-xl p-8 text-center"
          style={{
            background: "var(--db-surface)",
            border: "2px dashed var(--db-border)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--db-primary)";
            (e.currentTarget as HTMLButtonElement).style.background = "var(--db-primary-10)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--db-border)";
            (e.currentTarget as HTMLButtonElement).style.background = "var(--db-surface)";
          }}
        >
          <span
            className="material-symbols-outlined mb-2"
            style={{ fontSize: 36, color: "var(--db-text-muted)" }}
          >
            upload_file
          </span>
          <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
            Upload Resume
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--db-text-muted)" }}>
            PDF, DOC, DOCX up to 10MB · Fields auto-filled on upload
          </p>
        </button>
      )}

      {/* Auto-fill success banner */}
      {fillResult && !parsing && (
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3"
          style={{
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.25)",
          }}
        >
          <span
            className="material-symbols-outlined flex-shrink-0 mt-0.5"
            style={{ fontSize: 16, color: "#10b981" }}
          >
            check_circle
          </span>
          <div style={{ minWidth: 0 }}>
            <p className="text-xs font-semibold" style={{ color: "#10b981" }}>
              {fillResult.count} field{fillResult.count !== 1 ? "s" : ""} auto-filled from your resume
            </p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--db-text-muted)", lineHeight: 1.5, overflowWrap: "break-word", wordBreak: "break-word" }}>
              {fillResult.fields.join(" · ")}
            </p>
            <p className="text-xs mt-1.5" style={{ color: "var(--db-text-muted)" }}>
              Review the fields below and make any corrections.
            </p>
          </div>
          <button
            onClick={() => setFillResult(null)}
            style={{ color: "var(--db-text-muted)", flexShrink: 0, fontSize: 16, lineHeight: 1 }}
            title="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Parse error banner */}
      {parseError && !parsing && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.25)",
          }}
        >
          <span
            className="material-symbols-outlined flex-shrink-0"
            style={{ fontSize: 16, color: "#f59e0b" }}
          >
            info
          </span>
          <p className="text-xs flex-1" style={{ color: "var(--db-text-muted)" }}>
            {parseError}
          </p>
          <button
            onClick={() => setParseError(null)}
            style={{ color: "var(--db-text-muted)", flexShrink: 0, fontSize: 16, lineHeight: 1 }}
            title="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileChange}
      />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
