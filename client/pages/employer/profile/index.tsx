import React, { useCallback, useEffect, useRef, useState } from "react";
import { EmployerDashboardLayout } from "../../../components/layout/EmployerDashboardLayout";
import { useDashboardTheme } from "../../../contexts/DashboardThemeContext";
import type { EmployerProfileData } from "../../../components/employer/profile/types";
import { EMPTY_EMPLOYER_PROFILE } from "../../../components/employer/profile/types";
import {
  EmployerCompletionBar,
  calcEmployerCompletion,
} from "../../../components/employer/profile/EmployerCompletionBar";
import { CompanyInfoSection } from "../../../components/employer/profile/CompanyInfoSection";
import { AboutSection } from "../../../components/employer/profile/AboutSection";
import { ContactSection } from "../../../components/employer/profile/ContactSection";
import { SocialLinksSection } from "../../../components/employer/profile/SocialLinksSection";
import { MONO, SYNE } from "../../../components/employer/profile/shared";

const STORAGE_KEY = "grc_employer_profile";

// ΓöÇΓöÇ Skeleton ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <SkeletonBlock className="w-24 h-24 rounded-2xl flex-shrink-0" />
          <div className="flex-1 space-y-2.5 w-full">
            <SkeletonBlock className="h-7 w-52" />
            <SkeletonBlock className="h-4 w-36" />
            <SkeletonBlock className="h-3 w-28" />
          </div>
          <SkeletonBlock className="h-9 w-28 rounded-lg" />
        </div>
      </div>
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
      >
        <SkeletonBlock className="h-2 w-full rounded-full mb-4" />
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonBlock key={i} className="h-3 w-16" />
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





// ΓöÇΓöÇ Profile Header Card ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function ProfileHeaderCard({
  profile,
  logoImage,
  onLogoClick,
  logoInputRef,
  onLogoChange,
  onEditClick,
}: {
  profile: EmployerProfileData;
  logoImage: string | null;
  onLogoClick: () => void;
  logoInputRef: React.RefObject<HTMLInputElement | null>;
  onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditClick: () => void;
}) {
  const { pct } = calcEmployerCompletion(profile);
  const initials = profile.companyName
    ? profile.companyName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "TC";

  return (
    <div
      className="db-card rounded-2xl overflow-hidden"
      style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
    >
      {/* Top teal band */}
      <div
        className="h-24 relative"
        style={{
          background:
            "linear-gradient(135deg, var(--db-primary-40) 0%, var(--db-primary-20) 60%, var(--db-primary-10) 100%)",
        }}
      >
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, var(--db-primary) 1px, transparent 1px), radial-gradient(circle at 80% 20%, var(--db-primary) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Completion badge */}
        <div
          className="absolute top-3 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
          style={{
            background: "rgba(0,0,0,0.25)",
            color: "#fff",
            backdropFilter: "blur(8px)",
            ...MONO,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
            {pct === 100 ? "verified" : "pending"}
          </span>
          {pct}% complete
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4 -mt-12 mb-4">
          {/* Logo */}
          <div
            className="relative cursor-pointer group flex-shrink-0"
            onClick={onLogoClick}
            title="Upload company logo"
          >
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden text-xl font-bold select-none"
              style={{
                background: "var(--db-primary-20)",
                color: "var(--db-primary)",
                border: "4px solid var(--db-card)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                ...SYNE,
              }}
            >
              {logoImage ? (
                <img src={logoImage} alt="Company logo" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            {/* Hover overlay */}
            <div
              className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{ background: "rgba(0,0,0,0.5)" }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 22, color: "#fff" }}
              >
                photo_camera
              </span>
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/svg+xml"
              className="hidden"
              onChange={onLogoChange}
            />
          </div>

          {/* Edit button */}
          <button
            onClick={onEditClick}
            className="db-btn-secondary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{
              background: "var(--db-btn-sec)",
              color: "var(--db-text-secondary)",
              border: "1px solid var(--db-border)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              edit
            </span>
            Edit Profile
          </button>
        </div>

        {/* Identity */}
        <div className="space-y-2">
          <h2
            className="text-2xl font-bold leading-tight"
            style={{ ...SYNE, color: "var(--db-text)" }}
          >
            {profile.companyName || "Your Company Name"}
          </h2>

          {/* Industry + size chips */}
          <div className="flex flex-wrap items-center gap-2">
            {profile.industry && (
              <span
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: "var(--db-primary-10)",
                  color: "var(--db-primary)",
                  ...MONO,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                  category
                </span>
                {profile.industry}
              </span>
            )}
            {profile.companySize && (
              <span
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: "var(--db-surface)",
                  color: "var(--db-text-secondary)",
                  border: "1px solid var(--db-border)",
                  ...MONO,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                  group
                </span>
                {profile.companySize}
              </span>
            )}
            {profile.foundedYear && (
              <span
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                style={{
                  color: "var(--db-text-muted)",
                  ...MONO,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                  calendar_today
                </span>
                Est. {profile.foundedYear}
              </span>
            )}
            {(profile.city || profile.country) && (
              <span
                className="flex items-center gap-1 text-xs"
                style={{ color: "var(--db-text-muted)" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                  location_on
                </span>
                {[profile.city, profile.country].filter(Boolean).join(", ")}
              </span>
            )}
          </div>

          {/* Tagline */}
          {profile.tagline && (
            <p
              className="text-sm leading-relaxed mt-1"
              style={{ color: "var(--db-text-secondary)", maxWidth: 560 }}
            >
              {profile.tagline}
            </p>
          )}

          {/* Website link */}
          {profile.website && (
            <a
              href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs hover:underline mt-0.5"
              style={{ ...MONO, color: "var(--db-primary)" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                language
              </span>
              {profile.website.replace(/^https?:\/\/(www\.)?/, "")}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ΓöÇΓöÇ Empty state prompt ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function EmptyStateBanner({ onStart }: { onStart: () => void }) {
  return (
    <div
      className="rounded-2xl p-8 flex flex-col items-center text-center gap-5"
      style={{
        background: "var(--db-primary-10)",
        border: "1px dashed var(--db-primary-40)",
      }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "var(--db-primary-20)" }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 32, color: "var(--db-primary)" }}
        >
          business
        </span>
      </div>
      <div>
        <h3 className="text-lg font-bold" style={{ ...SYNE, color: "var(--db-text)" }}>
          Set up your company profile
        </h3>
        <p
          className="text-sm mt-1.5 leading-relaxed max-w-sm"
          style={{ color: "var(--db-text-secondary)" }}
        >
          A complete profile helps GRC professionals understand your company, culture, and the roles you're hiring for -- increasing the quality of your applicants.
        </p>
      </div>
      <button
        onClick={onStart}
        className="db-btn-primary px-6 py-2.5 rounded-full font-bold text-sm"
        style={{ background: "var(--db-primary)", color: "var(--db-primary-text)" }}
      >
        Get Started
      </button>
    </div>
  );
}

// ΓöÇΓöÇ Unsaved-changes bar ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function UnsavedBar({
  saving,
  onSave,
  onCancel,
}: {
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed bottom-0 left-0 lg:left-[260px] right-0 z-40 flex items-center justify-between px-6 lg:px-8 py-4"
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
          onClick={onCancel}
          disabled={saving}
          className="db-btn-secondary px-4 py-2 rounded-lg text-sm font-semibold"
          style={{
            background: "var(--db-btn-sec)",
            color: "var(--db-text-secondary)",
            border: "1px solid var(--db-border)",
          }}
        >
          Discard
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="db-btn-primary px-5 py-2 rounded-lg text-sm font-bold"
          style={{
            background: "var(--db-primary)",
            color: "var(--db-primary-text)",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ΓöÇΓöÇ Save toast ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function SaveToast({ visible }: { visible: boolean }) {
  return (
    <div
      className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300"
      style={{
        background: "var(--db-card)",
        border: "1px solid var(--db-border)",
        color: "var(--db-text)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-8px)",
        pointerEvents: "none",
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 18, color: "#10b981" }}
      >
        check_circle
      </span>
      Profile saved successfully
    </div>
  );
}

// ΓöÇΓöÇ Page ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export default function EmployerProfilePage() {
  const [formData, setFormData] = useState<EmployerProfileData>(EMPTY_EMPLOYER_PROFILE);
  const [original, setOriginal] = useState<EmployerProfileData>(EMPTY_EMPLOYER_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [hasEverSaved, setHasEverSaved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const firstSectionRef = useRef<HTMLDivElement>(null);

  const { theme } = useDashboardTheme();
  void theme;

  const isDirty = JSON.stringify(formData) !== JSON.stringify(original);
  const isBlank =
    !formData.companyName && !formData.industry && !formData.description && !formData.contactName;

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as EmployerProfileData;
        setFormData(parsed);
        setOriginal(parsed);
        setHasEverSaved(true);
        if (parsed.logoUrl) setLogoImage(parsed.logoUrl);
      }
    } catch {
      // fall through -- use empty profile
    }
    setLoading(false);
  }, []);

  // Auto-save to localStorage on every change (debounce-style -- on unmount save too)
  useEffect(() => {
    if (loading) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData, loading]);

  // Hide auth theme toggle
  useEffect(() => {
    const toggle = document.querySelector<HTMLElement>(".theme-toggle");
    if (toggle) toggle.style.display = "none";
    return () => {
      if (toggle) toggle.style.display = "";
    };
  }, []);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = useCallback((updates: Partial<EmployerProfileData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png", "image/svg+xml"].includes(file.type)) return;
    if (file.size > 5 * 1024 * 1024) return;
    const objectUrl = URL.createObjectURL(file);
    setLogoImage(objectUrl);
    // Mark as changed so the unsaved bar appears
    setFormData((prev) => ({ ...prev, logoUrl: objectUrl }));
  }

  function handleCancel() {
    setFormData(original);
    setLogoImage(original.logoUrl);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(original));
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    const d = formData;

    if (!d.companyName) errs.companyName = "Company Name is required.";
    else if (/^[^a-zA-Z0-9]+$/.test(d.companyName)) errs.companyName = "Cannot contain only symbols.";
    
    if (!d.industry) errs.industry = "Please select an industry.";
    if (!d.companySize) errs.companySize = "Please select a company size.";
    if (!d.foundedYear) errs.foundedYear = "Please select a founded year.";
    
    const tryUrl = (url: string, key: string) => {
       if (url) {
         try {
           new URL(url.startsWith("http") ? url : `https://${url}`);
         } catch {
           errs[key] = "Valid URL required.";
         }
       }
    };
    tryUrl(d.website, "website");

    if (!d.description || d.description.trim().length === 0) errs.description = "Company Description is required.";
    else if (d.description.length < 50) errs.description = "Please provide at least 50 characters.";

    if (!d.contactName) errs.contactName = "Contact Name is required.";
    
    if (!d.contactEmail) errs.contactEmail = "Contact Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.contactEmail)) errs.contactEmail = "Enter a valid email address.";

    if (!d.contactPhone) errs.contactPhone = "Phone Number is required.";
    else if (d.contactPhoneCode === "+91" && d.contactPhone.length !== 10) errs.contactPhone = "Must be exactly 10 digits.";

    if (!d.address) errs.address = "Address is required.";
    if (!d.countryCode && !d.country) errs.countryCode = "Country is required.";
    // Only enforce state if country is US/etc or if state field is active, but we can just enforce if stateCode is supported
    if (!d.stateCode && !d.state && d.countryCode) errs.stateCode = "State is required.";
    if (!d.city) errs.city = "City is required.";

    tryUrl(d.linkedInUrl, "linkedInUrl");
    tryUrl(d.twitterUrl, "twitterUrl");
    tryUrl(d.otherUrl, "otherUrl");
    d.customLinks?.forEach((url, i) => tryUrl(url, `customLink_${i}`));

    setErrors(errs);
    return errs;
  }

  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      const firstError = Object.keys(errs)[0];
      const el = document.getElementById(firstError);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus();
      }
      return;
    }

    setSaving(true);
    await new Promise((r) => setTimeout(r, 600)); // simulate network

    // Auto prepend https filter
    const prep = (u: string) => (u && !u.startsWith("http") ? `https://${u}` : u);
    const finalData = {
      ...formData,
      website: prep(formData.website),
      linkedInUrl: prep(formData.linkedInUrl),
      twitterUrl: prep(formData.twitterUrl),
      otherUrl: prep(formData.otherUrl),
      customLinks: formData.customLinks?.map(prep),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(finalData));
    setOriginal(finalData);
    setFormData(finalData);
    setHasEverSaved(true);
    setSaving(false);
    // Show toast
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }

  function handleEditClick() {
    firstSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <EmployerDashboardLayout>
      {/* Save toast */}
      <SaveToast visible={toastVisible} />

      {/* Page header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-semibold" style={{ ...SYNE, color: "var(--db-text)" }}>
            Company Profile
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
            Manage your company identity and preferences on GRC Openings.
          </p>
        </div>

        {/* Preview public profile link */}
        {hasEverSaved && (
          <a
            href="/employer/profile/preview"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (isDirty) {
                e.preventDefault();
                alert("You have unsaved changes. Please save them before previewing.");
              }
            }}
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
            Preview Public Profile
          </a>
        )}
      </header>

      {/* Loading */}
      {loading && <ProfileSkeleton />}

      {/* Content */}
      {!loading && (
        <>
          {/* Profile header card */}
          <ProfileHeaderCard
            profile={formData}
            logoImage={logoImage}
            onLogoClick={() => logoInputRef.current?.click()}
            logoInputRef={logoInputRef}
            onLogoChange={handleLogoChange}
            onEditClick={handleEditClick}
          />

          {/* Completion bar */}
          <EmployerCompletionBar profile={formData} />

          {/* Empty state for brand-new users */}
          {isBlank && !hasEverSaved && (
            <EmptyStateBanner onStart={handleEditClick} />
          )}

          {/* Form sections */}
          <div ref={firstSectionRef} className="scroll-mt-6 space-y-6">
            {/* Single column layout */}
            <div className="max-w-4xl mx-auto space-y-6">
              <CompanyInfoSection data={formData} onChange={handleChange} errors={errors} />
              <AboutSection data={formData} onChange={handleChange} errors={errors} />
              <ContactSection data={formData} onChange={handleChange} errors={errors} />
              <SocialLinksSection data={formData} onChange={handleChange} errors={errors} />
            </div>
          </div>

          {/* Spacer so sticky bar doesn't overlap last card */}
          {isDirty && <div className="h-20" />}
        </>
      )}

      {/* Unsaved changes bar */}
      {isDirty && !loading && (
        <UnsavedBar saving={saving} onSave={handleSave} onCancel={handleCancel} />
      )}
    </EmployerDashboardLayout>
  );
}
