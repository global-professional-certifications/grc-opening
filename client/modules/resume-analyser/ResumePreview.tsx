/**
 * ResumePreview — Full-page resume preview with export controls
 *
 * Renders the EnhancedResume data as a formatted document preview
 * that mirrors the PDF/DOCX output. Provides PDF and DOCX export buttons.
 */
import React, { useState } from "react";
import type { EnhancedResume } from "./ResumeAnalyser";
import { getStyleTokens } from "../../lib/resumeExport/styles";

interface ResumePreviewProps {
  data: EnhancedResume;
  onBack: () => void;
}

export function ResumePreview({ data, onBack }: ResumePreviewProps) {
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);
  const tokens = getStyleTokens(data.style);

  const flatSkills: string[] = Array.isArray(data.skills)
    ? data.skills
    : data.skills
    ? Object.values(data.skills).flat()
    : [];

  const groupedSkills: Record<string, string[]> | null =
    !Array.isArray(data.skills) && data.skills ? data.skills : null;

  // Contact parts for display
  const contactParts: { icon: string; text: string }[] = [];
  if (data.contact?.email) contactParts.push({ icon: "mail", text: data.contact.email });
  if (data.contact?.phone) contactParts.push({ icon: "phone", text: data.contact.phone });
  if (data.contact?.location) contactParts.push({ icon: "location_on", text: data.contact.location });
  if (data.contact?.linkedin) contactParts.push({ icon: "link", text: data.contact.linkedin });
  if (data.contact?.github) contactParts.push({ icon: "code", text: data.contact.github });
  if (data.contact?.website) contactParts.push({ icon: "language", text: data.contact.website });

  async function handleExport(format: "pdf" | "docx") {
    setExporting(format);
    try {
      if (format === "pdf") {
        const { exportResumePDF } = await import("../../lib/resumeExport");
        await exportResumePDF(data);
      } else {
        const { exportResumeDOCX } = await import("../../lib/resumeExport");
        await exportResumeDOCX(data);
      }
    } catch (err) {
      console.error(`[ResumePreview] Export ${format} failed:`, err);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="rp-wrapper">
      {/* ── Top Toolbar ── */}
      <div className="rp-toolbar">
        <button className="rp-toolbar-btn rp-toolbar-btn--back" onClick={onBack} type="button">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Back to Results
        </button>

        <div className="rp-toolbar-actions">
          <button
            className="rp-export-btn rp-export-btn--pdf"
            onClick={() => handleExport("pdf")}
            disabled={exporting !== null}
            type="button"
          >
            {exporting === "pdf" ? (
              <span className="rp-spinner" />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>picture_as_pdf</span>
            )}
            {exporting === "pdf" ? "Generating…" : "Export PDF"}
          </button>
          <button
            className="rp-export-btn rp-export-btn--docx"
            onClick={() => handleExport("docx")}
            disabled={exporting !== null}
            type="button"
          >
            {exporting === "docx" ? (
              <span className="rp-spinner" />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>description</span>
            )}
            {exporting === "docx" ? "Generating…" : "Export DOCX"}
          </button>
        </div>
      </div>

      {/* ── Paper Preview ── */}
      <div className="rp-paper-container">
        <div
          className="rp-paper"
          style={{ "--rp-primary": tokens.primaryColor, "--rp-accent": tokens.accentColor } as React.CSSProperties}
        >
          {/* Header */}
          <div className={`rp-header ${tokens.headerBg ? "rp-header--colored" : ""}`}>
            <h1 className="rp-name">{data.contact?.name || "Your Name"}</h1>
            {contactParts.length > 0 && (
              <div className="rp-contact-row">
                {contactParts.map((c, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="rp-contact-sep">|</span>}
                    <span className="rp-contact-item">
                      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{c.icon}</span>
                      {c.text}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Professional Summary */}
          {data.summary && (
            <div className="rp-section">
              <h2 className="rp-section-title">Professional Summary</h2>
              <p className="rp-body-text">{data.summary}</p>
            </div>
          )}

          {/* Skills */}
          {flatSkills.length > 0 && (
            <div className="rp-section">
              <h2 className="rp-section-title">Skills</h2>
              {groupedSkills ? (
                <div className="rp-skills-grouped">
                  {Object.entries(groupedSkills).map(([category, skills]) => (
                    <div key={category} className="rp-skill-group">
                      <span className="rp-skill-category">{category}:</span>
                      <span className="rp-skill-list">{skills.join(", ")}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rp-body-text rp-skills-flat">
                  {flatSkills.join("  •  ")}
                </p>
              )}
            </div>
          )}

          {/* Experience */}
          {data.experience && data.experience.length > 0 && (
            <div className="rp-section">
              <h2 className="rp-section-title">Experience</h2>
              {data.experience.map((exp, i) => (
                <div key={i} className="rp-entry">
                  <div className="rp-entry-top">
                    <span className="rp-entry-title">{exp.title}</span>
                    {exp.dates && <span className="rp-entry-dates">{exp.dates}</span>}
                  </div>
                  <div className="rp-entry-sub">
                    {exp.company}
                    {exp.location && <>, {exp.location}</>}
                  </div>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="rp-bullets">
                      {exp.bullets.map((b, j) => (
                        <li key={j}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {data.education && data.education.length > 0 && (
            <div className="rp-section">
              <h2 className="rp-section-title">Education</h2>
              {data.education.map((edu, i) => (
                <div key={i} className="rp-entry">
                  <div className="rp-entry-top">
                    <span className="rp-entry-title">{edu.degree}</span>
                    {edu.dates && <span className="rp-entry-dates">{edu.dates}</span>}
                  </div>
                  <div className="rp-entry-sub">{edu.institution}</div>
                  {edu.details && <p className="rp-body-text rp-edu-details">{edu.details}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Certifications */}
          {data.certifications && data.certifications.length > 0 && (
            <div className="rp-section">
              <h2 className="rp-section-title">Certifications</h2>
              <p className="rp-body-text">
                {data.certifications.join("  •  ")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
