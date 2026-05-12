import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ProfileFormData } from "./types";
import { apiFetch } from "../../lib/api";

interface Props {
  resumeUrl: ProfileFormData["resumeUrl"];
  resumeFileName: ProfileFormData["resumeFileName"];
  onChange: (updates: Partial<ProfileFormData>) => void;
}

interface ParsedPreviewWorkExperience {
  title?: string;
  company?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

interface ParsedPreviewEducation {
  institution?: string;
  degree?: string;
  field?: string;
  gpa?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

interface ParsedPreviewCertification {
  name?: string;
}

interface ParsedPreviewData {
  firstName?: string;
  lastName?: string;
  professionalTitle?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedInUrl?: string;
  summary?: string;
  coreCompetencies?: string[];
  certifications?: ParsedPreviewCertification[];
  workExperience?: ParsedPreviewWorkExperience[];
  education?: ParsedPreviewEducation[];
}

interface ParsePreviewApiResponse {
  success: boolean;
  source?: "ai" | "local";
  parsedData: ParsedPreviewData;
  filledFields?: string[];
  filledCount?: number;
}

interface ParsedPreviewState {
  source?: "ai" | "local";
  filledFields: string[];
  updates: Partial<ProfileFormData>;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const dedupe = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (dedupe.has(key)) continue;
    dedupe.add(key);
    result.push(trimmed);
  }

  return result;
}

function mapParsedToFormUpdates(parsed: ParsedPreviewData): Partial<ProfileFormData> {
  const updates: Partial<ProfileFormData> = {};

  const firstName = cleanText(parsed.firstName);
  const lastName = cleanText(parsed.lastName);
  const professionalTitle = cleanText(parsed.professionalTitle);
  const email = cleanText(parsed.email);
  const phone = cleanText(parsed.phone);
  const location = cleanText(parsed.location);
  const linkedInUrl = cleanText(parsed.linkedInUrl);
  const summary = cleanText(parsed.summary);
  const coreCompetencies = cleanStringArray(parsed.coreCompetencies);

  if (firstName) updates.firstName = firstName;
  if (lastName) updates.lastName = lastName;
  if (professionalTitle) updates.professionalTitle = professionalTitle;
  if (email) updates.email = email;
  if (phone) updates.phone = phone;
  if (location) updates.location = location;
  if (linkedInUrl) updates.linkedInUrl = linkedInUrl;
  if (summary) updates.summary = summary;
  if (coreCompetencies.length > 0) updates.coreCompetencies = coreCompetencies;

  if (Array.isArray(parsed.certifications) && parsed.certifications.length > 0) {
    const certifications = parsed.certifications
      .map((cert) => cleanText(cert?.name))
      .filter(Boolean)
      .map((name) => ({ id: createId(), name }));

    if (certifications.length > 0) {
      updates.certifications = certifications;
    }
  }

  if (Array.isArray(parsed.workExperience) && parsed.workExperience.length > 0) {
    const workExperience = parsed.workExperience
      .map((item) => {
        const title = cleanText(item?.title);
        const company = cleanText(item?.company);
        const description = cleanText(item?.description);

        if (!title && !company && !description) return null;

        return {
          id: createId(),
          title,
          company,
          location: cleanText(item?.location),
          startDate: cleanText(item?.startDate),
          endDate: cleanText(item?.endDate),
          current: Boolean(item?.current),
          description,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    if (workExperience.length > 0) {
      updates.workExperience = workExperience;
    }
  }

  if (Array.isArray(parsed.education) && parsed.education.length > 0) {
    const education = parsed.education
      .map((item) => {
        const institution = cleanText(item?.institution);
        const degree = cleanText(item?.degree);
        const field = cleanText(item?.field);

        if (!institution && !degree && !field) return null;

        return {
          id: createId(),
          institution,
          degree,
          field,
          gpa: cleanText(item?.gpa),
          startDate: cleanText(item?.startDate),
          endDate: cleanText(item?.endDate),
          description: cleanText(item?.description),
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    if (education.length > 0) {
      updates.education = education;
    }
  }

  return updates;
}

function hasUpdates(updates: Partial<ProfileFormData>): boolean {
  return Object.values(updates).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
  });
}

function getFallbackFilledFields(updates: Partial<ProfileFormData>): string[] {
  const labels: Record<string, string> = {
    firstName: "First Name",
    lastName: "Last Name",
    professionalTitle: "Professional Title",
    email: "Email",
    phone: "Phone Number",
    location: "Location",
    linkedInUrl: "LinkedIn URL",
    summary: "Summary",
    coreCompetencies: "Skills",
    certifications: "Certifications",
    workExperience: "Work Experience",
    education: "Education",
  };

  return Object.entries(updates)
    .filter(([, value]) => (Array.isArray(value) ? value.length > 0 : Boolean(value)))
    .map(([key]) => labels[key] || key);
}

export function ResumeSection({ resumeUrl, resumeFileName, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const latestObjectUrlRef = useRef<string | null>(null);

  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<ParsedPreviewState | null>(null);
  const [applyResult, setApplyResult] = useState<{ count: number; fields: string[] } | null>(null);

  useEffect(() => {
    return () => {
      if (latestObjectUrlRef.current) {
        URL.revokeObjectURL(latestObjectUrlRef.current);
      }
    };
  }, []);

  const previewRows = useMemo(() => {
    if (!parsedPreview) return [];
    const u = parsedPreview.updates;

    const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
    return [
      { label: "Name", value: fullName },
      { label: "Professional Title", value: u.professionalTitle || "" },
      { label: "Email", value: u.email || "" },
      { label: "Phone", value: u.phone || "" },
      { label: "Location", value: u.location || "" },
      { label: "LinkedIn", value: u.linkedInUrl || "" },
    ].filter((row) => row.value);
  }, [parsedPreview]);

  function handlePreview() {
    if (!resumeUrl) return;
    window.open(resumeUrl, "_blank", "noopener,noreferrer");
  }

  function resetFileInput() {
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDelete() {
    if (latestObjectUrlRef.current) {
      URL.revokeObjectURL(latestObjectUrlRef.current);
      latestObjectUrlRef.current = null;
    }

    onChange({ resumeUrl: null, resumeFileName: null });
    setParsedPreview(null);
    setApplyResult(null);
    setParseError(null);
    resetFileInput();
  }

  function handleDiscardParsedData() {
    setParsedPreview(null);
  }

  function handleApplyParsedData() {
    if (!parsedPreview) return;
    onChange(parsedPreview.updates);
    setApplyResult({
      count: parsedPreview.filledFields.length,
      fields: parsedPreview.filledFields,
    });
    setParsedPreview(null);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setParseError("File is too large. Please upload a resume up to 10MB.");
      resetFileInput();
      return;
    }

    if (latestObjectUrlRef.current) {
      URL.revokeObjectURL(latestObjectUrlRef.current);
      latestObjectUrlRef.current = null;
    }

    const objectUrl = URL.createObjectURL(file);
    latestObjectUrlRef.current = objectUrl;
    onChange({ resumeUrl: objectUrl, resumeFileName: file.name });
    resetFileInput();

    setParsing(true);
    setParseError(null);
    setParsedPreview(null);
    setApplyResult(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await apiFetch<ParsePreviewApiResponse>("/resume/parse-preview", {
        method: "POST",
        body: formData,
      });

      const updates = mapParsedToFormUpdates(response.parsedData || {});
      if (!hasUpdates(updates)) {
        setParseError("Resume parsed, but no usable fields were extracted. Please review manually.");
        return;
      }

      const filledFields =
        Array.isArray(response.filledFields) && response.filledFields.length > 0
          ? response.filledFields
          : getFallbackFilledFields(updates);

      setParsedPreview({
        source: response.source,
        filledFields,
        updates,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not parse this resume. Please fill in your details manually.";
      setParseError(message);
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
        <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--db-text)" }}>
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
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#ef4444" }}>
                picture_as_pdf
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--db-text)" }}>
                {resumeFileName || "Resume.pdf"}
              </p>
              <p className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>
                {parsing ? (
                  <span style={{ color: "var(--db-primary)" }}>Parsing resume...</span>
                ) : (
                  "Resume uploaded"
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {parsing && (
              <span
                style={{
                  display: "inline-block",
                  width: 16,
                  height: 16,
                  border: "2px solid var(--db-primary-20)",
                  borderTopColor: "var(--db-primary)",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }}
              />
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
              View
            </button>
            <button
              onClick={handleDelete}
              disabled={parsing}
              className="db-btn-primary px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                background: "rgba(239,68,68,0.1)",
                color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.2)",
                opacity: parsing ? 0.5 : 1,
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center rounded-xl p-8 text-center"
          style={{
            background: "var(--db-surface)",
            border: "2px dashed var(--db-border)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--db-primary)";
            e.currentTarget.style.background = "var(--db-primary-10)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--db-border)";
            e.currentTarget.style.background = "var(--db-surface)";
          }}
        >
          <span className="material-symbols-outlined mb-2" style={{ fontSize: 36, color: "var(--db-text-muted)" }}>
            upload_file
          </span>
          <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
            Upload Resume
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--db-text-muted)" }}>
            PDF, DOC, DOCX up to 10MB · Fields can be auto-filled after parsing
          </p>
        </button>
      )}

      <div
        className="overflow-hidden transition-all duration-500 ease-out"
        style={{
          maxHeight: parsedPreview ? 560 : 0,
          opacity: parsedPreview ? 1 : 0,
          transform: parsedPreview ? "translateY(0)" : "translateY(-8px)",
        }}
      >
        {parsedPreview && (
          <div
            className="rounded-xl px-4 py-4 space-y-3"
            style={{
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.25)",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: "#10b981" }}>
                  Parsed {parsedPreview.filledFields.length} field{parsedPreview.filledFields.length !== 1 ? "s" : ""} from your resume
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--db-text-muted)" }}>
                  {parsedPreview.source === "ai"
                    ? "AI parser extracted the details below. Review before applying."
                    : "Resume details extracted. Review before applying."}
                </p>
              </div>
            </div>

            {previewRows.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {previewRows.map((row) => (
                  <div
                    key={row.label}
                    className="rounded-lg px-3 py-2"
                    style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(16,185,129,0.2)" }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--db-text-muted)" }}>
                      {row.label}
                    </p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: "var(--db-text)" }}>
                      {row.value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {Array.isArray(parsedPreview.updates.coreCompetencies) &&
                parsedPreview.updates.coreCompetencies.slice(0, 8).map((skill) => (
                  <span
                    key={skill}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: "rgba(16,185,129,0.12)",
                      color: "#0f766e",
                      border: "1px solid rgba(16,185,129,0.25)",
                    }}
                  >
                    {skill}
                  </span>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: "var(--db-text-muted)" }}>
              {Array.isArray(parsedPreview.updates.workExperience) && parsedPreview.updates.workExperience.length > 0 && (
                <span>{parsedPreview.updates.workExperience.length} work experience entr{parsedPreview.updates.workExperience.length === 1 ? "y" : "ies"}</span>
              )}
              {Array.isArray(parsedPreview.updates.education) && parsedPreview.updates.education.length > 0 && (
                <span>{parsedPreview.updates.education.length} education entr{parsedPreview.updates.education.length === 1 ? "y" : "ies"}</span>
              )}
              {Array.isArray(parsedPreview.updates.certifications) && parsedPreview.updates.certifications.length > 0 && (
                <span>{parsedPreview.updates.certifications.length} certification{parsedPreview.updates.certifications.length === 1 ? "" : "s"}</span>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleApplyParsedData}
                className="px-4 py-2 rounded-lg text-xs font-semibold"
                style={{
                  background: "var(--db-primary)",
                  color: "white",
                  border: "1px solid var(--db-primary)",
                }}
              >
                Apply
              </button>
              <button
                onClick={handleDiscardParsedData}
                className="px-4 py-2 rounded-lg text-xs font-semibold"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  color: "#ef4444",
                  border: "1px solid rgba(239,68,68,0.22)",
                }}
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>

      {applyResult && !parsing && (
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3"
          style={{
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.25)",
          }}
        >
          <span className="material-symbols-outlined flex-shrink-0 mt-0.5" style={{ fontSize: 16, color: "#10b981" }}>
            check_circle
          </span>
          <div style={{ minWidth: 0 }}>
            <p className="text-xs font-semibold" style={{ color: "#10b981" }}>
              Applied {applyResult.count} parsed field{applyResult.count !== 1 ? "s" : ""} to your profile
            </p>
            <p
              className="text-xs mt-0.5 font-medium"
              style={{ color: "var(--db-text-muted)", lineHeight: 1.5, overflowWrap: "break-word", wordBreak: "break-word" }}
            >
              {applyResult.fields.join(" · ")}
            </p>
          </div>
          <button
            onClick={() => setApplyResult(null)}
            style={{ color: "var(--db-text-muted)", flexShrink: 0, fontSize: 16, lineHeight: 1 }}
            title="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {parseError && !parsing && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.25)",
          }}
        >
          <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 16, color: "#f59e0b" }}>
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
