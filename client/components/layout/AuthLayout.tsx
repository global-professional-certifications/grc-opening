import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
  role?: "job_seeker" | "employer";
}

function ShieldIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg style={style} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function GridIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg style={style} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

//Badge Card of equal widths, no offset 
function BadgeCard({ label, title }: { label: string; title: string }) {
  return (
    <div className="badge-card" style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 14px", borderRadius: 12,
      border: "1px solid var(--badge-border)",
      background: "var(--badge-bg)",
      backdropFilter: "blur(10px)",
    }}>
      <div style={{
        width: 34, height: 34, flexShrink: 0, borderRadius: "50%",
        background: "rgba(0, 212, 178, 0.12)",
        border: "1px solid rgba(0, 212, 178, 0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <ShieldIcon style={{ width: 14, height: 14, color: "var(--brand)" }} />
      </div>
      <div>
        <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--badge-label)", marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--badge-title)" }}>{title}</p>
      </div>
    </div>
  );
}

// Job Seeker Panel
function JobSeekerPanel() {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      // Fluid padding so the panel breathes proportionally at every zoom level
      padding: "clamp(1.25rem, 3vh, 2rem) clamp(1.25rem, 2vw, 2rem)",
      background: "var(--right-bg)",
      position: "relative", overflow: "hidden",
      height: "100vh",
      transition: "background 0.4s ease",
    }}>
      {/* Glow */}
      <div className="glow-orb" style={{
        position: "absolute", top: "45%", left: "30%",
        transform: "translate(-50%, -50%)",
        width: 300, height: 300,
        background: "radial-gradient(circle, rgba(0,212,178,0.15) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />

      {/* Headline — proportional top spacing so it stays near top at all zoom levels */}
      <div style={{ paddingTop: "clamp(0.75rem, 3vh, 2rem)", position: "relative", zIndex: 10 }}>
        <div className="headline-fade">
          <p style={{
            fontSize: "clamp(1.6rem, 2.8vw, 2.6rem)", fontWeight: 900,
            color: "var(--right-headline)", lineHeight: 1.1,
            letterSpacing: "-0.025em", marginBottom: 2,
          }}>
            Your GRC<br />Career,
          </p>
        </div>
        <div className="headline-fade">
          <span className="typewriter-line" style={{
            fontSize: "clamp(1.6rem, 2.8vw, 2.6rem)", fontWeight: 900,
            color: "var(--brand)", letterSpacing: "-0.025em",
          }}>
            Starts Here.
          </span>
        </div>
      </div>

      {/*
       * Badges — fluid top margin keeps them anchored proportionally
       * below the headline instead of floating in a flex-1 void.
       * marginTop auto on stats handles the rest of the vertical space.
       */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", flexDirection: "column",
        gap: "clamp(8px, 1.2vh, 12px)",
        maxWidth: 380,
        marginTop: "clamp(1.5rem, 5vh, 3.5rem)",
      }}>
        <BadgeCard label="CERTIFIED" title="CISA Analyst" />
        <BadgeCard label="GOVERNANCE" title="ISO 27001 Auditor" />
        <BadgeCard label="RISK MANAGEMENT" title="CRISC Professional" />
      </div>

      {/* Stats — auto top margin absorbs remaining vertical space proportionally */}
      <div style={{ position: "relative", zIndex: 10, marginTop: "auto" }}>
        <div style={{ height: 1, background: "var(--stat-divider)", marginBottom: "clamp(0.5rem, 1.5vh, 1rem)" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
          {[{ num: "5k+", label: "OPENINGS" }, { num: "200+", label: "TOP FIRMS" }, { num: "15+", label: "DOMAINS" }].map(s => (
            <div key={s.label}>
              <p style={{ fontSize: "clamp(1.1rem, 1.8vh, 1.3rem)", fontWeight: 800, color: "var(--stat-num)", marginBottom: 2 }}>{s.num}</p>
              <p style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--stat-label)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

//Employer Panel
function EmployerPanel() {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      padding: "clamp(1.25rem, 3vh, 2rem) clamp(1.25rem, 2vw, 2rem)",
      background: "var(--right-bg)",
      position: "relative", overflow: "hidden",
      height: "100vh",
      transition: "background 0.4s ease",
    }}>
      {/* Glow */}
      <div className="glow-orb" style={{
        position: "absolute", bottom: "20%", right: "-5%",
        width: 280, height: 280,
        background: "radial-gradient(circle, rgba(0,212,178,0.13) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />

      {/* Logo at top */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative", zIndex: 10, flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "rgba(0, 212, 178, 0.15)",
          border: "1.5px solid rgba(0,212,178,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <GridIcon style={{ width: 14, height: 14, color: "var(--brand)" }} />
        </div>
        <span style={{ fontWeight: 800, fontSize: "0.75rem", letterSpacing: "0.06em", color: "var(--right-headline)" }}>
          GRC OPENINGS
        </span>
      </div>

      {/* Center content  not pushed to bottom */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", flexDirection: "column", justifyContent: "center",
        flex: 1, paddingBottom: "0.5rem",
      }}>
        {/* EMPLOYER SOLUTIONS pill */}
        <div style={{
          display: "inline-block", padding: "4px 12px",
          background: "rgba(0,212,178,0.12)", border: "1px solid rgba(0,212,178,0.3)",
          borderRadius: 99, marginBottom: "0.75rem", alignSelf: "flex-start",
        }}>
          <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--brand)" }}>
            EMPLOYER SOLUTIONS
          </span>
        </div>

        {/* Typewriter heading */}
        <div style={{
          fontSize: "clamp(1.3rem, 2.5vw, 1.9rem)", fontWeight: 900,
          lineHeight: 1.12, letterSpacing: "-0.025em", marginBottom: "0.75rem",
          overflow: "hidden",
        }}>
          <span className="typewriter-emp-1" style={{ color: "var(--right-headline)" }}>
            Built for GRC,
          </span>
          <span className="typewriter-emp-2" style={{ color: "var(--brand)" }}>
            by GRC specialists.
          </span>
        </div>

        <p style={{ fontSize: "0.75rem", color: "var(--right-subtext)", lineHeight: 1.6, marginBottom: "clamp(0.75rem, 2vh, 1.25rem)" }}>
          Stop sifting through generic resumes. Access a curated database of verified Risk and Compliance experts ready for their next challenge.
        </p>

        {/* Stats Card */}
        <div style={{
          background: "var(--stats-card-bg)", border: "1px solid var(--stats-card-border)",
          borderRadius: 14, padding: "1rem 1.25rem",
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        }}>
          {[
            { num: "5k+", label: "VETTED PRO'S", accent: false },
            { num: "14d", label: "AVG HIRE TIME", accent: true },
            { num: "150+", label: "ENTERPRISES", accent: false },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <p style={{ fontSize: "1.2rem", fontWeight: 800, color: s.accent ? "var(--brand)" : "var(--stat-num)", marginBottom: 2 }}>{s.num}</p>
              <p style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--stat-label)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

//Logo (form side)
function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.75rem" }}>
      <div style={{
        width: 28, height: 28, borderRadius: 7,
        background: "rgba(0,212,178,0.15)", border: "1.5px solid var(--brand)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <ShieldIcon style={{ width: 13, height: 13, color: "var(--brand)" }} />
      </div>
      <span style={{ fontWeight: 800, fontSize: "0.8rem", letterSpacing: "0.07em", color: "var(--text-primary)" }}>
        GRC OPENINGS
      </span>
    </div>
  );
}

// ── Main Layout ─────────────────────────────────
export function AuthLayout({ children, role = "job_seeker" }: AuthLayoutProps) {
  return (
    <div className="auth-layout">
      {/* Left (60%): form */}
      <div className="left-panel">
        <div className="form-card">
          <Logo />
          {children}
        </div>
      </div>

      {/* Right (40%): marketing panel — key triggers panel-enter animation on role switch */}
      <div key={role} className="auth-right-panel panel-enter">
        {role === "employer" ? <EmployerPanel /> : <JobSeekerPanel />}
      </div>
    </div>
  );
}
