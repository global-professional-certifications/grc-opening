import { useState } from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { adminFetch } from "../../lib/api";

const TARGET_OPTIONS = [
  { value: "ALL",        label: "All Users",       icon: "group",       desc: "Every active user on the platform" },
  { value: "JOB_SEEKER", label: "Job Seekers Only", icon: "person_search", desc: "Active users with JOB_SEEKER role" },
  { value: "EMPLOYER",   label: "Employers Only",  icon: "business",    desc: "Active users with EMPLOYER role" },
];

export default function AdminBroadcastPage() {
  const [title, setTitle]           = useState("");
  const [message, setMessage]       = useState("");
  const [targetRole, setTargetRole] = useState("ALL");
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setError("Title and message are both required.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await adminFetch<{ recipientCount: number }>("/admin/broadcast", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), message: message.trim(), targetRole }),
      });
      setSuccess(`Broadcast sent to ${res.recipientCount} user${res.recipientCount !== 1 ? "s" : ""}.`);
      setTitle("");
      setMessage("");
      setTargetRole("ALL");
    } catch (e: any) {
      setError(e.message || "Failed to send broadcast.");
    } finally {
      setLoading(false);
    }
  };

  const charLimit = 500;

  return (
    <AdminLayout title="Broadcast Notifications">
      <div>
        <p className="text-[13px] text-gray-500 mb-6">
          Send an in-app notification to all active users or a specific role. Every broadcast is logged in the audit trail.
        </p>

        {success && (
          <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-500" style={{ fontSize: 20 }}>check_circle</span>
            {success}
          </div>
        )}
        {error && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] flex justify-between items-center">
            {error}
            <button onClick={() => setError(null)} className="font-bold text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">

          {/* Audience */}
          <div>
            <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-3">
              Audience
            </label>
            <div className="grid grid-cols-3 gap-3">
              {TARGET_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTargetRole(opt.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${
                    targetRole === opt.value
                      ? "border-[#3a1292] bg-[#3a1292]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined ${targetRole === opt.value ? "text-[#3a1292]" : "text-gray-400"}`}
                    style={{ fontSize: 24 }}
                  >
                    {opt.icon}
                  </span>
                  <span className={`text-[12px] font-bold ${targetRole === opt.value ? "text-[#3a1292]" : "text-gray-600"}`}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-gray-400">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-2">
              Notification Title
            </label>
            <input
              type="text"
              value={title}
              maxLength={100}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Platform Maintenance Notice"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:border-[#3a1292] focus:ring-2 focus:ring-[#3a1292]/10"
            />
            <p className="text-[11px] text-gray-400 mt-1 text-right">{title.length}/100</p>
          </div>

          {/* Message */}
          <div>
            <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-2">
              Message
            </label>
            <textarea
              value={message}
              maxLength={charLimit}
              onChange={e => setMessage(e.target.value)}
              rows={5}
              placeholder="Write your message here…"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:border-[#3a1292] focus:ring-2 focus:ring-[#3a1292]/10 resize-none"
            />
            <p className="text-[11px] text-gray-400 mt-1 text-right">{message.length}/{charLimit}</p>
          </div>

          {/* Preview */}
          {(title.trim() || message.trim()) && (
            <div className="rounded-xl border border-dashed border-gray-300 p-4 bg-gray-50">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Preview</p>
              <p className="text-[13px] font-bold text-gray-800">{title || "—"}</p>
              <p className="text-[12px] text-gray-600 mt-1 whitespace-pre-wrap">{message || "—"}</p>
            </div>
          )}

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={loading || !title.trim() || !message.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#3a1292] text-white text-[13px] font-bold hover:bg-[#2e0e7a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>campaign</span>
            )}
            {loading ? "Sending…" : "Send Broadcast"}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
