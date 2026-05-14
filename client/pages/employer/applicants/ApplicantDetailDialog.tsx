import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

const POPPINS = { fontFamily: "'Poppins', sans-serif" };
const MONO    = { fontFamily: "'JetBrains Mono', monospace" };
const SYNE    = { fontFamily: "'Poppins', sans-serif" };

const PRIMARY        = "var(--db-primary)";
const BORDER         = "var(--db-border)";
const TEXT_PRIMARY   = "var(--db-text)";
const TEXT_SECONDARY = "var(--db-text-secondary)";
const TEXT_MUTED     = "var(--db-text-muted)";
const CARD           = "var(--db-card)";

type WorkExperience = {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
};

type Education = {
  id: string;
  institution: string;
  degree: string;
  field: string;
  gpa: string;
  startDate: string;
  endDate: string;
  description: string;
};

type ApplicantDetail = {
  id: string;
  status: string;
  appliedAt: string;
  notes: string | null;
  jobId: string;
  jobTitle: string;
  seeker: {
    id: string;
    fullName: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    email: string;
    phone: string;
    headline: string;
    country: string;
    location: string;
    bio: string;
    resumeUrl: string;
    linkedInUrl: string;
    avatarUrl: string;
    memberSince: string;
    skills: string[];
    certifications: string[];
    workExperiences: WorkExperience[];
    educations: Education[];
  };
};

function SectionLabel({ text }: { text: string }) {
  return (
    <h4
      className="text-[0.7rem] uppercase tracking-[0.26em] font-bold mb-3"
      style={{ color: PRIMARY, ...MONO }}
    >
      {text}
    </h4>
  );
}

function InfoRow({ icon, label, value, href }: { icon: string; label: string; value: string; href?: string }) {
  return (
    <div
      className="flex items-start gap-3 rounded-[14px] border px-4 py-3"
      style={{ background: CARD, borderColor: BORDER }}
    >
      <span className="material-symbols-outlined shrink-0" style={{ fontSize: 20, color: PRIMARY }}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[0.62rem] uppercase tracking-[0.22em] font-bold" style={{ color: TEXT_MUTED, ...MONO }}>
          {label}
        </div>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.92rem] font-semibold break-all hover:underline"
            style={{ color: PRIMARY }}
          >
            {value}
          </a>
        ) : (
          <div className="text-[0.92rem] font-semibold break-words" style={{ color: TEXT_PRIMARY }}>
            {value}
          </div>
        )}
      </div>
    </div>
  );
}

export function ApplicantDetailDialog({
  applicationId,
  onClose,
}: {
  applicationId: string;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<ApplicantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 220);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    let mounted = true;
    apiFetch<{ application: ApplicantDetail }>(`/applications/${applicationId}/detail`)
      .then((res) => { if (mounted) setDetail(res.application); })
      .catch((e) => { if (mounted) setError(e instanceof Error ? e.message : "Failed to load applicant"); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [applicationId]);

  const seeker = detail?.seeker;
  const initials = seeker
    ? `${seeker.firstName.charAt(0)}${seeker.lastName.charAt(0)}`.toUpperCase()
    : "—";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-5"
      style={{
        background: visible ? "rgba(0,0,0,0.54)" : "rgba(0,0,0,0)",
        backdropFilter: visible ? "blur(6px)" : "blur(0px)",
        transition: "background 0.22s ease, backdrop-filter 0.22s ease",
      }}
      onClick={handleClose}
    >
      <div
        className="relative flex flex-col w-full sm:max-w-[880px] rounded-t-[28px] sm:rounded-[28px] overflow-hidden"
        style={{
          background: "var(--db-dialog-bg, #ffffff)",
          border: `1px solid ${BORDER}`,
          boxShadow: "0 40px 100px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)",
          maxHeight: "92vh",
          transform: visible ? "translateY(0) scale(1)" : "translateY(44px) scale(0.96)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.22s cubic-bezier(0.34,1.36,0.64,1), opacity 0.18s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="shrink-0 px-6 py-5 sm:px-8 sm:py-6 border-b flex items-start gap-4"
          style={{ borderColor: BORDER }}
        >
          <div
            className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-2xl text-xl font-bold overflow-hidden"
            style={{
              background: "linear-gradient(160deg,#f4f2ea 0%,#d8dfdb 100%)",
              color: "#2c3a4f",
              ...POPPINS,
            }}
          >
            {seeker?.avatarUrl ? (
              <img src={seeker.avatarUrl} alt={seeker.fullName} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[0.7rem] uppercase tracking-[0.22em] font-bold" style={{ color: PRIMARY, ...MONO }}>
                Applicant
              </span>
              {detail && (
                <span
                  className="rounded-full px-2.5 py-0.5 text-[0.6rem] uppercase tracking-wider font-bold"
                  style={{ background: "var(--db-primary-10)", color: PRIMARY, ...MONO }}
                >
                  {detail.status}
                </span>
              )}
            </div>
            <h2 className="mt-1 text-xl sm:text-[1.55rem] font-bold leading-tight" style={{ color: TEXT_PRIMARY, ...SYNE }}>
              {seeker?.fullName || (loading ? "Loading…" : "—")}
            </h2>
            {seeker?.headline && (
              <p className="mt-1 text-[0.9rem]" style={{ color: TEXT_SECONDARY }}>{seeker.headline}</p>
            )}
            {detail && (
              <p className="mt-1 text-[0.78rem]" style={{ color: TEXT_MUTED }}>
                Applied to <span style={{ color: PRIMARY, fontWeight: 700 }}>{detail.jobTitle}</span>
                {" · "}
                {new Date(detail.appliedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            )}
          </div>

          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all hover:scale-110 active:scale-95"
            style={{ background: CARD, borderColor: BORDER, color: TEXT_SECONDARY }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8 space-y-8" style={POPPINS}>
          {loading ? (
            <div className="flex items-center justify-center py-10" style={{ color: TEXT_MUTED }}>
              Loading applicant details…
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 rounded-[16px] border px-5 py-4"
              style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.25)", color: "#f87171" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>error</span>
              <span className="text-[0.9rem]">{error}</span>
            </div>
          ) : seeker ? (
            <>
              {/* Contact */}
              <section>
                <SectionLabel text="Contact" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow icon="mail" label="Email" value={seeker.email} href={`mailto:${seeker.email}`} />
                  {seeker.phone
                    ? <InfoRow icon="phone" label="Phone" value={seeker.phone} href={`tel:${seeker.phone}`} />
                    : <InfoRow icon="phone" label="Phone" value="Not provided" />
                  }
                  {seeker.location && (
                    <InfoRow icon="location_on" label="Location" value={seeker.location} />
                  )}
                  {seeker.country && (
                    <InfoRow icon="public" label="Country" value={seeker.country} />
                  )}
                  {seeker.linkedInUrl && (
                    <InfoRow icon="link" label="LinkedIn" value={seeker.linkedInUrl} href={seeker.linkedInUrl} />
                  )}
                  {seeker.resumeUrl && (
                    <InfoRow icon="description" label="Resume" value="Open Resume" href={seeker.resumeUrl} />
                  )}
                </div>
              </section>

              {/* Bio */}
              <section>
                <SectionLabel text="About" />
                {seeker.bio ? (
                  <p className="text-[0.92rem] leading-[1.78] whitespace-pre-line" style={{ color: TEXT_SECONDARY }}>
                    {seeker.bio}
                  </p>
                ) : (
                  <div className="text-[0.9rem] italic" style={{ color: TEXT_MUTED }}>Not provided by the applicant.</div>
                )}
              </section>

              {/* Work Experience */}
              <section>
                <SectionLabel text="Work Experience" />
                {seeker.workExperiences.length > 0 ? (
                  <div className="space-y-3">
                    {seeker.workExperiences.map((w) => (
                      <div key={w.id}
                        className="rounded-[16px] border px-5 py-4"
                        style={{ background: CARD, borderColor: BORDER }}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[1rem] font-bold" style={{ color: TEXT_PRIMARY }}>{w.title}</div>
                            <div className="text-[0.85rem]" style={{ color: PRIMARY, fontWeight: 600 }}>
                              {w.company}{w.location ? ` · ${w.location}` : ""}
                            </div>
                          </div>
                          <div className="text-[0.72rem] uppercase tracking-[0.18em] font-bold" style={{ color: TEXT_MUTED, ...MONO }}>
                            {w.startDate} — {w.current ? "Present" : (w.endDate || "—")}
                          </div>
                        </div>
                        {w.description && (
                          <p className="mt-2 text-[0.88rem] leading-[1.7] whitespace-pre-line" style={{ color: TEXT_SECONDARY }}>
                            {w.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[0.9rem] italic" style={{ color: TEXT_MUTED }}>No work experience provided.</div>
                )}
              </section>

              {/* Education */}
              <section>
                <SectionLabel text="Education" />
                {seeker.educations.length > 0 ? (
                  <div className="space-y-3">
                    {seeker.educations.map((e) => (
                      <div key={e.id}
                        className="rounded-[16px] border px-5 py-4"
                        style={{ background: CARD, borderColor: BORDER }}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[1rem] font-bold" style={{ color: TEXT_PRIMARY }}>{e.institution}</div>
                            <div className="text-[0.85rem]" style={{ color: PRIMARY, fontWeight: 600 }}>
                              {e.degree}{e.field ? ` in ${e.field}` : ""}
                              {e.gpa ? ` · GPA: ${e.gpa}` : ""}
                            </div>
                          </div>
                          <div className="text-[0.72rem] uppercase tracking-[0.18em] font-bold" style={{ color: TEXT_MUTED, ...MONO }}>
                            {e.startDate} — {e.endDate || "—"}
                          </div>
                        </div>
                        {e.description && (
                          <p className="mt-2 text-[0.88rem] leading-[1.7] whitespace-pre-line" style={{ color: TEXT_SECONDARY }}>
                            {e.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[0.9rem] italic" style={{ color: TEXT_MUTED }}>No education provided.</div>
                )}
              </section>

              {/* Skills */}
              <section>
                <SectionLabel text="Skills" />
                {seeker.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {seeker.skills.map((skill) => (
                      <span key={skill}
                        className="rounded-full px-3 py-1 text-[0.75rem] font-semibold"
                        style={{ background: "var(--db-primary-10)", color: PRIMARY, border: "1px solid var(--db-primary-20)" }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[0.9rem] italic" style={{ color: TEXT_MUTED }}>No skills listed.</div>
                )}
              </section>

              {/* Certifications */}
              <section>
                <SectionLabel text="Certifications" />
                {seeker.certifications.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {seeker.certifications.map((cert) => (
                      <span key={cert}
                        className="rounded-full px-3 py-1 text-[0.7rem] uppercase tracking-[0.14em] font-bold"
                        style={{ background: "var(--db-primary-10)", color: PRIMARY, border: "1px solid var(--db-primary-20)", ...MONO }}>
                        {cert}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[0.9rem] italic" style={{ color: TEXT_MUTED }}>No certifications listed.</div>
                )}
              </section>

              {/* Cover letter / notes */}
              <section>
                <SectionLabel text="Cover Letter" />
                {detail?.notes ? (
                  <p className="text-[0.92rem] leading-[1.78] whitespace-pre-line" style={{ color: TEXT_SECONDARY }}>
                    {detail.notes}
                  </p>
                ) : (
                  <div className="text-[0.9rem] italic" style={{ color: TEXT_MUTED }}>No cover letter provided.</div>
                )}
              </section>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ApplicantDetailDialog;
