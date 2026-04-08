import React, { useState } from "react";
import { CandidateForm } from "./components/CandidateForm";
import { EmployerForm } from "./components/EmployerForm";

type Role = "job_seeker" | "employer";

export function RegistrationForm({ onRoleChange }: { onRoleChange?: (role: Role) => void }) {
  const [role, setRole] = useState<Role>("job_seeker");

  function handleRoleSwitch(r: Role) {
    setRole(r);
    onRoleChange?.(r);
  }

  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in duration-500" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Heading */}
      <div className="mb-2">
        <h2 className="text-[28px] font-bold tracking-tight text-[#3a1292] leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {role === "job_seeker" ? "Join as Candidate" : "Join as Employer"}
        </h2>
        <p className="text-[14px] text-gray-500 font-medium">
          {role === "job_seeker" 
            ? "Access the world's most exclusive GRC job network." 
            : "Connect with verified and pre-screened GRC talent."
          }
        </p>
      </div>

      {/* Premium Capsule Role Switcher */}
      <div className="flex p-1.5 bg-gray-100 rounded-2xl relative overflow-hidden mb-2">
        {(["job_seeker", "employer"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => handleRoleSwitch(r)}
            className={`
              flex-1 py-2.5 rounded-xl text-[13px] font-bold tracking-wide z-10 transition-all duration-300
              ${role === r 
                ? "bg-[#3a1292] text-white shadow-lg" 
                : "text-gray-500 hover:text-gray-900"
              }
            `}
          >
            {r === "job_seeker" ? "Job Seeker" : "Employer"}
          </button>
        ))}
      </div>

      {/* Forms Section */}
      <div className="animate-in slide-in-from-bottom-3 duration-500">
        {role === "job_seeker" ? <CandidateForm /> : <EmployerForm />}
      </div>
    </div>
  );
}
