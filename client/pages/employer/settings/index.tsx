import React, { useState, useEffect } from "react";
import { EmployerDashboardLayout } from "../../../components/layout/EmployerDashboardLayout";
import { MONO, SYNE, Toggle } from "../../../components/employer/profile/shared";

const STORAGE_KEY = "grc_employer_profile";

export default function EmployerSettingsPage() {
  interface NotificationData {
    emailNotifications: boolean;
    applicantAlerts: boolean;
    weeklyDigest: boolean;
  }

  const [data, setData] = useState<NotificationData>({
    emailNotifications: true,
    applicantAlerts: true,
    weeklyDigest: false,
  });
  
  // Hide global theme toggle
  useEffect(() => {
    const toggle = document.querySelector<HTMLElement>(".theme-toggle");
    if (toggle) toggle.style.display = "none";
    return () => {
      if (toggle) toggle.style.display = "";
    };
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setData((prev) => ({
          ...prev,
          emailNotifications: parsed.emailNotifications ?? true,
          applicantAlerts: parsed.applicantAlerts ?? true,
          weeklyDigest: parsed.weeklyDigest ?? false,
        }));
      }
    } catch (e) {
      console.error("Failed to load settings from localStorage", e);
    }
  }, []);

  const handleChange = (key: string, value: boolean) => {
    setData((prev) => {
      const next = { ...prev, [key]: value };
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : {};
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, ...next }));
      } catch (e) {
        console.error("Failed to save settings to localStorage", e);
      }
      return next;
    });
  };

  const notificationItems = [
    {
      key: "emailNotifications",
      icon: "mail",
      title: "Email Notifications",
      desc: "Receive email alerts for important account activity and updates",
    },
    {
      key: "applicantAlerts",
      icon: "person_add",
      title: "New Applicant Alerts",
      desc: "Get notified immediately when a candidate applies to your listings",
    },
    {
      key: "weeklyDigest",
      icon: "summarize",
      title: "Weekly Digest",
      desc: "A weekly summary of pipeline activity, applicants, and listing performance",
    },
  ];

  return (
    <EmployerDashboardLayout>
      <header className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl lg:text-3xl font-semibold" style={{ ...SYNE, color: "var(--db-text)" }}>
            Settings
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
            Manage your account settings and notification preferences.
          </p>
        </div>
      </header>
      
      <div className="max-w-4xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notification Preferences */}
          <div className="db-card rounded-2xl p-6 space-y-5" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--db-primary)" }}>
                notifications
              </span>
              <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ ...MONO, color: "var(--db-text-muted)" }}>
                Notification Preferences
              </h3>
            </div>
            <div className="space-y-1 divide-y" style={{ borderColor: "var(--db-border)" }}>
              {notificationItems.map(({ key, icon, title, desc }) => (
                <div key={key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "var(--db-primary-10)" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--db-primary)" }}>{icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>{title}</p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--db-text-muted)" }}>{desc}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Toggle checked={data[key as keyof NotificationData]} onChange={(v) => handleChange(key, v)} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Account settings */}
          <div className="db-card rounded-2xl p-6" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--db-primary)" }}>
                manage_accounts
              </span>
              <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ ...MONO, color: "var(--db-text-muted)" }}>
                Account
              </h3>
            </div>
            <div className="space-y-2">
              {[
                { icon: "lock", label: "Change Password", href: "#password" },
                { icon: "security", label: "Two-Factor Auth", href: "#2fa" },
                { icon: "download", label: "Export Data", href: "#export" },
              ].map(({ icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="flex items-center justify-between p-3 rounded-xl transition-colors group"
                  style={{ color: "var(--db-text-secondary)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--db-surface)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = ""; }}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--db-text-muted)" }}>{icon}</span>
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--db-text-muted)" }}>chevron_right</span>
                </a>
              ))}
            </div>
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--db-border)" }}>
              <a
                href="/"
                className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-colors"
                style={{ color: "#ef4444" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(239,68,68,0.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = ""; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
                Sign out
              </a>
            </div>
          </div>
        </div>
      </div>
    </EmployerDashboardLayout>
  );
}
