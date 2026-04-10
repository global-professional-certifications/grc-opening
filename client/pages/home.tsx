import React, { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";

export default function LandingPage() {
  // Simple scroll reveal observer
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

  return (
    <div className="min-h-screen flex flex-col font-sans overflow-x-hidden w-full" style={{ background: "var(--db-bg)", color: "var(--db-text)" }}>
      <Head>
        <title>GRC Openings | Governance, Risk, and Compliance Careers</title>
        <meta
          name="description"
          content="The premier network for Governance, Risk, and Compliance professionals. Find exclusive cybersecurity, audit, and risk management jobs, or hire certified top-tier GRC talent."
        />
        <meta name="keywords" content="GRC, Governance Risk Compliance, Cybersecurity Jobs, Audit Careers, Privacy Hiring, CISA, CISSP" />
      </Head>

      {/* ── Navigation (Fixed White Top Bar) ──────────────────────── */}
      <header className="fixed top-0 w-full z-50 px-6 py-4 flex items-center justify-between shadow-sm transition-all duration-300" style={{ background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--db-border)" }}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-3xl" style={{ color: "var(--db-primary)" }}>
            shield_locked
          </span>
          <span className="text-xl font-bold tracking-tight" style={{ color: "var(--db-text)" }}>GRC Openings</span>
        </div>
        <div className="flex items-center gap-6">
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
            <span className="material-symbols-outlined relative top-[0.5px] group-hover:translate-x-1 transition-transform duration-300 ease-out" style={{ fontSize: 18 }}>
              arrow_forward
            </span>
          </Link>
        </div>
      </header>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col">
        {/* ── Premium Hero Section ──────────────────────────────────────────── */}
        <section className="relative pt-32 pb-48 lg:pt-[180px] lg:pb-64 flex flex-col items-center justify-center overflow-hidden" style={{ background: "var(--db-primary)" }}>
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/10 rounded-full blur-[100px] pointer-events-none transform translate-x-1/3 -translate-y-1/3 text-white/5" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#2a0e69] rounded-full blur-[80px] pointer-events-none transform -translate-x-1/3 translate-y-1/3" />

          {/* Premium Fade-to-Edge Right Image Container (45%) */}
          <div
            className="hidden lg:block absolute top-0 right-0 w-[45%] h-full z-0 pointer-events-none select-none"
            style={{
              maskImage: "linear-gradient(to right, transparent 0%, black 30%, black 100%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 30%, black 100%)"
            }}
          >
            <img
              src="/images/grc-hero.webp"
              alt="GRC Technology Background"
              className="w-full h-full object-cover object-center"
              style={{ filter: "brightness(1.05) contrast(1.05)" }}
            />
          </div>

          <div className="relative z-10 max-w-[1400px] mx-auto w-full px-6 flex">
            {/* Hero Text Content (Left - 55%) */}
            <div className="w-full lg:w-[55%] space-y-8 text-white relative z-10 lg:pr-16 text-center lg:text-left">
              <span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm reveal-scroll opacity-0 translate-y-8 transition-all duration-1000"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                <span className="material-symbols-outlined text-[14px]">stars</span>
                Exclusive Professional Network
              </span>

              <h1 className="text-5xl lg:text-[4rem] font-black tracking-tight leading-[1.1] drop-shadow-lg reveal-scroll opacity-0 translate-y-8 transition-all duration-1000 delay-100">
                The Future of <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right, #60a5fa, #ffffff)" }}>Compliance</span> Careers
              </h1>

              <p className="text-lg lg:text-xl font-medium leading-relaxed opacity-90 text-white/90 reveal-scroll opacity-0 translate-y-8 transition-all duration-1000 delay-200">
                Connect directly with industry-leading enterprises. Governance, Risk and Complience recruitment perfected through precision matching and verified trust.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4 reveal-scroll opacity-0 translate-y-8 transition-all duration-1000 delay-300">
                <Link
                  href="/auth/register"
                  className="group flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-xl text-lg font-bold transition-all duration-300 hover:shadow-[0_8px_40px_rgba(255,255,255,0.4)] hover:-translate-y-[2px] active:scale-[0.98] active:translate-y-0"
                  style={{ background: "#ffffff", color: "var(--db-primary)", boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)" }}
                >
                  Get Started
                  <span className="material-symbols-outlined relative top-[0.5px] group-hover:translate-x-1 transition-transform duration-300 ease-out" style={{ fontSize: 20 }}>
                    arrow_forward
                  </span>
                </Link>
                <Link
                  href="/auth/login"
                  className="flex items-center justify-center w-full sm:w-auto px-8 py-4 rounded-xl text-lg font-bold transition-all duration-300 hover:bg-white/10 hover:border-white/40 hover:shadow-[0_8px_30px_rgba(255,255,255,0.1)] hover:-translate-y-[2px] active:scale-[0.98] active:translate-y-0"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "2px solid rgba(255,255,255,0.2)",
                    color: "#ffffff",
                    backdropFilter: "blur(10px)"
                  }}
                >
                  Login
                </Link>
              </div>
            </div>
          </div>

          {/* ── Custom SVG Shape Divider ── */}
          <div className="absolute bottom-[-1px] left-0 w-full overflow-hidden leading-[0]">
            <svg
              className="relative block w-full h-[80px] md:h-[150px]"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,137.93,114,204,103.55c58.26-9.15,114.47-28.78,172.39-40.49Z"
                fill="var(--db-surface)"
              ></path>
            </svg>
          </div>
        </section>

        <section className="px-6 py-20 lg:py-28" style={{ background: "var(--db-surface)" }}>
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

        {/* ── Value Proposition / Technical Features Section ────────────────── */}
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
              {/* Feature 1 */}
              <div className="rounded-[32px] p-10 space-y-6 flex flex-col group transition-all duration-300 hover:shadow-xl" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)", boxShadow: "0 12px 40px rgba(58, 18, 146, 0.04)" }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-[var(--db-primary)] group-hover:scale-110 transition-all duration-300" style={{ background: "var(--db-primary-10)" }}>
                  <span className="material-symbols-outlined text-4xl group-hover:text-white transition-colors" style={{ color: "var(--db-primary)" }}>dynamic_form</span>
                </div>
                <h3 className="text-2xl font-bold" style={{ color: "var(--db-text)" }}>Intelligent Parsing</h3>
                <p className="text-sm font-medium leading-relaxed flex-1" style={{ color: "var(--db-text-muted)" }}>
                  Drop your resume, and our backend accurately extracts and auto-fills your profile, mapping your skills instantly to live compliance protocols.
                </p>
              </div>

              {/* Feature 2 - Hero Feature */}
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

              {/* Feature 3 */}
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

        {/* ── Final Call to Action ──────────────────────────────────────────── */}
        <section className="px-6 py-24 lg:py-32 relative reveal-scroll opacity-0 translate-y-8 transition-all duration-1000 overflow-hidden" style={{ background: "var(--db-surface)" }}>
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

            {/* Left Content: Clean Premium Glass Card (Static) */}
            <div className="relative w-full max-w-[340px] mx-auto min-h-[420px] flex justify-center items-center min-w-0">
              
              {/* Back Plate (Brand Shadow) */}
              <div 
                className="absolute w-[80%] h-[80%] top-[8%] left-[12%] rounded-[32px] transform -rotate-6 opacity-90 shadow-[0_20px_50px_rgba(58,18,146,0.3)] pointer-events-none" 
                style={{ background: "linear-gradient(135deg, var(--db-primary) 0%, rgba(58, 18, 146, 0.4) 100%)" }}
              />

              {/* Middle Plate / Glass Layer */}
              <div 
                className="absolute w-[85%] h-[85%] top-[6%] left-[10%] rounded-[32px] bg-white/10 backdrop-blur-md transform -rotate-3 pointer-events-none" 
                style={{ border: "1px solid rgba(255,255,255,0.4)", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}
              />

              {/* Main Image Container */}
              <div 
                className="relative z-10 w-full aspect-[4/5] overflow-hidden rounded-[28px] shadow-[0_20px_40px_rgba(0,0,0,0.4)] bg-[var(--db-surface)]"
              >
                {/* Inner Bezel */}
                <div className="absolute inset-0 border-[2px] border-white/30 mix-blend-overlay rounded-[28px] z-20 pointer-events-none" />
                
                <img 
                  src="/images/ready-to-join.webp" 
                  alt="GRC Professionals Team" 
                  className="w-full h-full object-cover" 
                />

                {/* Overlaid Gradient */}
                <div className="absolute bottom-0 w-full h-[60%] bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 pointer-events-none" />
                
                {/* Embedded UI Component */}
                <div className="absolute bottom-6 left-6 right-6 z-20">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white text-[10px] font-bold uppercase tracking-wider mb-2 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]" />
                    Pre-Verified
                  </div>
                  <h3 className="text-white text-xl font-black leading-tight drop-shadow-md">Enterprise<br />Ready Talent.</h3>
                </div>
              </div>

              {/* Contained Accent Ring */}
              <div className="absolute top-0 -left-6 w-16 h-16 rounded-full border-[5px] opacity-40 z-0 pointer-events-none transform -translate-y-4" style={{ borderColor: 'var(--db-primary)' }} />
              
              <div className="absolute bottom-0 -right-6 w-12 h-12 rounded-full bg-[var(--db-primary)] opacity-80 z-0 pointer-events-none transform translate-y-4 shadow-[0_0_20px_var(--db-primary)]" />
            </div>

            {/* Right Content: SEO Text & CTAs */}
            <div className="space-y-8 text-center lg:text-left min-w-0">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight break-words" style={{ color: "var(--db-text)" }}>
                Ready to secure your next <span style={{ color: "var(--db-primary)" }}>role?</span>
              </h2>

              <div className="space-y-4">
                <p className="text-lg font-medium leading-relaxed" style={{ color: "var(--db-text-muted)" }}>
                  Join the definitive professional network constructed exclusively for Governance, Risk, and Compliance experts. Secure top-tier cybersecurity listings, audit opportunities, and elite risk management roles.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="py-6 px-6" style={{ borderTop: "1px solid var(--db-border)", background: "var(--db-bg)" }}>
        <div className="max-w-6xl mx-auto flex flex-col justify-center items-center gap-6">
          <p className="text-base text-center" style={{ color: "var(--db-text-muted)" }}>
            &copy; {new Date().getFullYear()} GRC Openings. All rights reserved. Built for Security Professionals.
          </p>
        </div>
      </footer>
    </div>
  );
}
