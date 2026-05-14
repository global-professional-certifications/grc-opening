import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  onConfirm: () => void;
  onClose: () => void;
}

export function LogoutConfirmModal({ onConfirm, onClose }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 200);
  }

  function handleConfirm() {
    setVisible(false);
    setTimeout(onConfirm, 150);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      style={{
        background: visible ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0)",
        backdropFilter: visible ? "blur(6px)" : "blur(0px)",
        WebkitBackdropFilter: visible ? "blur(6px)" : "blur(0px)",
        transition: "background 0.2s ease, backdrop-filter 0.2s ease",
      }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "var(--db-card)",
          border: "1px solid var(--db-border)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.2)",
          transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.22s cubic-bezier(0.34,1.36,0.64,1), opacity 0.18s ease",
          fontFamily: "'Poppins', sans-serif",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "var(--db-primary-10)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: "var(--db-primary)" }}>logout</span>
          </div>
          <h2 className="text-[1rem] font-bold mb-1" style={{ color: "var(--db-text)" }}>Sign out?</h2>
          <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
            You will be returned to the login screen. Any unsaved changes will be lost.
          </p>
        </div>

        <div style={{ height: 1, background: "var(--db-border)" }} />

        <div className="px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-5 py-2 rounded-full text-sm font-semibold border transition-all hover:scale-105 active:scale-95"
            style={{ borderColor: "var(--db-border)", color: "var(--db-text)", background: "transparent" }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95"
            style={{ background: "var(--db-primary)", color: "#ffffff", boxShadow: "0 6px 16px var(--db-primary-40)" }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
