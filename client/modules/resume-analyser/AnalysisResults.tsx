import React, { useState } from "react";
import type { EnhancedResume } from "./ResumeAnalyser";
import { ResumePreview } from "./ResumePreview";

interface AnalysisResultsProps {
  data: EnhancedResume;
  onReset: () => void;
  compact?: boolean;
}

function SkillTag({ skill }: { skill: string }) {
  return (
    <span className="ra-skill-tag">
      {skill}
    </span>
  );
}

function SectionCard({ title, icon, children, accentClass }: {
  title: string;
  icon: string;
  children: React.ReactNode;
  accentClass?: string;
}) {
  return (
    <div className={`ra-result-card ${accentClass || ""}`}>
      <div className="ra-result-card-header">
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
        <h4>{title}</h4>
      </div>
      <div className="ra-result-card-body">
        {children}
      </div>
    </div>
  );
}

export function AnalysisResults({ data, onReset, compact }: AnalysisResultsProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["summary", "skills", "keywords"])
  );

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Flatten skills if grouped
  const flatSkills: string[] = Array.isArray(data.skills)
    ? data.skills
    : data.skills
    ? Object.values(data.skills).flat()
    : [];

  const groupedSkills: Record<string, string[]> | null =
    !Array.isArray(data.skills) && data.skills ? data.skills : null;

  // ── Preview Mode ─────────────────────────────────────────────
  if (showPreview) {
    return <ResumePreview data={data} onBack={() => setShowPreview(false)} />;
  }

  // ── Results Mode (existing) ──────────────────────────────────
  return (
    <div className="ra-results">
      {/* Header */}
      <div className="ra-results-header">
        <div className="ra-results-header-left">
          <div className="ra-results-badge">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
            Enhancement Complete
          </div>
          {data.contact?.name && (
            <h3 className="ra-results-name">{data.contact.name}</h3>
          )}
        </div>
        <button className="ra-reset-btn" onClick={onReset}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
          Analyse Another
        </button>
      </div>

      {/* Contact Info (if available) */}
      {data.contact && (data.contact.email || data.contact.phone || data.contact.location) && (
        <div className="ra-contact-bar">
          {data.contact.email && (
            <span className="ra-contact-item">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>mail</span>
              {data.contact.email}
            </span>
          )}
          {data.contact.phone && (
            <span className="ra-contact-item">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>phone</span>
              {data.contact.phone}
            </span>
          )}
          {data.contact.location && (
            <span className="ra-contact-item">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>location_on</span>
              {data.contact.location}
            </span>
          )}
          {data.contact.linkedin && (
            <span className="ra-contact-item">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>link</span>
              LinkedIn
            </span>
          )}
        </div>
      )}

      {/* Enhanced Summary */}
      {data.summary && (
        <SectionCard title="Professional Summary" icon="person" accentClass="ra-card--primary">
          <p className="ra-summary-text">{data.summary}</p>
        </SectionCard>
      )}

      {/* Skills */}
      {flatSkills.length > 0 && (
        <SectionCard title={`Skills (${flatSkills.length})`} icon="psychology">
          {groupedSkills ? (
            <div className="ra-skills-grouped">
              {Object.entries(groupedSkills).map(([category, skills]) => (
                <div key={category} className="ra-skill-group">
                  <p className="ra-skill-group-label">{category}</p>
                  <div className="ra-skill-tags">
                    {skills.map((s, i) => <SkillTag key={i} skill={s} />)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ra-skill-tags">
              {flatSkills.map((s, i) => <SkillTag key={i} skill={s} />)}
            </div>
          )}
        </SectionCard>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <SectionCard title={`Experience (${data.experience.length})`} icon="work_history">
          <div className="ra-experience-list">
            {data.experience.map((exp, i) => (
              <div key={i} className="ra-experience-item">
                <div className="ra-exp-header">
                  <div>
                    <h5 className="ra-exp-title">{exp.title}</h5>
                    <p className="ra-exp-company">{exp.company}</p>
                  </div>
                  <div className="ra-exp-meta">
                    {exp.dates && <span>{exp.dates}</span>}
                    {exp.location && <span>{exp.location}</span>}
                  </div>
                </div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul className="ra-exp-bullets">
                    {exp.bullets.map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <SectionCard title="Education" icon="school">
          <div className="ra-education-list">
            {data.education.map((edu, i) => (
              <div key={i} className="ra-education-item">
                <h5 className="ra-edu-degree">{edu.degree}</h5>
                <p className="ra-edu-institution">{edu.institution}</p>
                {edu.dates && <p className="ra-edu-dates">{edu.dates}</p>}
                {edu.details && <p className="ra-edu-details">{edu.details}</p>}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <SectionCard title="Certifications" icon="verified">
          <div className="ra-skill-tags">
            {data.certifications.map((c, i) => (
              <span key={i} className="ra-cert-tag">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>verified</span>
                {c}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      {/* AI Enhancement Insights */}
      <div className="ra-insights-section">
        <h4 className="ra-insights-title">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>auto_awesome</span>
          AI Enhancement Insights
        </h4>

        <div className="ra-insights-grid">
          {/* Keywords Woven In */}
          {data.keywords_woven_in && data.keywords_woven_in.length > 0 && (
            <div className="ra-insight-card ra-insight--success">
              <p className="ra-insight-label">Keywords Integrated</p>
              <div className="ra-skill-tags">
                {data.keywords_woven_in.map((k, i) => (
                  <span key={i} className="ra-keyword-tag ra-keyword--woven">{k}</span>
                ))}
              </div>
            </div>
          )}

          {/* Keywords Added */}
          {data.keywords_added && data.keywords_added.length > 0 && (
            <div className="ra-insight-card ra-insight--info">
              <p className="ra-insight-label">New Keywords Added</p>
              <div className="ra-skill-tags">
                {data.keywords_added.map((k, i) => (
                  <span key={i} className="ra-keyword-tag ra-keyword--added">{k}</span>
                ))}
              </div>
            </div>
          )}

          {/* Sections Modified */}
          {data.sections_modified && data.sections_modified.length > 0 && (
            <div className="ra-insight-card ra-insight--warning">
              <p className="ra-insight-label">Sections Enhanced</p>
              <div className="ra-skill-tags">
                {data.sections_modified.map((s, i) => (
                  <span key={i} className="ra-section-tag">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Enhancement Notes */}
        {data.enhancement_notes && (
          <div className="ra-enhancement-notes">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lightbulb</span>
            <p>{data.enhancement_notes}</p>
          </div>
        )}
      </div>

      {/* ── Preview & Export CTA ── */}
      <div className="ra-preview-cta">
        <div className="ra-preview-cta-text">
          <span className="material-symbols-outlined" style={{ fontSize: 24, color: "var(--db-primary)" }}>draft</span>
          <div>
            <h4>Ready to download your enhanced resume?</h4>
            <p>Preview how it will look as a formatted document, then export as PDF or DOCX.</p>
          </div>
        </div>
        <button
          className="ra-preview-btn"
          onClick={() => setShowPreview(true)}
          type="button"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>visibility</span>
          Preview & Export Resume
        </button>
      </div>
    </div>
  );
}
