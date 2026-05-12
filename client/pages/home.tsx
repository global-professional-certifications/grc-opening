import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { ResumeAnalyser } from "../modules/resume-analyser/ResumeAnalyser";
import { ResumeChecker } from "../modules/resume-analyser/ResumeChecker";
import { ResumeJDLibrary } from "../modules/resume-analyser/ResumeJDLibrary";

type HomeTool = "checker" | "enhancer" | "jdlibrary";

const GRC_CATEGORIES = [
  { icon: "gpp_good",        label: "Compliance & Audit"       },
  { icon: "security",        label: "Cybersecurity"            },
  { icon: "policy",          label: "Risk Management"          },
  { icon: "manage_accounts", label: "Identity & Access"        },
  { icon: "privacy_tip",     label: "Data Privacy"             },
  { icon: "verified_user",   label: "IT Governance"            },
  { icon: "shield_lock",     label: "Third-Party Risk"         },
];

export default function LandingPage() {
  const [activeTool, setActiveTool] = useState<HomeTool>("checker");
  const [heroSearch, setHeroSearch] = useState("");
  const [heroLocation, setHeroLocation] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-8");
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal-scroll").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (heroSearch.trim()) params.set("q", heroSearch.trim());
    if (heroLocation.trim()) params.set("location", heroLocation.trim());
    window.location.href = `/auth/register${params.toString() ? "?" + params : ""}`;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans overflow-x-hidden w-full" style={{ background: "var(--db-bg)", color: "var(--db-text)" }}>
      <Head>
        <title>GRC Openings | Governance, Risk Management, and Control Careers</title>
        <meta
          name="description"
          content="The premier network for Governance, Risk Management, and Control professionals. Find exclusive cybersecurity, audit, and risk management jobs, or hire certified top-tier GRC talent."
        />
        <meta name="keywords" content="GRC, Governance, Risk Management, and Control, Cybersecurity Jobs, Audit Careers, Privacy Hiring, CISA, CISSP" />
      </Head>

      {/* ── Navigation ──────────────────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 px-6 py-4 flex items-center justify-between shadow-sm transition-all duration-300" style={{ background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--db-border)" }}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-3xl" style={{ color: "var(--db-primary)" }}>shield_locked</span>
          <span className="text-xl font-bold tracking-tight" style={{ color: "var(--db-text)" }}>GRC Openings</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-base font-bold px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-[#3a12921a] hover:text-[#3a1292] active:bg-[#3a12922a]"
            style={{ color: "var(--db-text-muted)" }}
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="group px-6 py-3 rounded-xl text-base font-bold flex items-center gap-2 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(58,18,146,0.35)] hover:-translate-y-[2px] active:scale-[0.98] active:translate-y-0 relative overflow-hidden"
            style={{ background: "var(--db-primary)", color: "#ffffff", boxShadow: "0 4px 14px rgba(58, 18, 146, 0.2)" }}
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none" />
            Get Started
            <span className="material-symbols-outlined relative top-[0.5px] group-hover:translate-x-1 transition-transform duration-300 ease-out" style={{ fontSize: 18 }}>arrow_forward</span>
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col">

        {/* ── Hero ────────────────────────────────────────────────────────────── */}
        <section className="relative pt-32 pb-48 lg:pt-[180px] lg:pb-64 flex flex-col items-center justify-center overflow-hidden" style={{ background: "var(--db-primary)" }}>
          {/* Ambient glows */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/10 rounded-full blur-[100px] pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#2a0e69] rounded-full blur-[80px] pointer-events-none transform -translate-x-1/3 translate-y-1/3" />

          {/* Fade-to-edge hero image */}
          <div
            className="hidden lg:block absolute top-0 right-0 w-[45%] h-full z-0 pointer-events-none select-none"
            style={{ maskImage: "linear-gradient(to right, transparent 0%, black 30%, black 100%)", WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 30%, black 100%)" }}
          >
            <img src="/images/grc-hero.webp" alt="GRC Technology Background" className="w-full h-full object-cover object-center" style={{ filter: "brightness(1.05) contrast(1.05)" }} />
          </div>

          <div className="relative z-10 max-w-[1400px] mx-auto w-full px-6 flex">
            <div className="w-full lg:w-[55%] space-y-8 text-white relative z-10 lg:pr-16 text-center lg:text-left">
              <span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm reveal-scroll opacity-0 translate-y-8 transition-all duration-1000 mb-2"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                <span className="material-symbols-outlined text-[14px]">stars</span>
                Exclusive Professional Network
              </span>

              <h1 className="text-5xl lg:text-[4rem] font-black tracking-tight leading-[1.1] drop-shadow-lg reveal-scroll opacity-0 translate-y-8 transition-all duration-1000 delay-100">
                The Future of <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right, #60a5fa, #ffffff)" }}>GRC</span> Careers
              </h1>

              <p className="text-lg lg:text-xl font-medium leading-relaxed opacity-90 text-white/90 reveal-scroll opacity-0 translate-y-8 transition-all duration-1000 delay-200">
                Connect directly with industry-leading enterprises. Governance, Risk Management, and Control recruitment perfected through precision matching and verified trust.
              </p>

              {/* ── Inline search bar ── */}
              <form
                onSubmit={handleHeroSearch}
                className="reveal-scroll opacity-0 translate-y-8 transition-all duration-1000 delay-300 w-full"
              >
                <div
                  className="flex flex-col sm:flex-row items-stretch gap-0 rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.25)]"
                  style={{ background: "#fff" }}
                >
                  {/* Keywords */}
                  <div className="flex items-center gap-2 flex-1 px-4 py-3 border-b sm:border-b-0 sm:border-r" style={{ borderColor: "rgba(58,18,146,0.12)" }}>
                    <span className="material-symbols-outlined shrink-0" style={{ fontSize: 20, color: "var(--db-primary)" }}>search</span>
                    <input
                      type="text"
                      placeholder="Job title, skill, or keyword"
                      value={heroSearch}
                      onChange={(e) => setHeroSearch(e.target.value)}
                      className="w-full text-sm font-medium bg-transparent outline-none placeholder:text-gray-400"
                      style={{ color: "var(--db-text)" }}
                    />
                  </div>
                  {/* Location */}
                  <div className="flex items-center gap-2 flex-1 px-4 py-3 border-b sm:border-b-0 sm:border-r" style={{ borderColor: "rgba(58,18,146,0.12)" }}>
                    <span className="material-symbols-outlined shrink-0" style={{ fontSize: 20, color: "var(--db-primary)" }}>location_on</span>
                    <input
                      type="text"
                      placeholder="City, country, or Remote"
                      value={heroLocation}
                      onChange={(e) => setHeroLocation(e.target.value)}
                      className="w-full text-sm font-medium bg-transparent outline-none placeholder:text-gray-400"
                      style={{ color: "var(--db-text)" }}
                    />
                  </div>
                  {/* Search button */}
                  <button
                    type="submit"
                    className="px-6 py-3 text-sm font-bold transition-all duration-200 hover:opacity-90 active:scale-95 shrink-0"
                    style={{ background: "var(--db-primary)", color: "#fff" }}
                  >
                    Search Jobs
                  </button>
                </div>
              </form>

              {/* Quick CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2 reveal-scroll opacity-0 translate-y-8 transition-all duration-1000 delay-400">
                <Link
                  href="/auth/register"
                  className="group flex items-center justify-center gap-2 w-full sm:w-auto min-w-[160px] px-8 py-4 rounded-xl text-base font-bold transition-all duration-300 hover:shadow-[0_8px_40px_rgba(255,255,255,0.4)] hover:-translate-y-[2px] active:scale-[0.98] active:translate-y-0"
                  style={{ background: "#ffffff", color: "var(--db-primary)", boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)" }}
                >
                  Get Started Free
                  <span className="material-symbols-outlined relative top-[0.5px] group-hover:translate-x-1 transition-transform duration-300 ease-out" style={{ fontSize: 18 }}>arrow_forward</span>
                </Link>
                <Link
                  href="/auth/login"
                  className="flex items-center justify-center w-full sm:w-auto min-w-[160px] px-8 py-4 rounded-xl text-base font-bold transition-all duration-300 hover:bg-white/10 hover:border-white/40 hover:-translate-y-[2px] active:scale-[0.98]"
                  style={{ background: "rgba(255,255,255,0.05)", border: "2px solid rgba(255,255,255,0.2)", color: "#ffffff", backdropFilter: "blur(10px)" }}
                >
                  Login
                </Link>
              </div>
            </div>
          </div>

          {/* ── Stats strip ── */}
          <div className="relative z-10 max-w-[1400px] mx-auto w-full px-6 mt-14 reveal-scroll opacity-0 translate-y-8 transition-all duration-1000 delay-500">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 lg:gap-10 lg:w-[55%] lg:pr-16">
              {[
                { value: "2,400+", label: "Active Listings" },
                { value: "850+",   label: "Verified Employers" },
                { value: "15,000+",label: "GRC Professionals" },
                { value: "94%",    label: "Placement Rate" },
              ].map(({ value, label }) => (
                <div key={label} className="flex flex-col items-center lg:items-start gap-0.5">
                  <span className="text-2xl font-black text-white">{value}</span>
                  <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Shape divider */}
          <div className="absolute bottom-[-1px] left-0 w-full overflow-hidden leading-[0]">
            <svg className="relative block w-full h-[80px] md:h-[150px]" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,137.93,114,204,103.55c58.26-9.15,114.47-28.78,172.39-40.49Z" fill="var(--db-surface)" />
            </svg>
          </div>
        </section>

        {/* ── Browse by Category ──────────────────────────────────────────────── */}
        <section className="px-6 py-16 lg:py-20 reveal-scroll opacity-0 translate-y-8 transition-all duration-1000" style={{ background: "var(--db-surface)" }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-black tracking-tight" style={{ color: "var(--db-text)" }}>Browse by Category</h2>
                <p className="text-sm font-medium mt-1" style={{ color: "var(--db-text-muted)" }}>Explore roles across every GRC domain</p>
              </div>
              <Link
                href="/auth/register"
                className="flex items-center gap-1.5 text-sm font-bold transition-colors duration-200 hover:underline shrink-0"
                style={{ color: "var(--db-primary)" }}
              >
                View all categories
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              {GRC_CATEGORIES.map(({ icon, label }) => (
                <Link
                  key={label}
                  href="/auth/register"
                  className="group flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-200 hover:-translate-y-1 hover:shadow-md text-center"
                  style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                    style={{ background: "var(--db-primary-10)" }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: "var(--db-primary)" }} aria-hidden="true">{icon}</span>
                  </div>
                  <span className="text-xs font-semibold leading-snug" style={{ color: "var(--db-text)" }}>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── AI Resume Tools ──────────────────────────────────────────────────── */}
        <section id="ai-resume-tools" className="px-6 py-24 lg:py-32 relative reveal-scroll opacity-0 translate-y-8 transition-all duration-1000 overflow-hidden" style={{ background: "var(--db-surface)" }}>
          <div className="absolute top-10 left-1/4 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none opacity-20 transform -translate-x-1/2" style={{ background: "var(--db-primary)" }} />
          <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none opacity-15 transform translate-x-1/3" style={{ background: "#7c3aed" }} />

          <div className="max-w-7xl mx-auto relative z-10">
            {/* Section header */}
            <div className="text-center mb-14">
              <span
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black uppercase tracking-[0.15em] shadow-sm backdrop-blur-md mb-3"
                style={{ background: "var(--db-primary-10)", color: "var(--db-primary)", border: "1px solid var(--db-primary-20)" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>smart_toy</span>
                AI-Powered Tools
              </span>
              <h2 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight" style={{ color: "var(--db-text)" }}>
                Supercharge Your Resume with our<br className="hidden md:block" />
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, var(--db-primary), #7c3aed)" }}> AI-Powered Resume Hub</span>
              </h2>
              <p className="text-lg font-medium max-w-2xl mx-auto leading-relaxed mt-4" style={{ color: "var(--db-text-muted)" }}>
                Check your resume for quality issues or tailor it to a specific GRC role — all in one place.
              </p>
            </div>

            {/* Tool selector cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
              {([
                { id: "checker"   as HomeTool, icon: "fact_check",    badge: "Basic",        title: "Basic Resume Checker",      description: "Instant quality scan — catch typos, broken links, and formatting issues in seconds." },
                { id: "enhancer"  as HomeTool, icon: "auto_awesome",  badge: "Intermediate", title: "Enhance with Job Description", description: "Paste a JD and our AI rewrites your resume for maximum ATS impact and keyword coverage." },
                { id: "jdlibrary" as HomeTool, icon: "library_books", badge: "Advanced",     title: "Access our JD Library",      description: "Pick a GRC role from our curated library — AI auto-fills the JD and optimizes your resume." },
              ]).map((card) => {
                const isActive = activeTool === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setActiveTool(card.id)}
                    className="ra-tool-card group relative text-left rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 focus:outline-none"
                    style={{
                      background: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.55)",
                      border: isActive ? "1.5px solid var(--db-primary)" : "1.5px solid rgba(255,255,255,0.6)",
                      boxShadow: isActive ? "0 8px 32px rgba(58,18,146,0.18), 0 0 0 3px var(--db-primary-10)" : "0 2px 12px rgba(0,0,0,0.04)",
                      backdropFilter: "blur(16px)",
                    }}
                    aria-pressed={isActive}
                  >
                    {isActive && (
                      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: "linear-gradient(90deg, var(--db-primary), #7c3aed)" }} />
                    )}
                    <div className="flex items-center justify-between">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
                        style={{ background: isActive ? "var(--db-primary)" : "var(--db-primary-10)" }}
                      >
                        <span className="material-symbols-outlined transition-colors duration-300" style={{ fontSize: 20, color: isActive ? "#fff" : "var(--db-primary)" }} aria-hidden="true">{card.icon}</span>
                      </div>
                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300" style={{ borderColor: isActive ? "var(--db-primary)" : "var(--db-border)" }}>
                        <div className="rounded-full transition-all duration-300" style={{ width: isActive ? 8 : 0, height: isActive ? 8 : 0, background: isActive ? "var(--db-primary)" : "transparent" }} />
                      </div>
                    </div>
                    <h3 className="text-base font-bold leading-snug transition-colors duration-200" style={{ color: isActive ? "var(--db-primary)" : "var(--db-text)" }}>{card.title}</h3>
                    <p className="text-[13px] leading-relaxed" style={{ color: "var(--db-text-muted)" }}>{card.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Tool container */}
            <div className="ra-home-wrapper relative rounded-[28px] p-[2px] overflow-hidden shadow-[0_30px_80px_rgba(58,18,146,0.10)]">
              <div className="absolute inset-0 rounded-[28px] opacity-40" style={{ background: "linear-gradient(135deg, var(--db-primary), transparent 40%, transparent 60%, #7c3aed)" }} />
              <div className="relative rounded-[26px] px-6 py-8 md:px-10 md:py-10 backdrop-blur-xl" style={{ background: "rgba(255, 255, 255, 0.75)", border: "1px solid rgba(255, 255, 255, 0.85)" }}>
                {activeTool === "checker" ? (
                  <ResumeChecker isPublic={true} />
                ) : activeTool === "jdlibrary" ? (
                  <ResumeJDLibrary isPublic={true} compact={true} />
                ) : (
                  <ResumeAnalyser isPublic={true} compact={true} />
                )}
              </div>
            </div>

            {/* CTA nudge */}
            <div className="text-center mt-12 flex justify-center items-center gap-4 flex-col sm:flex-row">
              <p className="text-base font-semibold" style={{ color: "var(--db-text-muted)" }}>Want to save your results and track applications?</p>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ background: "var(--db-primary)", color: "#fff", boxShadow: "0 4px 14px rgba(58, 18, 146, 0.2)" }}
              >
                Create a Free Account
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Our Primary Goal ────────────────────────────────────────────────── */}
        <section className="px-6 py-20 lg:py-28" style={{ background: "var(--db-bg)" }}>
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6 reveal-scroll opacity-0 translate-y-8 transition-all duration-1000">
              <h2 className="text-3xl lg:text-4xl font-black tracking-tight" style={{ color: "var(--db-text)" }}>
                Our Primary Goal: Bridging the Talent Gap
              </h2>
              <div className="w-20 h-1.5 rounded-full" style={{ background: "var(--db-primary)" }} />
              <p className="text-lg font-medium leading-relaxed" style={{ color: "var(--db-text-muted)" }}>
                The cybersecurity and compliance sectors evolve faster than generalized job boards can adapt. GRC Openings was engineered with a singular objective: to construct a frictionless, highly-specialized conduit connecting certified professionals directly with the security teams that desperately need them.
              </p>
              <p className="text-lg font-medium leading-relaxed" style={{ color: "var(--db-text-muted)" }}>
                We prioritize data integrity and credential verification over sheer volume. This ensures that every listing is precise, and every candidate presented is deeply qualified.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 reveal-scroll opacity-0 translate-y-8 transition-all duration-1000 delay-200">
              <div className="p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-[var(--db-card)] border border-[var(--db-border)]">
                <span className="material-symbols-outlined text-4xl mb-4" style={{ color: "var(--db-primary)" }}>lock_person</span>
                <h4 className="text-xl font-bold mb-2">Secure Isolation</h4>
                <p className="text-sm font-medium" style={{ color: "var(--db-text-muted)" }}>Strict Role-Based Access controls ensure enterprise data and candidate profiles remain strictly confidential.</p>
              </div>
              <div className="p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-[var(--db-primary)] text-white border border-[var(--db-primary-40)] sm:translate-y-8">
                <span className="material-symbols-outlined text-4xl mb-4 text-white/90">verified</span>
                <h4 className="text-xl font-bold mb-2">Verified Talent</h4>
                <p className="text-sm font-medium text-white/80">Every profile is built explicitly to showcase vital certifications like CISA, CISM, and CISSP.</p>
              </div>
              <div className="p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-[var(--db-card)] border border-[var(--db-border)]">
                <span className="material-symbols-outlined text-4xl mb-4" style={{ color: "var(--db-primary)" }}>fast_forward</span>
                <h4 className="text-xl font-bold mb-2">Accelerated Hiring</h4>
                <p className="text-sm font-medium" style={{ color: "var(--db-text-muted)" }}>Reduce pipeline friction through semantic matching and deep profiling tailored specifically for GRC.</p>
              </div>
              <div className="p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-[var(--db-card)] border border-[var(--db-border)] sm:translate-y-8">
                <span className="material-symbols-outlined text-4xl mb-4" style={{ color: "var(--db-primary)" }}>handshake</span>
                <h4 className="text-xl font-bold mb-2">Trust Network</h4>
                <p className="text-sm font-medium" style={{ color: "var(--db-text-muted)" }}>A curated ecosystem designed explicitly for professionals to navigate career pivots without noise.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works ────────────────────────────────────────────────────── */}
        <section className="px-6 py-20 lg:py-28 reveal-scroll opacity-0 translate-y-8 transition-all duration-1000" style={{ background: "var(--db-surface)" }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <span
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black uppercase tracking-[0.15em] mb-3"
                style={{ background: "var(--db-primary-10)", color: "var(--db-primary)", border: "1px solid var(--db-primary-20)" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>route</span>
                Simple Process
              </span>
              <h2 className="text-3xl lg:text-4xl font-black tracking-tight" style={{ color: "var(--db-text)" }}>
                How It Works
              </h2>
              <p className="text-base font-medium max-w-xl mx-auto mt-3" style={{ color: "var(--db-text-muted)" }}>
                From sign-up to hired — in three straightforward steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connector line (desktop) */}
              <div className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-[2px] z-0" style={{ background: "linear-gradient(90deg, var(--db-primary-20), var(--db-primary), var(--db-primary-20))" }} />

              {[
                { step: "01", icon: "person_add",   title: "Create Your Profile",   desc: "Sign up in minutes and build your GRC-focused profile showcasing certifications, experience, and skills."  },
                { step: "02", icon: "travel_explore",title: "Discover Matched Roles", desc: "Our engine surfaces roles matched to your exact certifications, experience level, and preferred work mode." },
                { step: "03", icon: "task_alt",      title: "Apply & Get Hired",      desc: "Apply with one click, track your applications, and connect directly with verified hiring teams."           },
              ].map(({ step, icon, title, desc }) => (
                <div key={step} className="relative z-10 flex flex-col items-center text-center gap-4">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg shrink-0"
                    style={{ background: "var(--db-primary)", boxShadow: "0 8px 24px rgba(58,18,146,0.3)" }}
                  >
                    <span className="material-symbols-outlined text-white" style={{ fontSize: 32 }} aria-hidden="true">{icon}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--db-primary)" }}>Step {step}</span>
                  <h3 className="text-lg font-bold" style={{ color: "var(--db-text)" }}>{title}</h3>
                  <p className="text-sm font-medium leading-relaxed max-w-[240px]" style={{ color: "var(--db-text-muted)" }}>{desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ background: "var(--db-primary)", color: "#fff", boxShadow: "0 4px 14px rgba(58, 18, 146, 0.2)" }}
              >
                Get Started Free
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Technical Features ──────────────────────────────────────────────── */}
        <section className="px-6 py-28 relative reveal-scroll opacity-0 translate-y-8 transition-all duration-1000" style={{ background: "var(--db-bg)" }}>
          <div className="absolute top-0 w-full h-[1px]" style={{ background: "var(--db-border)" }} />
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight" style={{ color: "var(--db-text)" }}>
                Built exclusively for the Security Sector
              </h2>
              <p className="text-base font-medium max-w-2xl mx-auto" style={{ color: "var(--db-text-muted)" }}>
                Industry-grade infrastructure crafted to parse credentials, analyze core competencies, and securely negotiate opportunities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pb-10">
              <div className="rounded-[32px] p-10 space-y-6 flex flex-col group transition-all duration-300 hover:shadow-xl" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)", boxShadow: "0 12px 40px rgba(58, 18, 146, 0.04)" }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-[var(--db-primary)] group-hover:scale-110 transition-all duration-300" style={{ background: "var(--db-primary-10)" }}>
                  <span className="material-symbols-outlined text-4xl group-hover:text-white transition-colors" style={{ color: "var(--db-primary)" }}>dynamic_form</span>
                </div>
                <h3 className="text-2xl font-bold" style={{ color: "var(--db-text)" }}>Intelligent Parsing</h3>
                <p className="text-sm font-medium leading-relaxed flex-1" style={{ color: "var(--db-text-muted)" }}>
                  Drop your resume, and our backend accurately extracts and auto-fills your profile, mapping your skills instantly to live compliance protocols.
                </p>
              </div>
              <div className="rounded-[32px] p-10 space-y-6 flex flex-col relative overflow-hidden" style={{ background: "var(--db-primary)", border: "1px solid var(--db-primary-40)", color: "#ffffff", boxShadow: "0 24px 60px rgba(58, 18, 146, 0.4)" }}>
                <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }} />
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/20 shrink-0 relative z-10 transition-transform duration-300 hover:scale-110 cursor-default">
                  <span className="material-symbols-outlined text-4xl text-white">gpp_good</span>
                </div>
                <h3 className="text-2xl font-bold relative z-10">Zero-Noise Environment</h3>
                <p className="text-sm font-medium leading-relaxed opacity-90 flex-1 relative z-10">
                  Unlike generalized boards, every role published here is verified for authenticity, ensuring a robust, spam-free talent acquisition process.
                </p>
              </div>
              <div className="rounded-[32px] p-10 space-y-6 flex flex-col group transition-all duration-300 hover:shadow-xl" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)", boxShadow: "0 12px 40px rgba(58, 18, 146, 0.04)" }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-[var(--db-primary)] group-hover:scale-110 transition-all duration-300" style={{ background: "var(--db-primary-10)" }}>
                  <span className="material-symbols-outlined text-4xl group-hover:text-white transition-colors" style={{ color: "var(--db-primary)" }}>insert_chart</span>
                </div>
                <h3 className="text-2xl font-bold" style={{ color: "var(--db-text)" }}>KPI Analytics</h3>
                <p className="text-sm font-medium leading-relaxed flex-1" style={{ color: "var(--db-text-muted)" }}>
                  Employers get granular insights into pipeline health, while candidates can track visibility and response rates via clean, beautiful dashboards.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Employer CTA Banner ──────────────────────────────────────────────── */}
        <section className="px-6 py-16 reveal-scroll opacity-0 translate-y-8 transition-all duration-1000" style={{ background: "var(--db-bg)" }}>
          <div className="max-w-5xl mx-auto">
            <div
              className="relative rounded-3xl px-8 py-12 md:px-14 md:py-14 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8"
              style={{ background: "linear-gradient(135deg, var(--db-primary) 0%, #5b21b6 100%)", boxShadow: "0 24px 60px rgba(58,18,146,0.35)" }}
            >
              {/* Background glow */}
              <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }} />

              <div className="relative z-10 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                  Hiring GRC talent?<br className="hidden md:block" /> We've got you covered.
                </h2>
                <p className="mt-3 text-white/75 font-medium text-base max-w-md">
                  Post verified roles, reach pre-screened professionals, and close positions faster — built exclusively for security teams.
                </p>
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row gap-3 shrink-0">
                <Link
                  href="/auth/register?role=employer"
                  className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(255,255,255,0.3)]"
                  style={{ background: "#fff", color: "var(--db-primary)" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>post_add</span>
                  Post a Job
                </Link>
                <Link
                  href="/auth/register?role=employer"
                  className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 hover:bg-white/20 hover:-translate-y-1"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.3)", color: "#fff" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>people_search</span>
                  Browse Candidates
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────────────────── */}
        <section className="px-6 py-24 lg:py-32 relative reveal-scroll opacity-0 translate-y-8 transition-all duration-1000 overflow-hidden" style={{ background: "var(--db-surface)" }}>
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

            {/* Left: image card */}
            <div className="relative w-full max-w-[340px] mx-auto min-h-[420px] flex justify-center items-center min-w-0">
              <div className="absolute w-[80%] h-[80%] top-[8%] left-[12%] rounded-[32px] transform -rotate-6 opacity-90 shadow-[0_20px_50px_rgba(58,18,146,0.3)] pointer-events-none" style={{ background: "linear-gradient(135deg, var(--db-primary) 0%, rgba(58, 18, 146, 0.4) 100%)" }} />
              <div className="absolute w-[85%] h-[85%] top-[6%] left-[10%] rounded-[32px] bg-white/10 backdrop-blur-md transform -rotate-3 pointer-events-none" style={{ border: "1px solid rgba(255,255,255,0.4)", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }} />
              <div className="relative z-10 w-full aspect-[4/5] overflow-hidden rounded-[28px] shadow-[0_20px_40px_rgba(0,0,0,0.4)] bg-[var(--db-surface)]">
                <div className="absolute inset-0 border-[2px] border-white/30 mix-blend-overlay rounded-[28px] z-20 pointer-events-none" />
                <img src="/images/ready-to-join.webp" alt="GRC Professionals Team" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 w-full h-[60%] bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 pointer-events-none" />
                <div className="absolute bottom-6 left-6 right-6 z-20">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white text-[10px] font-bold uppercase tracking-wider mb-2 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]" />
                    Pre-Verified
                  </div>
                  <h3 className="text-white text-xl font-black leading-tight drop-shadow-md">Enterprise<br />Ready Talent.</h3>
                </div>
              </div>
              <div className="absolute top-0 -left-6 w-16 h-16 rounded-full border-[5px] opacity-40 z-0 pointer-events-none transform -translate-y-4" style={{ borderColor: "var(--db-primary)" }} />
              <div className="absolute bottom-0 -right-6 w-12 h-12 rounded-full bg-[var(--db-primary)] opacity-80 z-0 pointer-events-none transform translate-y-4 shadow-[0_0_20px_var(--db-primary)]" />
            </div>

            {/* Right: text + CTAs */}
            <div className="space-y-8 text-center lg:text-left min-w-0">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight break-words" style={{ color: "var(--db-text)" }}>
                Ready to secure your next <span style={{ color: "var(--db-primary)" }}>role?</span>
              </h2>
              <div className="space-y-4">
                <p className="text-lg font-medium leading-relaxed" style={{ color: "var(--db-text-muted)" }}>
                  Join the definitive professional network constructed exclusively for Governance, Risk, and Compliance experts. Secure top-tier cybersecurity listings, audit opportunities, and elite risk management roles.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/auth/register"
                  className="group flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold transition-all duration-300 hover:shadow-[0_8px_30px_rgba(58,18,146,0.35)] hover:-translate-y-[2px] active:scale-[0.98]"
                  style={{ background: "var(--db-primary)", color: "#fff", boxShadow: "0 4px 14px rgba(58, 18, 146, 0.2)" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
                  Create Free Account
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform duration-300" style={{ fontSize: 18 }}>arrow_forward</span>
                </Link>
                <Link
                  href="/auth/register?role=employer"
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold transition-all duration-300 hover:-translate-y-[2px] active:scale-[0.98]"
                  style={{ background: "var(--db-card)", border: "1.5px solid var(--db-border)", color: "var(--db-text)" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>post_add</span>
                  Post a Job
                </Link>
              </div>

              {/* Social proof */}
              <div className="flex items-center justify-center lg:justify-start gap-3 pt-2">
                <div className="flex -space-x-2">
                  {["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500"].map((c, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full border-2 border-white ${c} flex items-center justify-center text-white text-[10px] font-bold`}>
                      {["RK", "AP", "SM", "JD"][i]}
                    </div>
                  ))}
                </div>
                <p className="text-sm font-medium" style={{ color: "var(--db-text-muted)" }}>
                  Join <strong style={{ color: "var(--db-text)" }}>15,000+</strong> GRC professionals
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="px-6 pt-14 pb-8" style={{ borderTop: "1px solid var(--db-border)", background: "var(--db-bg)" }}>
        <div className="max-w-6xl mx-auto">
          {/* 3-column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-10">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl" style={{ color: "var(--db-primary)" }}>shield_locked</span>
                <span className="text-lg font-black tracking-tight" style={{ color: "var(--db-text)" }}>GRC Openings</span>
              </div>
              <p className="text-sm font-medium leading-relaxed max-w-xs" style={{ color: "var(--db-text-muted)" }}>
                The premier network for Governance, Risk, and Compliance professionals. Precision matching for the security sector.
              </p>
              <div className="flex items-center gap-2 pt-1">
                {[
                  { icon: "language", label: "Website" },
                  { icon: "link",     label: "LinkedIn" },
                ].map(({ icon, label }) => (
                  <span
                    key={label}
                    className="w-8 h-8 rounded-lg flex items-center justify-center cursor-default"
                    style={{ background: "var(--db-primary-10)", color: "var(--db-primary)" }}
                    title={label}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">{icon}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* For Job Seekers */}
            <div className="space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest" style={{ color: "var(--db-text)" }}>For Job Seekers</h4>
              <ul className="space-y-2.5">
                {[
                  ["Browse GRC Jobs",       "/auth/register"],
                  ["Create Profile",        "/auth/register"],
                  ["AI Resume Tools",       "/auth/register"],
                  ["Career Resources",      "/auth/register"],
                  ["Salary Insights",       "/auth/register"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm font-medium transition-colors duration-150 hover:underline" style={{ color: "var(--db-text-muted)" }}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* For Employers */}
            <div className="space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest" style={{ color: "var(--db-text)" }}>For Employers</h4>
              <ul className="space-y-2.5">
                {[
                  ["Post a Job",            "/auth/register?role=employer"],
                  ["Browse Candidates",     "/auth/register?role=employer"],
                  ["Employer Dashboard",    "/auth/register?role=employer"],
                  ["Pricing",               "/auth/register?role=employer"],
                  ["Contact Sales",         "/auth/register?role=employer"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm font-medium transition-colors duration-150 hover:underline" style={{ color: "var(--db-text-muted)" }}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6" style={{ borderTop: "1px solid var(--db-border)" }}>
            <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
              &copy; {new Date().getFullYear()} GRC Openings. All rights reserved.
            </p>
            <div className="flex items-center gap-5">
              {["Privacy Policy", "Terms of Use", "Cookie Settings"].map((label) => (
                <Link key={label} href="/auth/register" className="text-xs font-medium hover:underline" style={{ color: "var(--db-text-muted)" }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
