import React, { useState, useRef, useCallback } from "react";
import { AnalysisResults } from "./AnalysisResults";

// ── Types ─────────────────────────────────────────────────────
export interface EnhancedResume {
  style?: string;
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  summary?: string;
  skills?: string[] | Record<string, string[]>;
  experience?: Array<{
    company: string;
    title: string;
    dates?: string;
    location?: string;
    bullets?: string[];
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    dates?: string;
    details?: string;
  }>;
  certifications?: string[];
  keywords_woven_in?: string[];
  keywords_added?: string[];
  enhancement_notes?: string;
  sections_modified?: string[];
  sections_untouched?: string[];
}

interface ResumeAnalyserProps {
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

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function ResumeAnalyser({ isPublic = false, compact = false }: ResumeAnalyserProps) {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [style, setStyle] = useState("modern");
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [result, setResult] = useState<EnhancedResume | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
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
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && ACCEPTED_TYPES.includes(droppedFile.type)) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Unsupported file type. Please upload a PDF, DOCX, DOC, or TXT file.");
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
  const handleAnalyse = async () => {
    if (!file) { setError("Please upload a resume file."); return; }
    if (jobDescription.trim().length === 0) {
      setError("Job description is required.");
      return;
    }

    setIsAnalysing(true);
    setError(null);
    setResult(null);
    setProgress(0);

    // Simulate progress while waiting for AI (it can take 30–90s)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 92) return prev;
        const increment = prev < 30 ? 3 : prev < 60 ? 2 : prev < 80 ? 1 : 0.5;
        return Math.min(prev + increment, 92);
      });
    }, 800);

    try {
      const endpoint = isPublic
        ? `${BASE_URL}/resume-analyser/public/analyse`
        : `${BASE_URL}/resume-analyser/analyse`;

      const formData = new FormData();
      formData.append("resume", file);
      formData.append("job_description", jobDescription);
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
      await new Promise(r => setTimeout(r, 400));
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
    setJobDescription("");
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
        <AnalysisResults data={result} onReset={handleReset} compact={compact} />
      </div>
    );
  }

  return (
    <div className="ra-container">
      {/* Header */}
      {!compact && (
        <div className="ra-header">
          <div className="ra-header-icon">
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#fff" }}>smart_toy</span>
          </div>
          <div>
            <h2 className="ra-title">AI Resume Enhancer</h2>
            <p className="ra-subtitle">
              Upload your resume and paste a job description — our AI will tailor your resume to match the role perfectly.
            </p>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <div
        className={`ra-dropzone ${isDragging ? "ra-dropzone--active" : ""} ${file ? "ra-dropzone--has-file" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        id="resume-analyser-dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt"
          onChange={handleFileSelect}
          style={{ display: "none" }}
          id="resume-analyser-file-input"
        />

        {file ? (
          <div className="ra-file-info">
            <div className="ra-file-icon">
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: "var(--db-primary)" }}>description</span>
            </div>
            <div className="ra-file-details">
              <p className="ra-file-name">{file.name}</p>
              <p className="ra-file-size">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button className="ra-file-remove" onClick={(e) => { e.stopPropagation(); removeFile(); }} title="Remove file">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
            </button>
          </div>
        ) : (
          <div className="ra-dropzone-content">
            <div className="ra-dropzone-icon-ring">
              <span className="material-symbols-outlined" style={{ fontSize: 36 }}>upload_file</span>
            </div>
            <p className="ra-dropzone-text">
              <strong>Drop your resume here</strong> or click to browse
            </p>
            <p className="ra-dropzone-hint">PDF, DOCX, DOC, TXT · Max 5 MB</p>
          </div>
        )}
      </div>

      {/* Job Description */}
      <div className="ra-field-group">
        <label className="ra-label" htmlFor="ra-job-description">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>work</span>
          Job Description <span className="ra-required">*</span>
        </label>
        <textarea
          id="ra-job-description"
          className="ra-textarea"
          placeholder="Paste the full job description here…"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={compact ? 4 : 6}
        />
        <div className="ra-char-count" style={{ color: jobDescription.length > 0 ? "var(--db-primary)" : "var(--db-text-muted)" }}>
          {jobDescription.length} characters
          {jobDescription.length > 0 && (
            <span className="material-symbols-outlined" style={{ fontSize: 14, marginLeft: 4, verticalAlign: "middle" }}>check_circle</span>
          )}
        </div>
      </div>

      {/* Template Style Picker */}
      <div className="ra-field-group">
        <label className="ra-label">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>style</span>
          Resume Style
        </label>
        <div className="ra-style-grid">
          {TEMPLATE_STYLES.map((s) => (
            <button
              key={s.value}
              className={`ra-style-chip ${style === s.value ? "ra-style-chip--active" : ""}`}
              onClick={() => setStyle(s.value)}
              type="button"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="ra-error">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
          {error}
        </div>
      )}

      {/* Submit Button / Progress */}
      {isAnalysing ? (
        <div className="ra-progress-container">
          <div className="ra-progress-bar">
            <div className="ra-progress-fill" style={{ width: `${progress}%` }} />
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
          disabled={!file || jobDescription.trim().length === 0}
          id="resume-analyser-submit"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>auto_awesome</span>
          Enhance My Resume
        </button>
      )}
    </div>
  );
}
