import React, { createContext, useContext, useState, useEffect } from "react";

export type DashboardTheme = "dark" | "light";
interface Ctx { theme: DashboardTheme; toggleTheme: () => void; }

const DashboardThemeContext = createContext<Ctx>({ theme: "light", toggleTheme: () => {} });

export function DashboardThemeProvider({ children }: { children: React.ReactNode }) {
  // Application is now locked to 'light' theme.
  const theme = "light";
  const toggleTheme = () => {};

  useEffect(() => {
    document.documentElement.setAttribute("data-db-theme", "light");
    localStorage.setItem("grc-dash-theme", "light");
  }, []);

  return (
    <DashboardThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </DashboardThemeContext.Provider>
  );
}

export const useDashboardTheme = () => useContext(DashboardThemeContext);
