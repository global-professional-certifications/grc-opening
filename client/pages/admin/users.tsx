import React, { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { adminFetch as apiFetch } from "../../lib/api";

interface AdminUser {
  id: string; email: string; role: string; status: string; createdAt: string;
  seekerProfile?: { firstName: string; lastName: string } | null;
  employerProfile?: { companyName: string; isVerified: boolean } | null;
}

interface ConfirmModal { title: string; message: string; onConfirm: () => void; }

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    EMPLOYER:  "bg-blue-50 text-blue-700",
    JOB_SEEKER: "bg-purple-50 text-purple-700",
    ADMIN:     "bg-amber-50 text-amber-700",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[role] ?? "bg-gray-100 text-gray-500"}`}>
      {role.replace("_", " ")}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE:    "text-emerald-600",
    SUSPENDED: "text-amber-600",
    BANNED:    "text-red-500",
  };
  const dotColor: Record<string, string> = { ACTIVE: "bg-emerald-500", SUSPENDED: "bg-amber-500", BANNED: "bg-red-500" };
  return (
    <span className={`flex items-center gap-1.5 text-[12px] font-semibold ${map[status] ?? "text-gray-500"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor[status] ?? "bg-gray-400"}`} />
      {status === "ACTIVE" ? "Active" : status === "BANNED" ? "Disabled" : "Suspended"}
    </span>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmModal | null>(null);
  const [error, setError] = useState("");
  const LIMIT = 20;

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (roleFilter) params.set("role", roleFilter);
    if (statusFilter) params.set("status", statusFilter);
    apiFetch<{ users: AdminUser[]; total: number }>(`/admin/users?${params}`)
      .then(d => { setUsers(d.users); setTotal(d.total); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function changeStatus(userId: string, status: string) {
    setActionLoading(userId);
    try {
      await apiFetch(`/admin/users/${userId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
    } catch (e: any) { setError(e.message); }
    setActionLoading(null);
    setConfirm(null);
  }

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.seekerProfile?.firstName?.toLowerCase().includes(q) ||
      u.seekerProfile?.lastName?.toLowerCase().includes(q) ||
      u.employerProfile?.companyName?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminLayout title="User Management">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] flex justify-between items-center">
          {error}
          <button onClick={() => setError("")} className="font-bold text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 17 }}>search</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name or email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[13px] focus:outline-none focus:border-[#3a1292] focus:ring-2 focus:ring-[#3a1292]/10"
          />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[13px] font-medium focus:outline-none focus:border-[#3a1292]"
        >
          <option value="">All Roles</option>
          <option value="JOB_SEEKER">Job Seeker</option>
          <option value="EMPLOYER">Employer</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[13px] font-medium focus:outline-none focus:border-[#3a1292]"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BANNED">Banned</option>
        </select>
        <span className="text-[12px] text-gray-400">{total} users</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50/60">
          {["USER", "ID", "ROLE", "STATUS", "JOINED", "ACTION"].map(h => (
            <p key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</p>
          ))}
        </div>
        <div className="divide-y divide-gray-50">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-4">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ))
          ) : filtered.map(u => {
            const name = u.seekerProfile
              ? `${u.seekerProfile.firstName} ${u.seekerProfile.lastName}`
              : u.employerProfile?.companyName ?? null;
            return (
              <div key={u.id} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-3.5 items-center hover:bg-gray-50/50 transition-colors">
                <div className="overflow-hidden">
                  {name && <p className="text-[13px] font-bold text-gray-800 truncate">{name}</p>}
                  <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                </div>
                <p className="text-[10px] font-mono text-gray-300">{u.id.slice(0, 8)}</p>
                <RoleBadge role={u.role} />
                <StatusBadge status={u.status} />
                <p className="text-[11px] text-gray-400 whitespace-nowrap">
                  {new Date(u.createdAt).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })}
                </p>
                {u.role !== "ADMIN" ? (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={u.status}
                      disabled={actionLoading === u.id}
                      onChange={e => changeStatus(u.id, e.target.value)}
                      className="text-[11px] font-medium border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-[#3a1292]"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="SUSPENDED">Suspend</option>
                      <option value="BANNED">Ban</option>
                    </select>
                    <button
                      disabled={actionLoading === u.id}
                      onClick={() => {
                        if (u.status === "BANNED") { changeStatus(u.id, "ACTIVE"); return; }
                        setConfirm({
                          title: "Disable User",
                          message: `This will immediately block "${u.email}" from all future API requests. Continue?`,
                          onConfirm: () => changeStatus(u.id, "BANNED"),
                        });
                      }}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all disabled:opacity-50 ${
                        u.status === "BANNED" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-red-50 text-red-600 hover:bg-red-100"
                      }`}
                    >
                      {actionLoading === u.id ? "..." : u.status === "BANNED" ? "Enable" : "Disable"}
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-gray-300">Admin</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-[13px] text-gray-500">Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-[13px] font-medium disabled:opacity-40 hover:bg-white transition-all"
            >← Prev</button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-[13px] font-medium disabled:opacity-40 hover:bg-white transition-all"
            >Next →</button>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-[17px] font-bold text-gray-900 mb-2">{confirm.title}</h3>
            <p className="text-[13px] text-gray-500 mb-6 leading-relaxed">{confirm.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[14px] font-semibold text-gray-600 hover:bg-gray-50 transition-all"
              >Cancel</button>
              <button onClick={confirm.onConfirm}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-[14px] font-bold hover:bg-red-700 transition-all"
              >Confirm</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
