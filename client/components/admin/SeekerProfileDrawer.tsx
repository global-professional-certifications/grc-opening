import { useEffect, useState } from "react";
import { adminFetch } from "../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WorkExperience {
  id: string;
  title: string;
  company: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string | null;
}

interface Education {
  id: string;
  institution: string;
  degree: string | null;
  field: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface Certification {
  id: string;
  name: string;
}

interface SeekerApplication {
  id: string;
  status: string;
  appliedAt: string;
  job: {
    id: string;
    title: string;
    status: string;
    employer: { companyName: string; isVerified: boolean };
  };
}

interface SeekerProfile {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  headline: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  country: string | null;
  resumeUrl: string | null;
  linkedInUrl: string | null;
  avatarUrl: string | null;
  skills: { id: string; name: string }[];
  workExperiences: WorkExperience[];
  educations: Education[];
  certifications: Certification[];
  applications: SeekerApplication[];
  user: { email: string; status: string; createdAt: string; role: string };
}

// ── Status badge helper ───────────────────────────────────────────────────────

const APP_STATUS_COLORS: Record<string, string> = {
  PENDING:      "bg-gray-100 text-gray-600 border-gray-200",
  REVIEWING:    "bg-blue-50 text-blue-700 border-blue-200",
  INTERVIEWING: "bg-purple-50 text-purple-700 border-purple-200",
  HIRED:        "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED:     "bg-red-50 text-red-600 border-red-200",
  WITHDRAWN:    "bg-amber-50 text-amber-700 border-amber-200",
};

// ── Component ─────────────────────────────────────────────────────────────────

interface SeekerProfileDrawerProps {
  seekerId: string | null;
  onClose: () => void;
}

export function SeekerProfileDrawer({ seekerId, onClose }: SeekerProfileDrawerProps) {
  const [profile, setProfile] = useState<SeekerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!seekerId) { setProfile(null); return; }
    setLoading(true);
    setError("");
    adminFetch<{ seeker: SeekerProfile }>(`/admin/seekers/${seekerId}`)
      .then(d => setProfile(d.seeker))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [seekerId]);

  const open = !!seekerId;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full z-50 w-[520px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#3a1292]" style={{ fontSize: 20 }}>person</span>
            <h2 className="text-[15px] font-bold text-gray-800">Seeker Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-gray-500" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#3a1292]/30 border-t-[#3a1292] rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px]">{error}</div>
          )}

          {profile && !loading && (
            <>
              {/* Identity */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#3a1292]/10 flex items-center justify-center shrink-0 text-[20px] font-bold text-[#3a1292] uppercase">
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-[16px] font-bold text-gray-900">
                    {profile.firstName} {profile.middleName ? `${profile.middleName} ` : ""}{profile.lastName}
                  </p>
                  {profile.headline && <p className="text-[12px] text-gray-500 mt-0.5">{profile.headline}</p>}
                  <p className="text-[11px] text-gray-400 mt-0.5">{profile.user.email}</p>
                </div>
              </div>

              {/* Quick info pills */}
              <div className="flex flex-wrap gap-2">
                {profile.location && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-600 bg-gray-100 rounded-full px-2.5 py-1">
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>location_on</span>
                    {profile.location}{profile.country ? `, ${profile.country}` : ""}
                  </span>
                )}
                {profile.phone && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-600 bg-gray-100 rounded-full px-2.5 py-1">
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>call</span>
                    {profile.phone}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 text-[11px] rounded-full px-2.5 py-1 border font-semibold ${
                  profile.user.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-600 border-red-200"
                }`}>
                  {profile.user.status}
                </span>
              </div>

              {/* Resume & LinkedIn */}
              {(profile.resumeUrl || profile.linkedInUrl) && (
                <div className="flex gap-3">
                  {profile.resumeUrl && (
                    <a
                      href={profile.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-[12px] font-semibold text-gray-700 hover:border-[#3a1292] hover:text-[#3a1292] transition-all"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>description</span>
                      View Resume
                    </a>
                  )}
                  {profile.linkedInUrl && (
                    <a
                      href={profile.linkedInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-[12px] font-semibold text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-all"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
                      LinkedIn
                    </a>
                  )}
                </div>
              )}

              {/* Bio */}
              {profile.bio && (
                <Section title="About">
                  <p className="text-[12px] text-gray-600 leading-relaxed">{profile.bio}</p>
                </Section>
              )}

              {/* Skills */}
              {profile.skills.length > 0 && (
                <Section title="Skills">
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map(s => (
                      <span key={s.id} className="text-[11px] font-medium bg-[#3a1292]/8 text-[#3a1292] border border-[#3a1292]/20 px-2.5 py-1 rounded-full">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Certifications */}
              {profile.certifications.length > 0 && (
                <Section title="Certifications">
                  <div className="flex flex-wrap gap-1.5">
                    {profile.certifications.map(c => (
                      <span key={c.id} className="text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                        {c.name}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Work Experience */}
              {profile.workExperiences.length > 0 && (
                <Section title="Work Experience">
                  <div className="space-y-3">
                    {profile.workExperiences.map(w => (
                      <div key={w.id} className="border-l-2 border-[#3a1292]/20 pl-3">
                        <p className="text-[12px] font-bold text-gray-800">{w.title}</p>
                        <p className="text-[11px] text-gray-500">{w.company}{w.location ? ` · ${w.location}` : ""}</p>
                        <p className="text-[10px] text-gray-400">
                          {w.startDate} – {w.current ? "Present" : (w.endDate ?? "—")}
                        </p>
                        {w.description && <p className="text-[11px] text-gray-500 mt-1">{w.description}</p>}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Education */}
              {profile.educations.length > 0 && (
                <Section title="Education">
                  <div className="space-y-3">
                    {profile.educations.map(e => (
                      <div key={e.id} className="border-l-2 border-gray-200 pl-3">
                        <p className="text-[12px] font-bold text-gray-800">{e.institution}</p>
                        {(e.degree || e.field) && (
                          <p className="text-[11px] text-gray-500">{[e.degree, e.field].filter(Boolean).join(" · ")}</p>
                        )}
                        {(e.startDate || e.endDate) && (
                          <p className="text-[10px] text-gray-400">{e.startDate} – {e.endDate ?? "—"}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Application History */}
              <Section title={`Application History (${profile.applications.length})`}>
                {profile.applications.length === 0 ? (
                  <p className="text-[12px] text-gray-400">No applications yet.</p>
                ) : (
                  <div className="space-y-2">
                    {profile.applications.map(app => (
                      <div key={app.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-gray-800 truncate">{app.job.title}</p>
                          <p className="text-[10px] text-gray-400 truncate">
                            {app.job.employer.companyName}
                            {app.job.employer.isVerified && " ✓"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${APP_STATUS_COLORS[app.status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                            {app.status}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(app.appliedAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{title}</p>
      {children}
    </div>
  );
}
