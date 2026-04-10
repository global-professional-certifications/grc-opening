import React, { useEffect, useState } from "react";
import Head from "next/head";
import type { EmployerProfileData } from "../../../components/employer/profile/types";
import { EMPTY_EMPLOYER_PROFILE } from "../../../components/employer/profile/types";

const STORAGE_KEY = "grc_employer_profile";

const SYNE = { fontFamily: "'Syne', sans-serif" };
const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const MANROPE = { fontFamily: "'Manrope', sans-serif" };

export default function PublicProfilePreview() {
  const [profile, setProfile] = useState<EmployerProfileData | null>(null);

  useEffect(() => {
    // Hide theme toggles if any
    const toggle = document.querySelector<HTMLElement>(".theme-toggle");
    if (toggle) toggle.style.display = "none";

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setProfile(JSON.parse(saved) as EmployerProfileData);
      } else {
        setProfile(EMPTY_EMPLOYER_PROFILE);
      }
    } catch {
      setProfile(EMPTY_EMPLOYER_PROFILE);
    }
  }, []);

  if (!profile) return null; // loading state

  const initials = profile.companyName
    ? profile.companyName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "CO";

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={MANROPE}>
      <Head>
        <title>{profile.companyName || "Company Profile"} - Preview</title>
      </Head>

      {/* Top Banner */}
      <div 
        className="w-full h-80"
        style={{
          background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
        }}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 -mt-32 relative z-10">
        
        {/* Main Entity Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-12 border border-slate-100 flex flex-col sm:flex-row gap-8 items-start mb-8">
          {/* Logo */}
          <div 
            className="w-32 h-32 flex-shrink-0 bg-slate-50 border-4 border-white rounded-2xl shadow flex items-center justify-center overflow-hidden text-3xl font-bold text-teal-600"
            style={SYNE}
          >
            {profile.logoUrl ? (
              <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          
          <div className="flex-1 space-y-4 pt-2">
            <div>
              <h1 className="text-4xl font-bold text-slate-900" style={SYNE}>
                {profile.companyName || "Unnamed Company"}
              </h1>
              {profile.tagline && (
                <p className="text-lg text-slate-600 mt-2 font-medium">
                  {profile.tagline}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              {profile.industry && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm font-semibold" style={MONO}>
                  <span className="material-symbols-outlined text-[16px]">category</span>
                  {profile.industry}
                </span>
              )}
              {profile.companySize && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-sm font-medium" style={MONO}>
                  <span className="material-symbols-outlined text-[16px]">group</span>
                  {profile.companySize}
                </span>
              )}
              {profile.foundedYear && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-slate-500 rounded-full text-sm" style={MONO}>
                  <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                  Est. {profile.foundedYear}
                </span>
              )}
              {(profile.city || profile.country) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-slate-500 rounded-full text-sm" style={MONO}>
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                  {[profile.city, profile.country].filter(Boolean).join(", ")}
                </span>
              )}
            </div>

            {profile.website && (
              <div className="pt-2">
                <a
                  href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm hover:underline text-teal-600 font-bold bg-teal-50/50 hover:bg-teal-50 px-4 py-2 rounded-xl transition-colors"
                  style={MONO}
                >
                  <span className="material-symbols-outlined text-[18px]">language</span>
                  {profile.website.replace(/^https?:\/\/(www\.)?/, "")}
                  <span className="material-symbols-outlined text-[16px] ml-1 opacity-70">open_in_new</span>
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: About */}
          <div className="lg:col-span-2 space-y-8">
            {profile.description && (
              <section className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2" style={SYNE}>
                  <span className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">business</span>
                  </span>
                  About Us
                </h2>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                  {profile.description}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Contact Details (if any present) */}
            {(profile.contactName || profile.contactEmail || profile.contactPhone) && (
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2" style={MONO}>
                  <span className="material-symbols-outlined text-[16px]">contact_page</span>
                  Contact Info
                </h3>
                <div className="space-y-4">
                  {profile.contactName && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1" style={MONO}>Person</p>
                      <p className="text-slate-800 font-bold">{profile.contactName}</p>
                    </div>
                  )}
                  {profile.contactEmail && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1" style={MONO}>Email</p>
                      <a href={`mailto:${profile.contactEmail}`} className="text-teal-600 hover:underline font-bold break-all">
                        {profile.contactEmail}
                      </a>
                    </div>
                  )}
                  {profile.contactPhone && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1" style={MONO}>Phone</p>
                      <a href={`tel:${profile.contactPhoneCode}${profile.contactPhone}`} className="text-slate-800 hover:text-teal-600 hover:underline font-medium">
                        {profile.contactPhoneCode} {profile.contactPhone}
                      </a>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Social Links */}
            {(profile.linkedInUrl || profile.twitterUrl || profile.otherUrl || (profile.customLinks && profile.customLinks.length > 0)) && (
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2" style={MONO}>
                  <span className="material-symbols-outlined text-[16px]">link</span>
                  Connect
                </h3>
                <div className="flex flex-col gap-3">
                  {profile.linkedInUrl && (
                    <a href={profile.linkedInUrl.startsWith("http") ? profile.linkedInUrl : `https://${profile.linkedInUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-600 hover:text-teal-600 hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-[#0077b5]/10 text-[#0077b5] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px]">work</span>
                      </div>
                      <span className="font-semibold text-sm">LinkedIn</span>
                    </a>
                  )}
                  {profile.twitterUrl && (
                    <a href={profile.twitterUrl.startsWith("http") ? profile.twitterUrl : `https://${profile.twitterUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-600 hover:text-teal-600 hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px]">tag</span>
                      </div>
                      <span className="font-semibold text-sm">X / Twitter</span>
                    </a>
                  )}
                  {profile.otherUrl && (
                    <a href={profile.otherUrl.startsWith("http") ? profile.otherUrl : `https://${profile.otherUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-600 hover:text-teal-600 hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      </div>
                      <span className="font-semibold text-sm">Other Link</span>
                    </a>
                  )}
                  {profile.customLinks && profile.customLinks.map((link, idx) => link ? (
                    <a key={idx} href={link.startsWith("http") ? link : `https://${link}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-600 hover:text-teal-600 hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px]">link</span>
                      </div>
                      <span className="font-semibold text-sm truncate max-w-[150px]">{link.replace(/^https?:\/\/(www\.)?/, "")}</span>
                    </a>
                  ) : null)}
                </div>
              </section>
            )}

            {/* Empty State Help (only visible if completely empty) */}
            {(!profile.description && !profile.contactName && !profile.contactEmail && !profile.contactPhone && !profile.linkedInUrl && !profile.website) && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-800">
                <div className="flex items-center gap-2 mb-2 font-bold">
                  <span className="material-symbols-outlined">warning</span>
                  Profile Incomplete
                </div>
                <p className="text-sm">Your public profile is looking a bit empty! Fill out more details like your "About" section, website, and social links to build trust with candidates.</p>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Floating Preview Badge */}
      <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white rounded-full px-6 py-3 shadow-2xl flex items-center gap-3 font-medium text-sm border-2 border-slate-700/50 backdrop-blur-md">
        <span className="flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-teal-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
        </span>
        Preview Mode
      </div>
    </div>
  );
}
