import { useEffect, useState, useCallback, useRef } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { apiFetch } from "../../lib/api";
import { fetchMockProfile, mapApiToForm } from "../../lib/mockProfile";
import type { ApiProfile } from "../../lib/mockProfile";
import { ProfileCompletionBar, calcCompletion } from "../../components/profile/ProfileCompletionBar";
import { ResumeSection } from "../../components/profile/ResumeSection";
import { PersonalInfoSection } from "../../components/profile/PersonalInfoSection";
import { SummarySection } from "../../components/profile/SummarySection";
import { WorkExperienceSection } from "../../components/profile/WorkExperienceSection";
import { SkillsSection } from "../../components/profile/SkillsSection";
import type { ProfileFormData } from "../../components/profile/types";

// ─── Toggle this flag to switch between mock and real API ───────────────────
const USE_MOCK = true;
// ────────────────────────────────────────────────────────────────────────────

const SYNE = { fontFamily: "'Syne', sans-serif" };
const MONO = { fontFamily: "'JetBrains Mono', monospace" };

const EMPTY_PROFILE: ProfileFormData = {
  firstName: "",
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

async function loadProfile(): Promise<ApiProfile> {
  if (USE_MOCK) return fetchMockProfile();
  return apiFetch<ApiProfile>("/profile");
}

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`rounded animate-pulse ${className}`}
      style={{ background: "var(--db-border)" }}
    />
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-5">
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
      >
        <div className="flex items-center gap-5">
          <SkeletonBlock className="w-20 h-20 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2.5">
            <SkeletonBlock className="h-6 w-48" />
            <SkeletonBlock className="h-4 w-36" />
            <SkeletonBlock className="h-3 w-24" />
          </div>
        </div>
      </div>
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
      >
        <SkeletonBlock className="h-2 w-full rounded-full mb-4" />
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonBlock key={i} className="h-3 w-20" />
          ))}
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
        >
          <SkeletonBlock className="h-4 w-40" />
          <div className="grid grid-cols-2 gap-4">
            <SkeletonBlock className="h-10" />
            <SkeletonBlock className="h-10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const [formData, setFormData] = useState<ProfileFormData>(EMPTY_PROFILE);
  const [original, setOriginal] = useState<ProfileFormData>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isDirty = JSON.stringify(formData) !== JSON.stringify(original);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) return;
    if (file.size > 5 * 1024 * 1024) return; // 5 MB limit
    const objectUrl = URL.createObjectURL(file);
    setProfileImage(objectUrl);
    // TODO: Upload to backend when API endpoint is available
    // const body = new FormData(); body.append("avatar", file);
    // await apiFetch("/profile/avatar", { method: "POST", body });
  }

  useEffect(() => {
    loadProfile()
      .then((api) => {
        const mapped = mapApiToForm(api);
        setFormData(mapped);
        setOriginal(mapped);
      })
      .catch((err: Error) => {
        if (
          !err.message.includes("404") &&
          !err.message.toLowerCase().includes("no seeker")
        ) {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = useCallback((updates: Partial<ProfileFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  function handleCancel() {
    setFormData(original);
  }

  async function handleSave() {
    setSaving(true);
    try {
      // TODO: Call PATCH /profile when server endpoint is available
      setOriginal(formData);
    } finally {
      setSaving(false);
    }
  }

  const { pct: completionPct } = calcCompletion(formData);
  const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(" ");
  const initials = (formData.firstName?.[0] ?? "") + (formData.lastName?.[0] ?? "");

  return (
    <DashboardLayout>
      {/* ── Page header ─────────────────────────────────────────── */}
      <header className="flex items-center justify-between">
        <div>
          <h2
            className="text-3xl font-semibold"
            style={{ ...SYNE, color: "var(--db-text)" }}
          >
            My Profile
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
            Your professional presence on GRC Openings.
          </p>
        </div>

        {!loading && completionPct === 100 && (
          <a
            href="/dashboard/digital-resume"
            target="_blank"
            rel="noopener noreferrer"
            className="db-btn-secondary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{
              background: "var(--db-btn-sec)",
              color: "var(--db-text-secondary)",
              border: "1px solid var(--db-border)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              visibility
            </span>
            Preview Resume
          </a>
        )}
      </header>

      {/* ── Mock badge ───────────────────────────────────────────── */}
      {USE_MOCK && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold w-fit"
          style={{
            background: "rgba(245,158,11,0.12)",
            border: "1px solid rgba(245,158,11,0.3)",
            color: "#f59e0b",
            ...MONO,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            science
          </span>
          Mock data active — set USE_MOCK = false to connect real API
        </div>
      )}

      {/* ── Loading ──────────────────────────────────────────────── */}
      {loading && <ProfileSkeleton />}

      {/* ── Error ────────────────────────────────────────────────── */}
      {!loading && error && (
        <div
          className="rounded-2xl p-6 flex items-center gap-3"
          style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#ef4444" }}>
            error
          </span>
          <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
            Failed to load profile: {error}
          </p>
        </div>
      )}

      {/* ── Profile form ─────────────────────────────────────────── */}
      {!loading && !error && (
        <>
          {/* Identity card */}
          <div
            className="db-card db-card-hover rounded-2xl p-6"
            style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
          >
            <div className="flex items-center gap-5">
              {/* Avatar — click to upload photo */}
              <div
                className="relative w-20 h-20 rounded-full flex-shrink-0 cursor-pointer group"
                onClick={() => avatarInputRef.current?.click()}
                title="Upload profile photo"
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden text-2xl font-bold select-none"
                  style={{
                    background: "var(--db-primary-20)",
                    color: "var(--db-primary)",
                    border: "3px solid var(--db-primary-40)",
                    ...SYNE,
                  }}
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : initials ? (
                    initials
                  ) : (
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 32, color: "var(--db-primary)" }}
                    >
                      person
                    </span>
                  )}
                </div>

                {/* Hover overlay */}
                <div
                  className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  style={{ background: "rgba(0,0,0,0.45)" }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 22, color: "#fff" }}
                  >
                    photo_camera
                  </span>
                </div>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  className="text-2xl font-bold truncate"
                  style={{ ...SYNE, color: "var(--db-text)" }}
                >
                  {fullName || "Your Name"}
                </h3>
                {formData.professionalTitle && (
                  <p className="text-sm font-medium mt-0.5" style={{ color: "var(--db-primary)" }}>
                    {formData.professionalTitle}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                  {formData.location && (
                    <span
                      className="flex items-center gap-1 text-xs min-w-0"
                      style={{ color: "var(--db-text-muted)", maxWidth: 240 }}
                    >
                      <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 13 }}>
                        location_on
                      </span>
                      <span className="truncate">{formData.location}</span>
                    </span>
                  )}
                  {formData.linkedInUrl && (
                    <a
                      href={
                        formData.linkedInUrl.startsWith("http")
                          ? formData.linkedInUrl
                          : `https://${formData.linkedInUrl}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs hover:underline min-w-0"
                      style={{ ...MONO, color: "var(--db-text-muted)", maxWidth: 220 }}
                    >
                      <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 13 }}>
                        link
                      </span>
                      <span className="truncate">
                        {formData.linkedInUrl.replace(/^https?:\/\/(www\.)?/, "")}
                      </span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Completion Indicator */}
          <ProfileCompletionBar profile={formData} />

          {/* Resume / CV — top of form per spec */}
          <ResumeSection
            resumeUrl={formData.resumeUrl}
            resumeFileName={formData.resumeFileName}
            onChange={handleChange}
          />

          {/* Personal Information */}
          <PersonalInfoSection data={formData} onChange={handleChange} />

          {/* Professional Summary */}
          <SummarySection summary={formData.summary} onChange={handleChange} />

          {/* Work Experience */}
          <WorkExperienceSection
            workExperience={formData.workExperience}
            onChange={handleChange}
          />

          {/* Skills & Certifications */}
          <SkillsSection
            coreCompetencies={formData.coreCompetencies}
            certifications={formData.certifications}
            onChange={handleChange}
          />

          {isDirty && <div className="h-20" />}
        </>
      )}

      {/* ── Unsaved changes bar ───────────────────────────────────── */}
      {isDirty && !loading && (
        <div
          className="fixed bottom-0 left-[260px] right-0 z-40 flex items-center justify-between px-8 py-4"
          style={{
            background: "var(--db-card)",
            borderTop: "1px solid var(--db-border)",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: "#f59e0b" }}
            />
            <span className="text-sm font-medium" style={{ color: "var(--db-text-muted)" }}>
              Unsaved changes detected
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="db-btn-secondary px-4 py-2 rounded-lg text-sm font-semibold"
              style={{
                background: "var(--db-btn-sec)",
                color: "var(--db-text-secondary)",
                border: "1px solid var(--db-border)",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="db-btn-primary px-5 py-2 rounded-lg text-sm font-bold"
              style={{
                background: "var(--db-primary)",
                color: "var(--db-primary-text)",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
