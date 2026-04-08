import React from "react";

interface ModernInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: string;
  error?: string;
  hint?: string;
}

export function ModernInput({ label, icon, error, hint, id, ...props }: ModernInputProps) {
  const [focused, setFocused] = React.useState(false);

  return (
    <div className="flex flex-col gap-1 w-full group">
      <label
        htmlFor={id}
        className={`text-[13px] font-semibold transition-colors duration-200 tracking-tight ${
          focused ? "text-[#3a1292]" : "text-gray-500"
        }`}
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {label}
      </label>
      
      <div className="relative group-hover:transform group-hover:translate-y-[-1px] transition-transform duration-300">
        {icon && (
          <span
            className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] pointer-events-none transition-colors duration-300"
            style={{ color: focused ? "#3a1292" : "#94a3b8" }}
          >
            {icon}
          </span>
        )}
        
        <input
          id={id}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`
            w-full transition-all duration-300 outline-none
            text-[14.5px] font-medium leading-relaxed text-gray-900 placeholder:text-gray-400
            ${icon ? "pl-11" : "pl-4"} pr-4 py-2.5
            bg-[#f9fafb] hover:bg-white focus:bg-white
            rounded-xl
            border border-gray-200
            ${error 
              ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10" 
              : "focus:border-[#3a1292] focus:ring-4 focus:ring-[#3a1292]/10 shadow-sm hover:shadow-md"
            }
          `}
          style={{ fontFamily: "'Poppins', sans-serif" }}
          {...props}
        />
      </div>

      {error ? (
        <span className="text-[12px] font-medium text-red-500 mt-0.5 ml-1 animate-in fade-in slide-in-from-top-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {error}
        </span>
      ) : hint ? (
        <span className="text-[11px] font-medium text-gray-400 mt-0.5 ml-1 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}
