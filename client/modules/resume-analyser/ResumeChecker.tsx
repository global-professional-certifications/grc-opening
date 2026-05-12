import React, { useState, useRef, useCallback } from "react";
import { CheckerResults } from "./CheckerResults";
import type { CheckerResult } from "./CheckerResults";
import type { EnhancedResume } from "./ResumeAnalyser";

interface ResumeCheckerProps {
  isPublic?: boolean;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function ResumeChecker({ isPublic = false }: ResumeCheckerProps) {
  const [file, setFile]           = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult]       = useState<CheckerResult | null>(null);
  const [enhancedData, setEnhancedData] = useState<EnhancedResume | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [progress, setProgress]   = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Drag & Drop ────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && ACCEPTED_TYPES.includes(dropped.type)) {
      setFile(dropped);
      setError(null);
    } else {
      setError("Unsupported file type. Please upload a PDF, DOCX, or TXT file.");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleCheck = async () => {
    if (!file) { setError("Please upload a resume file."); return; }

    setIsChecking(true);
    setError(null);
    setResult(null);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 92) return prev;
        const inc = prev < 30 ? 3 : prev < 60 ? 2 : prev < 80 ? 1 : 0.5;
        return Math.min(prev + inc, 92);
      });
    }, 800);

    try {
      const endpoint = isPublic
        ? `${BASE_URL}/resume-checker/public/check`
        : `${BASE_URL}/resume-checker/check`;

      const formData = new FormData();
      formData.append("resume", file);

      const headers: Record<string, string> = {};
      if (!isPublic) {
        const token = localStorage.getItem("grc_local_token");
        if (token) headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        headers,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Check failed (${response.status})`);
      }

      const data = await response.json();
      setProgress(100);
      await new Promise(r => setTimeout(r, 400));
      setResult(data.data);
      if (data.enhanced) setEnhancedData(data.enhanced);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setEnhancedData(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Results view ───────────────────────────────────────────
  if (result) {
    return (
      <div className="ra-container">
        <CheckerResults data={result} onReset={handleReset} enhancedData={enhancedData} />
      </div>
    );
  }

  // ── Upload view ────────────────────────────────────────────
  return (
    <div className="ra-container">
      {/* Upload Zone */}
      <div
        className={`ra-dropzone ${isDragging ? "ra-dropzone--active" : ""} ${file ? "ra-dropzone--has-file" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload resume file"
        onKeyDown={(e) => e.key === "Enter" && !file && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileSelect}
          style={{ display: "none" }}
          aria-hidden="true"
        />

        {file ? (
          <div className="ra-file-info">
            <div className="ra-file-icon">
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: "var(--db-primary)" }} aria-hidden="true">description</span>
            </div>
            <div className="ra-file-details">
              <p className="ra-file-name">{file.name}</p>
              <p className="ra-file-size">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              className="ra-file-remove"
              onClick={(e) => { e.stopPropagation(); removeFile(); }}
              title="Remove file"
              type="button"
              aria-label="Remove file"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">close</span>
            </button>
          </div>
        ) : (
          <div className="ra-dropzone-content">
            <div className="ra-dropzone-icon-ring">
              <span className="material-symbols-outlined" style={{ fontSize: 36 }} aria-hidden="true">upload_file</span>
            </div>
            <p className="ra-dropzone-text">
              <strong>Drop your resume here</strong> or click to browse
            </p>
            <p className="ra-dropzone-hint">PDF, DOCX, TXT · Max 5 MB</p>
          </div>
        )}
      </div>

      {/* What gets checked */}
      <div
        className="rounded-xl p-4 flex flex-col gap-2"
        style={{ background: "var(--db-primary-10)", border: "1px solid var(--db-primary-20)" }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--db-primary)" }}>
          What gets checked
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          {[
            { icon: "spellcheck",    label: "Typos & Grammar"       },
            { icon: "link",          label: "Hyperlink Validation"   },
            { icon: "psychology",    label: "Ambiguity Detection"    },
            { icon: "view_list",     label: "Section Structure"      },
            { icon: "lightbulb",     label: "Actionable Tips"        },
            { icon: "score",         label: "Per-Category Scores"    },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--db-primary)" }} aria-hidden="true">{icon}</span>
              <span className="text-xs" style={{ color: "var(--db-text-secondary)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="ra-error" role="alert">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">error</span>
          {error}
        </div>
      )}

      {/* Progress / Submit */}
      {isChecking ? (
        <div className="ra-progress-container" role="status" aria-live="polite">
          <div className="ra-progress-bar">
            <div className="ra-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="ra-progress-info">
            <span className="ra-progress-spinner" aria-hidden="true" />
            <span className="ra-progress-text">
              {progress < 30
                ? "Uploading resume…"
                : progress < 60
                ? "Scanning for issues…"
                : progress < 90
                ? "Validating hyperlinks…"
                : "Finalising report…"}
            </span>
            <span className="ra-progress-pct">{Math.round(progress)}%</span>
          </div>
        </div>
      ) : (
        <button
          className="ra-submit-btn"
          onClick={handleCheck}
          disabled={!file}
          type="button"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">fact_check</span>
          Check My Resume
        </button>
      )}
    </div>
  );
}
