import React, { useState, useEffect, useRef } from "react";
import type { ProfileFormData, Education } from "./types";

const COMMON_DEGREES = [
  "High School Diploma",
  "Associate of Arts (A.A.)",
  "Associate of Science (A.S.)",
  "Bachelor of Arts (B.A.)",
  "Bachelor of Science (B.S. / B.Sc.)",
  "Bachelor of Fine Arts (BFA)",
  "Bachelor of Business Administration (BBA)",
  "Bachelor of Technology (B.Tech)",
  "Bachelor of Engineering (B.E.)",
  "Bachelor of Commerce (B.Com)",
  "Bachelor of Laws (LL.B.)",
  "Master of Arts (M.A.)",
  "Master of Science (M.S. / M.Sc.)",
  "Master of Business Administration (MBA)",
  "Master of Fine Arts (MFA)",
  "Master of Technology (M.Tech)",
  "Master of Engineering (M.E.)",
  "Master of Commerce (M.Com)",
  "Master of Laws (LL.M.)",
  "Master of Computer Applications (MCA)",
  "Doctor of Philosophy (Ph.D.)",
  "Doctor of Medicine (M.D.)",
  "Doctor of Education (Ed.D.)",
  "Juris Doctor (J.D.)",
  "Diploma",
  "Postgraduate Diploma",
  "Other",
];

const COMMON_FIELDS = [
  "Computer Science",
  "Information Technology",
  "Cyber Security",
  "Data Science",
  "Engineering",
  "Business Administration",
  "Finance",
  "Accounting",
  "Marketing",
  "Communications",
  "Law",
  "Healthcare",
  "Mathematics",
  "Physics",
  "Other",
];

const BASE_INPUT: React.CSSProperties = {
  width: "100%",
  background: "var(--db-surface)",
  border: "1px solid var(--db-border)",
  borderRadius: 10,
  padding: "12px 16px",
  color: "var(--db-text)",
  fontSize: "0.875rem",
  fontWeight: 500,
  outline: "none",
  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  overflow: "hidden",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "0.65rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--db-text-secondary)",
  marginBottom: 8,
  display: "block",
};

function CustomDropdown({ value, onChange, options, placeholder }: { value: string, onChange: (val: string) => void, options: string[], placeholder: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={() => setOpen(!open)}
        style={{ ...BASE_INPUT, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <span style={{ opacity: value ? 1 : 0.6, textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}>
          {value || placeholder}
        </span>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--db-text-muted)" }}>
          {open ? "expand_less" : "expand_more"}
        </span>
      </div>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            background: "var(--db-surface)",
            border: "1px solid var(--db-border)",
            borderRadius: 10,
            maxHeight: 220,
            overflowY: "auto",
            zIndex: 50,
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          }}
        >
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              style={{
                padding: "10px 16px",
                fontSize: "0.875rem",
                color: "var(--db-text)",
                fontWeight: 500,
                cursor: "pointer",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--db-primary-10)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

interface EducationItemProps {
  edu: Education;
  onUpdate: (updated: Education) => void;
  onRemove: () => void;
}

function EducationItem({ edu, onUpdate, onRemove }: EducationItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [universitySuggestions, setUniversitySuggestions] = useState<string[]>([]);
  const [fetchingUnis, setFetchingUnis] = useState(false);

  // Debounced university fetch using free HipoLabs API
  useEffect(() => {
    if (!edu.institution || edu.institution.length < 3) {
      setUniversitySuggestions([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setFetchingUnis(true);
      try {
        const res = await fetch(`http://universities.hipolabs.com/search?name=${encodeURIComponent(edu.institution)}`);
        const data = await res.json();
        // Extract unique names
        const names = Array.from(new Set(data.map((u: any) => u.name))) as string[];
        setUniversitySuggestions(names.slice(0, 10)); // keep top 10
      } catch (err) {
        console.error("Failed to fetch universities", err);
      } finally {
        setFetchingUnis(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [edu.institution]);

  function field<K extends keyof Education>(key: K, value: Education[K]) {
    onUpdate({ ...edu, [key]: value });
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--db-border)" }}>
      {/* Collapsed header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        style={{ background: "var(--db-surface)" }}
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--db-primary-20)" }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: "var(--db-primary)" }}
            >
              school
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--db-text)" }}>
              {edu.institution || "New Education"}
            </p>
            <p className="text-xs truncate font-medium" style={{ color: "var(--db-text-muted)" }}>
              {[edu.degree, edu.field].filter(Boolean).join(" in ") || "Degree"}
              {(edu.startDate || edu.endDate) && (
                <>
                  {" "}
                  &middot;{" "}
                  {edu.startDate}
                  {edu.endDate ? ` — ${edu.endDate}` : ""}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 rounded transition-colors"
            style={{ color: "var(--db-text-muted)" }}
            title="Remove"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              delete
            </span>
          </button>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: "var(--db-text-muted)" }}
          >
            {expanded ? "expand_less" : "expand_more"}
          </span>
        </div>
      </div>

      {/* Expanded edit form */}
      {expanded && (
        <div className="p-4 space-y-3" style={{ background: "var(--db-card)" }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative min-w-0">
              <label style={LABEL_STYLE}>Institution / University</label>
              <input
                value={edu.institution}
                onChange={(e) => field("institution", e.target.value)}
                placeholder="Harvard University"
                style={BASE_INPUT}
                list={`uni-suggestions-${edu.id}`}
              />
              <datalist id={`uni-suggestions-${edu.id}`}>
                {universitySuggestions.map((uni, idx) => (
                  <option key={idx} value={uni} />
                ))}
              </datalist>
            </div>
            <div className="min-w-0">
              <label style={LABEL_STYLE}>Degree</label>
              <CustomDropdown
                value={edu.degree}
                onChange={(val) => field("degree", val)}
                options={COMMON_DEGREES}
                placeholder="Select Degree"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <label style={LABEL_STYLE}>Field of Study</label>
              <CustomDropdown
                value={edu.field}
                onChange={(val) => field("field", val)}
                options={COMMON_FIELDS}
                placeholder="Select Field of Study"
              />
            </div>
            <div className="min-w-0">
              <label style={LABEL_STYLE}>CGPA / GPA / Percentage</label>
              <input
                value={edu.gpa || ""}
                onChange={(e) => field("gpa", e.target.value)}
                placeholder="e.g. 3.8/4.0 or 85%"
                style={BASE_INPUT}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <label style={LABEL_STYLE}>Start Date</label>
              <input
                value={edu.startDate}
                onChange={(e) => field("startDate", e.target.value)}
                placeholder="Aug 2018"
                style={BASE_INPUT}
              />
            </div>
            <div className="min-w-0">
              <label style={LABEL_STYLE}>End Date (or Expected)</label>
              <input
                value={edu.endDate}
                onChange={(e) => field("endDate", e.target.value)}
                placeholder="May 2022"
                style={BASE_INPUT}
              />
            </div>
          </div>

          <div>
            <label style={LABEL_STYLE}>Description</label>
            <textarea
              value={edu.description}
              onChange={(e) => field("description", e.target.value)}
              rows={3}
              placeholder="Describe activities, societies, or achievements..."
              style={{ ...BASE_INPUT, whiteSpace: "normal", resize: "vertical", lineHeight: 1.6 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  education: Education[];
  onChange: (updates: Partial<ProfileFormData>) => void;
}

export function EducationSection({ education, onChange }: Props) {
  function addEducation() {
    const newEdu: Education = {
      id: genId(),
      institution: "",
      degree: "",
      field: "",
      gpa: "",
      startDate: "",
      endDate: "",
      description: "",
    };
    onChange({ education: [...education, newEdu] });
  }

  function updateEducation(id: string, updated: Education) {
    onChange({
      education: education.map((e) => (e.id === id ? updated : e)),
    });
  }

  function removeEducation(id: string) {
    onChange({ education: education.filter((e) => e.id !== id) });
  }

  return (
    <div
      className="db-card rounded-2xl p-6 space-y-4 shadow-sm"
      style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 border-l-4 pl-3" style={{ borderColor: "var(--db-primary)" }}>
          <div className="p-2 rounded-lg" style={{ background: "var(--db-primary-10)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--db-primary)" }}>
              school
            </span>
          </div>
          <h3
            className="text-sm font-bold uppercase tracking-widest"
            style={{ color: "var(--db-text)" }}
          >
            Education
          </h3>
        </div>
        {education.length > 0 && (
          <button
            onClick={() => onChange({ education: [] })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{
              color: "var(--db-error, #ef4444)",
              background: "rgba(239, 68, 68, 0.1)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              delete_sweep
            </span>
            Clear All
          </button>
        )}
      </div>

      {education.length > 0 && (
        <div className="space-y-3">
          {education.map((edu) => (
            <EducationItem
              key={edu.id}
              edu={edu}
              onUpdate={(updated) => updateEducation(edu.id, updated)}
              onRemove={() => removeEducation(edu.id)}
            />
          ))}
        </div>
      )}

      <button
        onClick={addEducation}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
        style={{
          border: "1.5px dashed var(--db-border)",
          color: "var(--db-text-muted)",
          background: "transparent",
          transition: "border-color 0.15s ease, color 0.15s ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--db-primary)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--db-primary)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--db-border)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--db-text-muted)";
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
        Add Education
      </button>
    </div>
  );
}
