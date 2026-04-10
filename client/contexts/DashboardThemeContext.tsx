import React, { createContext, useContext, useState, useEffect } from "react";

export type DashboardTheme = "dark" | "light";
interface Ctx { theme: DashboardTheme; toggleTheme: () => void; }

const DashboardThemeContext = createContext<Ctx>({ theme: "light", toggleTheme: () => {} });

export function DashboardThemeProvider({ children }: { children: React.ReactNode }) {
  // SSR default = "light" (matches the new app default and the blocking script)
  const [theme, setTheme] = useState<DashboardTheme>("light");

  useEffect(() => {
    // Blocking script in _document.tsx already applied the correct class to <html>.
    // Here we just sync React state with what was set (localStorage ΓåÆ fallback "light").
    const saved = localStorage.getItem("grc-dash-theme") as DashboardTheme | null;
    const resolved: DashboardTheme = saved === "dark" || saved === "light" ? saved : "light";
    setTheme(resolved);
    // Ensure html attribute stays in sync (covers edge cases)
    document.documentElement.setAttribute("data-db-theme", resolved);
  }, []);

  const toggleTheme = () => {
    const next: DashboardTheme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("grc-dash-theme", next);
    // Drive the CSS vars from <html> so every element on the page updates at once
    document.documentElement.setAttribute("data-db-theme", next);
  };

  return (
    <DashboardThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </DashboardThemeContext.Provider>
  );

}

export const useDashboardTheme = () => useContext(DashboardThemeContext);
