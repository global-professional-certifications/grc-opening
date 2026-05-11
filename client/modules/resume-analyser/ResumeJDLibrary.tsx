import React, { useState, useRef, useCallback, useMemo } from "react";
import { AnalysisResults } from "./AnalysisResults";
import type { EnhancedResume } from "./ResumeAnalyser";
import {
  getAvailableSeniorities,
  getRolesForSeniority,
  findJDTemplate,
} from "../../lib/jdTemplates";

// ── Types ─────────────────────────────────────────────────────
interface ResumeJDLibraryProps {
  /** If true, use the public (no-auth) endpoint */
  isPublic?: boolean;
  /** If true, render in compact mode for the home page */
  compact?: boolean;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
];

const TEMPLATE_STYLES = [
  { value: "modern", label: "Modern", icon: "auto_awesome" },
  { value: "classic", label: "Classic", icon: "history_edu" },
  { value: "executive", label: "Executive", icon: "workspace_premium" },
  { value: "minimalist", label: "Minimalist", icon: "filter_none" },
  { value: "creative", label: "Creative", icon: "palette" },
];

const SENIORITY_ICONS: Record<string, string> = {
  Entry: "school",
  Associate: "badge",
  "Mid-Senior": "trending_up",
  "Lead/Manager": "supervisor_account",
  Director: "corporate_fare",
  Executive: "diamond",
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function ResumeJDLibrary({ isPublic = false, compact = false }: ResumeJDLibraryProps) {
  // ── File state ──────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── JD Library state ────────────────────────────────────────
  const [selectedSeniority, setSelectedSeniority] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");

  // ── Style state ─────────────────────────────────────────────
  const [style, setStyle] = useState("modern");

  // ── Analysis state ──────────────────────────────────────────
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [result, setResult] = useState<EnhancedResume | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // ── Derived data ────────────────────────────────────────────
  const seniorities = useMemo(() => getAvailableSeniorities(), []);

  const availableRoles = useMemo(
    () => (selectedSeniority ? getRolesForSeniority(selectedSeniority) : []),
    [selectedSeniority]
  );

  const selectedTemplate = useMemo(
    () =>
      selectedSeniority && selectedRole
        ? findJDTemplate(selectedSeniority, selectedRole)
        : undefined,
    [selectedSeniority, selectedRole]
  );

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
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && ACCEPTED_TYPES.includes(droppedFile.type)) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError(
        "Unsupported file type. Please upload a PDF, DOCX, DOC, or TXT file."
      );
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

  // ── Seniority / Role Selection ──────────────────────────────
  const handleSeniorityChange = (seniority: string) => {
    setSelectedSeniority(seniority);
    setSelectedRole(""); // Reset role when seniority changes
    setError(null);
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    setError(null);
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleAnalyse = async () => {
    if (!file) {
      setError("Please upload a resume file.");
      return;
    }
    if (!selectedTemplate) {
      setError("Please select an experience level and job role.");
      return;
    }

    setIsAnalysing(true);
    setError(null);
    setResult(null);
    setProgress(0);

    // Simulate progress while waiting for AI (it can take 30–90s)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev;
        const increment =
          prev < 30 ? 3 : prev < 60 ? 2 : prev < 80 ? 1 : 0.5;
        return Math.min(prev + increment, 92);
      });
    }, 800);

    try {
      const endpoint = isPublic
        ? `${BASE_URL}/resume-analyser/public/analyse`
        : `${BASE_URL}/resume-analyser/analyse`;

      const formData = new FormData();
      formData.append("resume", file);
      formData.append("job_description", selectedTemplate.description);
      formData.append("style", style);

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
        throw new Error(body.error || `Analysis failed (${response.status})`);
      }

      const data = await response.json();
      setProgress(100);

      // Small delay to show 100% before rendering results
      await new Promise((r) => setTimeout(r, 400));
      setResult(data.data);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setSelectedSeniority("");
    setSelectedRole("");
    setStyle("modern");
    setResult(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Render ─────────────────────────────────────────────────
  // If results are ready, show them
  if (result) {
    return (
      <div className="ra-container">
        <AnalysisResults data={result} onReset={handleReset} />
      </div>
    );
  }

  const isReady = !!file && !!selectedTemplate;

  return (
    <div className="ra-container">
      {/* Header */}
      {!compact && (
        <div className="ra-header">
          <div className="ra-header-icon" style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)" }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 28, color: "#fff" }}
            >
              library_books
            </span>
          </div>
          <div>
            <h2 className="ra-title">JD Library Enhancer</h2>
            <p className="ra-subtitle">
              Select an experience level and job role from our curated GRC library — the job description auto-populates, and AI tailors your resume to match.
            </p>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <div
        className={`ra-dropzone ${isDragging ? "ra-dropzone--active" : ""} ${
          file ? "ra-dropzone--has-file" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        id="jd-library-dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt"
          onChange={handleFileSelect}
          style={{ display: "none" }}
          id="jd-library-file-input"
        />

        {file ? (
          <div className="ra-file-info">
            <div className="ra-file-icon">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 32, color: "var(--db-primary)" }}
              >
                description
              </span>
            </div>
            <div className="ra-file-details">
              <p className="ra-file-name">{file.name}</p>
              <p className="ra-file-size">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              className="ra-file-remove"
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              title="Remove file"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18 }}
              >
                close
              </span>
            </button>
          </div>
        ) : (
          <div className="ra-dropzone-content">
            <div className="ra-dropzone-icon-ring">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 36 }}
              >
                upload_file
              </span>
            </div>
            <p className="ra-dropzone-text">
              <strong>Drop your resume here</strong> or click to browse
            </p>
            <p className="ra-dropzone-hint">PDF, DOCX, DOC, TXT · Max 5 MB</p>
          </div>
        )}
      </div>

      {/* ── Experience Level & Job Role Dropdowns ── */}
      <div className="jdl-select-row">
        {/* Experience Level */}
        <div className="ra-field-group">
          <label className="ra-label" htmlFor="jdl-seniority-select">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16 }}
            >
              military_tech
            </span>
            Experience Level <span className="ra-required">*</span>
          </label>
          <div className="jdl-select-wrapper">
            <select
              id="jdl-seniority-select"
              className="jdl-select"
              value={selectedSeniority}
              onChange={(e) => handleSeniorityChange(e.target.value)}
            >
              <option value="" disabled>
                Select experience level…
              </option>
              {seniorities.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span
              className="material-symbols-outlined jdl-select-icon"
              aria-hidden="true"
            >
              expand_more
            </span>
          </div>
        </div>

        {/* Job Role */}
        <div className="ra-field-group">
          <label className="ra-label" htmlFor="jdl-role-select">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16 }}
            >
              work
            </span>
            Job Role <span className="ra-required">*</span>
          </label>
          <div className="jdl-select-wrapper">
            <select
              id="jdl-role-select"
              className="jdl-select"
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              disabled={availableRoles.length === 0}
            >
              <option value="" disabled>
                {availableRoles.length === 0
                  ? "Select experience level first…"
                  : "Select a job role…"}
              </option>
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <span
              className="material-symbols-outlined jdl-select-icon"
              aria-hidden="true"
            >
              expand_more
            </span>
          </div>
        </div>
      </div>

      {/* ── Auto-Populated JD Preview ── */}
      {selectedTemplate && (
        <div className="jdl-preview-card jdl-fade-in">
          <div className="jdl-preview-header">
            <div className="jdl-preview-header-left">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18, color: "#10b981" }}
                aria-hidden="true"
              >
                auto_awesome
              </span>
              <span className="jdl-preview-badge">Auto-Populated JD</span>
            </div>
            <div className="jdl-preview-meta">
              <span className="jdl-preview-meta-pill">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 12 }}
                  aria-hidden="true"
                >
                  {SENIORITY_ICONS[selectedSeniority] || "work"}
                </span>
                {selectedSeniority}
              </span>
              <span className="jdl-preview-meta-pill">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 12 }}
                  aria-hidden="true"
                >
                  sell
                </span>
                {selectedTemplate.category}
              </span>
            </div>
          </div>

          <div className="jdl-preview-title-row">
            <h4 className="jdl-preview-role">{selectedTemplate.role}</h4>
          </div>

          <div className="jdl-preview-body">
            {selectedTemplate.description
              .split("\n")
              .filter((line) => line.trim())
              .map((line, i) => {
                const trimmed = line.trim();
                // Section headers (all-caps-ish or known patterns)
                const isHeader = /^(Job Summary|Key Responsibilities|Required Skills and Qualifications|Education|Certifications|Responsibilities|Qualifications)$/i.test(
                  trimmed
                );
                if (isHeader) {
                  return (
                    <p key={i} className="jdl-preview-section-header">
                      {trimmed}
                    </p>
                  );
                }
                return (
                  <p key={i} className="jdl-preview-line">
                    {trimmed}
                  </p>
                );
              })}
          </div>

          <div className="jdl-preview-footer">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 14, color: "var(--db-text-muted)" }}
              aria-hidden="true"
            >
              info
            </span>
            <span className="jdl-preview-footer-text">
              This JD will be sent to the AI enhancer to tailor your resume.
            </span>
          </div>
        </div>
      )}

      {/* Template Style Picker */}
      <div className="ra-field-group">
        <label className="ra-label">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16 }}
          >
            style
          </span>
          Resume Style
        </label>
        <div className="ra-style-grid">
          {TEMPLATE_STYLES.map((s) => (
            <button
              key={s.value}
              className={`ra-style-chip ${
                style === s.value ? "ra-style-chip--active" : ""
              }`}
              onClick={() => setStyle(s.value)}
              type="button"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16 }}
              >
                {s.icon}
              </span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="ra-error">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18 }}
          >
            error
          </span>
          {error}
        </div>
      )}

      {/* Submit Button / Progress */}
      {isAnalysing ? (
        <div className="ra-progress-container">
          <div className="ra-progress-bar">
            <div
              className="ra-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="ra-progress-info">
            <span className="ra-progress-spinner" />
            <span className="ra-progress-text">
              {progress < 30
                ? "Uploading resume…"
                : progress < 60
                ? "AI is analysing your resume…"
                : progress < 90
                ? "Enhancing content for the role…"
                : "Almost done…"}
            </span>
            <span className="ra-progress-pct">{Math.round(progress)}%</span>
          </div>
        </div>
      ) : (
        <button
          className="ra-submit-btn"
          onClick={handleAnalyse}
          disabled={!isReady}
          id="jd-library-submit"
          style={
            isReady
              ? { background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)" }
              : undefined
          }
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20 }}
          >
            auto_awesome
          </span>
          Enhance with JD Library
        </button>
      )}
    </div>
  );
}
