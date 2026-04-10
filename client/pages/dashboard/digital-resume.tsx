import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { apiFetch } from "../../lib/api";
import { getStoredUser } from "../../lib/auth";
import type { ProfileFormData } from "../../components/profile/types";

interface ApiProfilePayload {
  profile: {
    firstName: string;
    middleName: string | null;
    lastName: string;
    headline: string | null;
    bio: string | null;
    location: string | null;
    linkedInUrl: string | null;
    avatarUrl: string | null;
    resumeUrl: string | null;
    skills: { id: string; name: string }[];
    workExperiences: {
      id: string;
      title: string;
      company: string;
      location: string | null;
      startDate: string;
      endDate: string | null;
      current: boolean;
      description: string | null;
    }[];
    certifications: { id: string; name: string }[];
    user: { email: string };
  };
}

function mapApiToForm(api: ApiProfilePayload): ProfileFormData {
  const p = api.profile;
  return {
    firstName: p.firstName,
    middleName: p.middleName ?? "",
    lastName: p.lastName,
    professionalTitle: p.headline ?? "",
    email: p.user.email,
    location: p.location ?? "",
    linkedInUrl: p.linkedInUrl ?? "",
    summary: p.bio ?? "",
    workExperience: p.workExperiences.map((wx) => ({
      id: wx.id,
      title: wx.title,
      company: wx.company,
      location: wx.location ?? "",
      startDate: wx.startDate,
      endDate: wx.endDate ?? "",
      current: wx.current,
      description: wx.description ?? "",
    })),
    coreCompetencies: p.skills.map((s) => s.name),
    certifications: p.certifications.map((c) => ({ id: c.id, name: c.name })),
    resumeUrl: p.resumeUrl,
    resumeFileName: p.resumeUrl ? "Resume.pdf" : null,
    avatarUrl: p.avatarUrl,
  };
}

const SYNE = { fontFamily: "'Syne', sans-serif" };
const MONO = { fontFamily: "'JetBrains Mono', monospace" };

const EMPTY: ProfileFormData = {
  firstName: "",
  middleName: "",
  lastName: "",
  professionalTitle: "",
  email: "",
  location: "",
  linkedInUrl: "",
  summary: "",
  workExperience: [],
  coreCompetencies: [],
  certifications: [],
  resumeUrl: null,
  resumeFileName: null,
  avatarUrl: null,
};

export default function DigitalResumePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileFormData>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = getStoredUser()?.id ?? null;
    const storageKey = userId ? `grc_profile_${userId}` : null;

    // Fast path: load from user-scoped cache
    if (storageKey) {
      try {
        const cached = localStorage.getItem(storageKey);
        if (cached) {
          setProfile(JSON.parse(cached) as ProfileFormData);
          setLoading(false);
          return;
        }
      } catch {
        // ignore parse errors, fall through to API
      }
    }

    // No cache — fetch from API
    apiFetch<ApiProfilePayload>("/profile/seeker")
      .then((res) => {
        const mapped = mapApiToForm(res);
        setProfile(mapped);
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify(mapped));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const fullName = [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(" ");
  const initials = (profile.firstName?.[0] ?? "") + (profile.lastName?.[0] ?? "");

  return (
    <DashboardLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="flex items-center justify-between">
        <div>
          <h2
            className="text-3xl font-semibold"
            style={{ ...SYNE, color: "var(--db-text)" }}
          >
            Digital Resume
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
            Your profile as a shareable digital resume.
          </p>
        </div>

        <button
          onClick={() => router.push("/dashboard/profile")}
          className="db-btn-secondary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{
            background: "var(--db-btn-sec)",
            color: "var(--db-text-secondary)",
            border: "1px solid var(--db-border)",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            arrow_back
          </span>
          Back to Profile
        </button>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <span
            className="material-symbols-outlined animate-spin"
            style={{ fontSize: 32, color: "var(--db-primary)" }}
          >
            progress_activity
          </span>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
        >
          {/* ── Identity banner ──────────────────────────────── */}
          <div
            className="px-8 py-8 flex items-center gap-6"
            style={{
              borderBottom: "1px solid var(--db-border)",
              background: "var(--db-sidebar)",
            }}
          >
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shrink-0"
              style={{
                background: "var(--db-primary-20)",
                color: "var(--db-primary)",
                border: "3px solid var(--db-primary-40)",
                ...SYNE,
              }}
            >
              {initials || "?"}
            </div>

            <div className="flex-1">
              <h1
                className="text-2xl font-bold"
                style={{ ...SYNE, color: "var(--db-text)" }}
              >
                {fullName || "—"}
              </h1>
              {profile.professionalTitle && (
                <p
                  className="mt-0.5 text-base font-medium"
                  style={{ color: "var(--db-primary)" }}
                >
                  {profile.professionalTitle}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-2">
                {profile.location && (
                  <span
                    className="flex items-center gap-1 text-sm"
                    style={{ color: "var(--db-text-muted)" }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      location_on
                    </span>
                    {profile.location}
                  </span>
                )}
                {profile.email && (
                  <span
                    className="flex items-center gap-1 text-sm"
                    style={{ color: "var(--db-text-muted)" }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      mail
                    </span>
                    {profile.email}
                  </span>
                )}
                {profile.linkedInUrl && (
                  <span
                    className="flex items-center gap-1 text-sm"
                    style={{ color: "var(--db-text-muted)", ...MONO }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      link
                    </span>
                    {profile.linkedInUrl}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Body ─────────────────────────────────────────── */}
          <div className="px-8 py-8 space-y-8">

            {/* Summary */}
            {profile.summary && (
              <section>
                <SectionHeading icon="notes" label="Summary" />
                <p
                  className="mt-3 text-sm leading-relaxed"
                  style={{ color: "var(--db-text-muted)" }}
                >
                  {profile.summary}
                </p>
              </section>
            )}

            {/* Work Experience */}
            {profile.workExperience.length > 0 && (
              <section>
                <SectionHeading icon="work" label="Work Experience" />
                <div className="mt-3 space-y-5">
                  {profile.workExperience.map((wx) => (
                    <div key={wx.id} className="flex gap-4">
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center pt-1">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: "var(--db-primary)" }}
                        />
                        <div
                          className="w-px flex-1 mt-1"
                          style={{ background: "var(--db-border)" }}
                        />
                      </div>

                      <div className="pb-2">
                        <p
                          className="text-sm font-semibold"
                          style={{ color: "var(--db-text)" }}
                        >
                          {wx.title}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "var(--db-primary)" }}
                        >
                          {wx.company}
                          {wx.location ? ` · ${wx.location}` : ""}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ ...MONO, color: "var(--db-text-muted)" }}
                        >
                          {wx.startDate} — {wx.current ? "Present" : wx.endDate}
                        </p>
                        {wx.description && (
                          <p
                            className="text-sm mt-2 leading-relaxed"
                            style={{ color: "var(--db-text-muted)" }}
                          >
                            {wx.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Skills */}
            {profile.coreCompetencies.length > 0 && (
              <section>
                <SectionHeading icon="psychology" label="Core Competencies" />
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.coreCompetencies.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: "var(--db-primary-20)",
                        color: "var(--db-primary)",
                        border: "1px solid var(--db-primary-40)",
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Certifications */}
            {profile.certifications.length > 0 && (
              <section>
                <SectionHeading icon="verified" label="Certifications" />
                <ul className="mt-3 space-y-2">
                  {profile.certifications.map((cert) => (
                    <li key={cert.id} className="flex items-center gap-2">
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 16, color: "var(--db-primary)" }}
                      >
                        workspace_premium
                      </span>
                      <span
                        className="text-sm"
                        style={{ color: "var(--db-text)" }}
                      >
                        {cert.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function SectionHeading({ icon, label }: { icon: string; label: string }) {
  return (
    <div
      className="flex items-center gap-2 pb-2"
      style={{ borderBottom: "1px solid var(--db-border)" }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 18, color: "var(--db-primary)" }}
      >
        {icon}
      </span>
      <h2
        className="text-sm font-semibold uppercase tracking-widest"
        style={{ color: "var(--db-text)", fontFamily: "'JetBrains Mono', monospace" }}
      >
        {label}
      </h2>
    </div>
  );
}
