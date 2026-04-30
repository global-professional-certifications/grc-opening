import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { adminFetch as apiFetch } from "../../lib/api";

interface AdminUser {
  id: string; email: string; role: string; status: string; createdAt: string;
  seekerProfile?: { firstName: string; lastName: string } | null;
  employerProfile?: { companyName: string; isVerified: boolean } | null;
}

interface ConfirmModal { title: string; message: string; confirmColor?: string; onConfirm: () => void; }

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    EMPLOYER:   "bg-blue-50 text-blue-700",
    JOB_SEEKER: "bg-purple-50 text-purple-700",
    ADMIN:      "bg-amber-50 text-amber-700",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${map[role] ?? "bg-gray-100 text-gray-500"}`}>
      {role.replace("_", " ")}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const dot: Record<string, string> = { ACTIVE: "bg-emerald-500", SUSPENDED: "bg-amber-500", BANNED: "bg-red-500" };
  const text: Record<string, string> = { ACTIVE: "text-emerald-600", SUSPENDED: "text-amber-600", BANNED: "text-red-500" };
  const label: Record<string, string> = { ACTIVE: "Active", SUSPENDED: "Suspended", BANNED: "Banned" };
  return (
    <span className={`flex items-center gap-1.5 text-[12px] font-semibold whitespace-nowrap ${text[status] ?? "text-gray-500"}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot[status] ?? "bg-gray-400"}`} />
      {label[status] ?? status}
    </span>
  );
}

// Consistent 5-column grid for both header and rows
const GRID = "grid-cols-[minmax(0,1fr)_90px_105px_115px_130px]";

function UserRow({
  u,
  actionLoading,
  onStatusChange,
  onConfirm,
}: {
  u: AdminUser;
  actionLoading: string | null;
  onStatusChange: (id: string, status: string) => void;
  onConfirm: (modal: ConfirmModal) => void;
}) {
  const name = u.seekerProfile
    ? `${u.seekerProfile.firstName} ${u.seekerProfile.lastName}`
    : u.employerProfile?.companyName ?? null;

  return (
    <div className={`grid ${GRID} gap-4 px-6 py-3.5 items-center hover:bg-gray-50/50 transition-colors`}>
      {/* USER */}
      <div className="min-w-0">
        {name && <p className="text-[13px] font-bold text-gray-800 truncate">{name}</p>}
        <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
      </div>
      {/* ROLE */}
      <RoleBadge role={u.role} />
      {/* STATUS */}
      <StatusBadge status={u.status} />
      {/* JOINED */}
      <p className="text-[11px] text-gray-400 whitespace-nowrap">
        {new Date(u.createdAt).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })}
      </p>
      {/* ACTION */}
      <div className="flex items-center">
        <select
          value={u.status}
          disabled={actionLoading === u.id}
          onChange={e => {
            const nextStatus = e.target.value;
            if (nextStatus === u.status) return;
            let message = "";
            let confirmColor = "bg-red-600 hover:bg-red-700";
            if (nextStatus === 'SUSPENDED') {
              message = "This will temporarily restrict platform access. The user cannot log in but their data is preserved. You can reinstate them at any time.";
              confirmColor = "bg-amber-500 hover:bg-amber-600";
            } else if (nextStatus === 'BANNED') {
              message = "This will permanently block all platform access. This action should only be taken for serious policy violations.";
              confirmColor = "bg-red-600 hover:bg-red-700";
            } else if (nextStatus === 'ACTIVE') {
              message = "This will reactivate the account and restore full platform access.";
              confirmColor = "bg-emerald-600 hover:bg-emerald-700";
            }
            onConfirm({
              title: "Confirm Status Change",
              message,
              confirmColor,
              onConfirm: () => onStatusChange(u.id, nextStatus),
            });
          }}
          className="text-[11px] font-medium border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-[#3a1292] min-w-[100px] hover:border-gray-300 transition-colors"
        >
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BANNED">Banned</option>
        </select>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmModal | null>(null);
  const [error, setError] = useState("");
  const LIMIT = 20;

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (roleFilter) params.set("role", roleFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (debouncedSearch) params.set("search", debouncedSearch);
    apiFetch<{ users: AdminUser[]; total: number }>(`/admin/users?${params}`)
      .then(d => { setUsers(d.users); setTotal(d.total); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, roleFilter, statusFilter, debouncedSearch]);

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

  const adminUsers = users.filter(u => u.role === "ADMIN");
  const regularUsers = users.filter(u => u.role !== "ADMIN");
  const totalPages = Math.ceil(total / LIMIT);

  const tableHeader = (
    <div className={`grid ${GRID} gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50/60`}>
      {["USER", "ROLE", "STATUS", "JOINED", "ACTION"].map(h => (
        <p key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</p>
      ))}
    </div>
  );

  return (
    <AdminLayout title="User Management">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] flex justify-between items-center">
          {error}
          <button onClick={() => setError("")} className="font-bold text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Status legend */}
      <div className="mb-5 flex items-center gap-4 text-[11px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <strong>Suspend</strong> — temporarily restricts login; data preserved
        </span>
        <span className="text-gray-300">|</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <strong>Ban</strong> — permanently blocks all access
        </span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 17 }}>search</span>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
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

      {/* Regular users table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {tableHeader}
        <div className="divide-y divide-gray-50">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`grid ${GRID} gap-4 px-6 py-4`}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ))
          ) : regularUsers.length === 0 ? (
            <div className="px-6 py-10 text-center text-[13px] text-gray-400">No users found.</div>
          ) : regularUsers.map(u => (
            <UserRow
              key={u.id} u={u} actionLoading={actionLoading}
              onStatusChange={changeStatus} onConfirm={setConfirm}
            />
          ))}
        </div>
      </div>

      {/* Admin users — separate section */}
      {(adminUsers.length > 0 || (!loading && roleFilter === "")) && (
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
            Platform Administrators
          </p>
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
            {tableHeader}
            <div className="divide-y divide-gray-50">
              {loading ? (
                <div className={`grid ${GRID} gap-4 px-6 py-4`}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="h-4 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : adminUsers.length === 0 ? (
                <div className="px-6 py-6 text-center text-[12px] text-gray-300">No admin accounts on this page.</div>
              ) : adminUsers.map(u => {
                const name = u.seekerProfile
                  ? `${u.seekerProfile.firstName} ${u.seekerProfile.lastName}`
                  : u.employerProfile?.companyName ?? null;
                return (
                  <div key={u.id} className={`grid ${GRID} gap-4 px-6 py-3.5 items-center bg-amber-50/30`}>
                    <div className="min-w-0">
                      {name && <p className="text-[13px] font-bold text-gray-800 truncate">{name}</p>}
                      <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                    </div>
                    <RoleBadge role={u.role} />
                    <StatusBadge status={u.status} />
                    <p className="text-[11px] text-gray-400 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                    <span className="text-[11px] text-gray-300 italic">Protected</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-[13px] text-gray-500">
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
          </p>
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
                className={`flex-1 py-2.5 rounded-xl text-white text-[14px] font-bold transition-all ${confirm.confirmColor || "bg-red-600 hover:bg-red-700"}`}
              >Confirm</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
