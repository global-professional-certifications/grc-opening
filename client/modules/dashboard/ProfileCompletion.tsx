import { useEffect, useState } from "react";
import { useRouter } from "next/router";

// Field names here match the raw API response from /profile/seeker (Prisma shape),
// NOT the mapped ProfileFormData shape used in the profile editor.
// API: bio (not summary), headline (not professionalTitle),
//      workExperiences (not workExperience), educations (not education),
//      skills (not coreCompetencies).
const ITEMS_DEF = [
  {
    key: "resume",
    label: "Upload your resume",
    check: (p: any) => !!p.resumeUrl,
  },
  {
    key: "info",
    label: "Complete personal information",
    check: (p: any) => !!(p.firstName && p.lastName && p.headline),
  },
  {
    key: "summary",
    label: "Write a professional summary",
    check: (p: any) => (p.bio ?? "").trim().length > 0,
  },
  {
    key: "experience",
    label: "Add work experience",
    check: (p: any) => Array.isArray(p.workExperiences) && p.workExperiences.length > 0,
  },
  {
    key: "education",
    label: "Add education details",
    check: (p: any) => Array.isArray(p.educations) && p.educations.length > 0,
  },
  {
    key: "skills",
    label: "Add core competencies",
    check: (p: any) => Array.isArray(p.skills) && p.skills.length > 0,
  },
  {
    key: "certifications",
    label: "Add GRC certifications",
    check: (p: any) => Array.isArray(p.certifications) && p.certifications.length > 0,
  },
];

export function ProfileCompletion() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import("../../lib/api").then(({ apiFetch }) => {
      apiFetch<{ profile: any }>("/profile/seeker")
        .then(res => setProfile(res.profile))
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, []);

  const allItems = ITEMS_DEF.map(def => ({
    label: def.label,
    done: profile ? def.check(profile) : false,
  }));

  const doneCount = allItems.filter(i => i.done).length;
  const pct = allItems.length > 0
    ? Math.round((doneCount / allItems.length) * 100)
    : 0;

  // Show up to 4 items — incomplete ones first so the user sees what's left
  const displayItems = [
    ...allItems.filter(i => !i.done),
    ...allItems.filter(i => i.done),
  ].slice(0, 4);

  return (
    <div className="db-card p-6 shadow-md border border-transparent">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold border-l-4 pl-3" style={{ color: "var(--db-text)", borderColor: "var(--db-primary)" }}>
          Profile Completion
        </h3>
        <span className="text-sm font-bold" style={{ color: "var(--db-primary)" }}>
          {loading ? "—" : `${pct}% Completed`}
        </span>
      </div>

      {/* Progress bar */}
      {!loading && (
        <div className="mb-5 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--db-border)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: "var(--db-primary)" }}
          />
        </div>
      )}

      <div className="space-y-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-5 h-5 rounded-full" style={{ background: "var(--db-border)" }} />
                <div className="h-3 rounded flex-1" style={{ background: "var(--db-border)", maxWidth: i % 2 === 0 ? "60%" : "75%" }} />
              </div>
            ))
          : displayItems.map(item => (
              <div key={item.label} className={`flex items-center gap-3 ${item.done ? "" : "opacity-60"}`}>
                <span
                  className="material-symbols-outlined shrink-0"
                  style={{ fontSize: 20, color: item.done ? "var(--db-primary)" : "var(--db-text-muted)" }}
                >
                  {item.done ? "check_circle" : "circle"}
                </span>
                <span
                  className="text-sm font-medium"
                  style={{
                    color: item.done ? "var(--db-text-secondary)" : "var(--db-text-muted)",
                    fontStyle: item.done ? undefined : "italic",
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))
        }
      </div>

      <button
        onClick={() => router.push("/dashboard/profile")}
        className="db-btn-primary mt-6 w-full py-2.5 text-xs font-bold uppercase tracking-widest rounded-full cursor-pointer transition-all duration-200"
        style={{ background: "var(--db-primary)", color: "#ffffff", boxShadow: "0 4px 12px var(--db-primary-20)" }}
      >
        {!loading && pct === 100 ? "View Profile" : "Complete Profile"}
      </button>
    </div>
  );
}
