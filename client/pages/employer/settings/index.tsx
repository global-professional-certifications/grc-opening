import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { createPortal } from "react-dom";
import { EmployerDashboardLayout } from "../../../components/layout/EmployerDashboardLayout";
import { MONO, SYNE, Toggle } from "../../../components/employer/profile/shared";
import { apiFetch } from "../../../lib/api";
import { useUser } from "../../../contexts/UserContext";
import { LogoutConfirmModal } from "../../../components/ui/LogoutConfirmModal";

const STORAGE_KEY = "grc_employer_profile";

// ─── Delete Account Modal ─────────────────────────────────────────────────────

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (visible) inputRef.current?.focus();
  }, [visible]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 200);
  }

  async function handleDelete() {
    if (confirmText !== "DELETE") return;
    setLoading(true);
    setError("");
    try {
      await apiFetch("/profile/me", { method: "DELETE" });
      // Clear all auth tokens and local data
      localStorage.removeItem("grc_token");
      localStorage.removeItem("grc_employer_profile");
      localStorage.removeItem("grc-dash-theme");
      router.replace("/auth/login");
    } catch {
      setError("Failed to delete account. Please try again.");
      setLoading(false);
    }
  }

  const canDelete = confirmText === "DELETE";

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      style={{
        background: visible ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0)",
        backdropFilter: visible ? "blur(8px)" : "blur(0px)",
        WebkitBackdropFilter: visible ? "blur(8px)" : "blur(0px)",
        transition: "background 0.2s ease, backdrop-filter 0.2s ease",
      }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "var(--db-card)",
          border: "1px solid rgba(239,68,68,0.25)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.25)",
          transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.22s cubic-bezier(0.34,1.36,0.64,1), opacity 0.18s ease",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(239,68,68,0.1)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: "#ef4444" }}>delete_forever</span>
          </div>
          <h2 className="text-lg font-bold mb-1" style={{ color: "var(--db-text)" }}>Delete Account</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--db-text-muted)" }}>
            This action is <strong style={{ color: "var(--db-text)" }}>permanent and irreversible</strong>. Your company profile, job listings, and all applicant data will be permanently deleted.
          </p>
        </div>

        <div style={{ height: 1, background: "var(--db-border)" }} />

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl p-3 text-sm" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "#b91c1c" }}>
            <ul className="space-y-1 list-disc list-inside text-[13px]">
              <li>All active and closed job listings</li>
              <li>All received applications and candidate data</li>
              <li>Company profile and settings</li>
              <li>This action cannot be undone</li>
            </ul>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ ...MONO, color: "var(--db-text-muted)" }}>
              Type <span style={{ color: "#ef4444" }}>DELETE</span> to confirm
            </label>
            <input
              ref={inputRef}
              type="text"
              value={confirmText}
              onChange={e => { setConfirmText(e.target.value); setError(""); }}
              placeholder="DELETE"
              className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold outline-none transition-all"
              style={{
                background: "var(--db-surface)",
                border: `1.5px solid ${confirmText === "DELETE" ? "#ef4444" : "var(--db-border)"}`,
                color: "var(--db-text)",
                boxShadow: confirmText === "DELETE" ? "0 0 0 3px rgba(239,68,68,0.1)" : "none",
              }}
              autoComplete="off"
              spellCheck={false}
            />
            {error && (
              <p className="mt-2 text-xs" style={{ ...MONO, color: "#ef4444" }}>{error}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-full text-sm font-semibold border transition-all hover:scale-105 active:scale-95"
            style={{ borderColor: "var(--db-border)", color: "var(--db-text)", background: "transparent" }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!canDelete || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all"
            style={{
              background: canDelete && !loading ? "#ef4444" : "var(--db-border)",
              color: canDelete && !loading ? "#ffffff" : "var(--db-text-muted)",
              cursor: !canDelete || loading ? "not-allowed" : "pointer",
              boxShadow: canDelete && !loading ? "0 8px 20px rgba(239,68,68,0.3)" : "none",
            }}
          >
            {loading && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
            {loading ? "Deleting…" : "Delete Account"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────

export default function EmployerSettingsPage() {
  const router = useRouter();

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { logout } = useUser();

  function handleLogout() {
    logout();
    router.replace("/auth/login");
  }

  useEffect(() => {
    const toggle = document.querySelector<HTMLElement>(".theme-toggle");
    if (toggle) toggle.style.display = "none";
    return () => { if (toggle) toggle.style.display = ""; };
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setData(prev => ({
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
    setData(prev => {
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
    { key: "emailNotifications", icon: "mail",       title: "Email Notifications", desc: "Receive email alerts for important account activity and updates" },
    { key: "applicantAlerts",    icon: "person_add",  title: "New Applicant Alerts", desc: "Get notified immediately when a candidate applies to your listings" },
    { key: "weeklyDigest",       icon: "summarize",   title: "Weekly Digest", desc: "A weekly summary of pipeline activity, applicants, and listing performance" },
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
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--db-primary)" }}>notifications</span>
              <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ ...MONO, color: "var(--db-text-muted)" }}>
                Notification Preferences
              </h3>
            </div>
            <div className="space-y-1 divide-y" style={{ borderColor: "var(--db-border)" }}>
              {notificationItems.map(({ key, icon, title, desc }) => (
                <div key={key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--db-primary-10)" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--db-primary)" }}>{icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>{title}</p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--db-text-muted)" }}>{desc}</p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <Toggle checked={data[key as keyof NotificationData]} onChange={v => handleChange(key, v)} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Account */}
          <div className="db-card rounded-2xl p-6" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--db-primary)" }}>manage_accounts</span>
              <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ ...MONO, color: "var(--db-text-muted)" }}>
                Account
              </h3>
            </div>
            <div className="space-y-1">
              {/* Change Password — placeholder, wired when password-change flow exists */}
              <button
                className="w-full flex items-center justify-between p-3 rounded-xl transition-colors group text-left"
                style={{ color: "var(--db-text-secondary)", background: "transparent", border: "none", cursor: "pointer" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--db-surface)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ""; }}
                disabled
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--db-text-muted)" }}>lock</span>
                  <span className="text-sm font-medium">Change Password</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{ background: "var(--db-primary-10)", color: "var(--db-primary)" }}>Soon</span>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--db-text-muted)" }}>chevron_right</span>
              </button>

              {/* Delete Account */}
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl transition-colors group text-left"
                style={{ color: "#ef4444", background: "transparent", border: "none", cursor: "pointer" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.06)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ""; }}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#ef4444" }}>delete</span>
                  <span className="text-sm font-medium">Delete Account</span>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#ef4444" }}>chevron_right</span>
              </button>
            </div>

            <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--db-border)" }}>
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-colors text-left"
                style={{ color: "#ef4444", background: "transparent", border: "none", cursor: "pointer" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ""; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />}
      {showLogoutModal && <LogoutConfirmModal onConfirm={handleLogout} onClose={() => setShowLogoutModal(false)} />}
    </EmployerDashboardLayout>
  );
}
