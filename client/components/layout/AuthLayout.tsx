import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
  role?: "job_seeker" | "employer";
}

function Logo() {
  return (
    <div className="flex items-center gap-2 mb-6">
      <div className="w-9 h-9 rounded-xl bg-[#3a1292] flex items-center justify-center shadow-lg shadow-[#3a1292]/20">
        <span className="material-symbols-outlined text-white text-[20px]">shield</span>
      </div>
      <span className="font-extrabold text-[16px] tracking-tight text-[#3a1292]" style={{ fontFamily: "'Poppins', sans-serif" }}>
        GRC OPENINGS
      </span>
    </div>
  );
}

function MarketingPanel({ 
  role, 
  title, 
  subtitle, 
  stats 
}: { 
  role: string;
  title: string;
  subtitle: string;
  stats: { label: string; value: string }[]
}) {
  return (
    <div className="relative w-full h-full p-12 lg:p-16 flex flex-col justify-between text-white overflow-hidden">
      {/* Premium Mesh Gradient Background */}
      <div className="absolute inset-0 bg-[#3a1292] z-0" />
      <div className="absolute top-[-10%] right-[-10%] w-[700px] h-[700px] bg-[#5a2dc1] opacity-40 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[500px] h-[500px] bg-[#2a0d6e] opacity-60 blur-[100px] rounded-full" />
      
      {/* Decorative Overlay */}
      <div className="absolute inset-0 opacity-[0.03] z-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col gap-8 max-w-[540px]">
        <div className="px-5 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-md self-start">
          <span className="text-[11px] font-bold tracking-[0.15em] uppercase opacity-90" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {role.replace("_", " ")} PLATFORM
          </span>
        </div>
        
        <h1 className="text-[52px] lg:text-[60px] font-bold leading-[1.1] tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {title}
        </h1>
        
        <p className="text-[18px] lg:text-[19px] leading-relaxed opacity-80 font-normal" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {subtitle}
        </p>
      </div>

      {/* Stats Section: Glassmorphism */}
      <div className="relative z-10 grid grid-cols-3 gap-8 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
        {stats.map((stat, i) => (
          <div key={i} className="flex flex-col gap-1">
            <span className="text-[28px] font-bold leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>{stat.value}</span>
            <span className="text-[10px] font-semibold tracking-wider uppercase opacity-50" style={{ fontFamily: "'Poppins', sans-serif" }}>{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AuthLayout({ children, role = "job_seeker" }: AuthLayoutProps) {
  const seekerContent = {
    title: "The Future of GRC Careers.",
    subtitle: "Join the most exclusive community of Risk, Compliance, and Audit professionals globally.",
    stats: [
      { value: "50k+", label: "Professionals" },
      { value: "1,200", label: "Companies" },
      { value: "94%", label: "Placement" }
    ]
  };

  const employerContent = {
    title: "Hire Elite GRC Talent.",
    subtitle: "Stop sifting through generic resumes. Access a curated database of verified GRC specialists.",
    stats: [
      { value: "12 Days", label: "Avg Hire" },
      { value: "Verified", label: "Credentials" },
      { value: "24/7", label: "Support" }
    ]
  };

  const content = role === "employer" ? employerContent : seekerContent;

  return (
    <div className="auth-layout w-full min-h-screen" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Left Panel: Form Section (Clean White) */}
      <div className="w-full h-full bg-white flex flex-col items-center justify-center px-6 lg:px-12 py-4">
        <div className="w-full max-w-[560px]">
          <Logo />
          {children}
        </div>
      </div>

      {/* Right Panel: Marketing Section (Brand Blue) */}
      <div className="hidden lg:block w-full h-full bg-[#3a1292] relative">
        <MarketingPanel 
          key={role}
          role={role}
          title={content.title}
          subtitle={content.subtitle}
          stats={content.stats}
        />
      </div>
    </div>
  );
}
