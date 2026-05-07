import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { adminFetch } from "../../lib/api";

interface AuditLog {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  admin: { email: string };
}

function formatAction(action: string, adminEmail: string): { username: string; rest: string } {
  const username = adminEmail.split("@")[0];
  const actionMap: Record<string, string> = {
    USER_DISABLED:                "disabled a user account",
    USER_ENABLED:                 "enabled a user account",
    USER_STATUS_CHANGED:          "changed user status",
    JOB_APPROVED:                 "approved a job posting",
    JOB_REJECTED:                 "rejected a job posting",
    JOB_CLOSED:                   "closed a job listing",
    COMPANY_VERIFIED:             "verified a company",
    COMPANY_VERIFICATION_REVOKED: "revoked company verification",
    BROADCAST_SENT:               "sent a broadcast notification",
  };
  const rest = actionMap[action] ?? action.toLowerCase().replace(/_/g, " ");
  return { username, rest };
}

function ActionCell({ action, adminEmail }: { action: string; adminEmail: string }) {
  const { username, rest } = formatAction(action, adminEmail);
  return (
    <span className="text-[13px] text-gray-700">
      <span className="inline-block bg-amber-100 text-amber-800 font-semibold px-1 rounded mr-1">
        {username}
      </span>
      {rest}
    </span>
  );
}

function UserCell({ email }: { email: string }) {
  const username = email.split("@")[0];
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-[#3a1292]/10 border border-[#3a1292]/20 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-[#3a1292]" style={{ fontSize: 14 }}>person</span>
      </div>
      <span className="text-[13px] text-gray-600 truncate max-w-[120px]" title={email}>{username}</span>
    </div>
  );
}

const ROWS_OPTIONS = [25, 50, 100];
const DEFAULT_LIMIT = 50;

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLogs = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    adminFetch<{ logs: AuditLog[]; total: number }>(`/admin/audit-logs?${params}`)
      .then(d => { setLogs(d.logs); setTotal(d.total); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, limit, search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit);
  const rangeStart = (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);

  function handleSearchSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  function handleClearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  return (
    <AdminLayout title="Audit Logs">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] flex justify-between items-center">
          {error}
          <button onClick={() => setError("")} className="font-bold text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="mb-5">
        <div className="relative max-w-sm">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400"
            style={{ fontSize: 18 }}
          >
            search
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by admin username…"
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-200 bg-white text-[13px] focus:outline-none focus:border-[#3a1292] focus:ring-2 focus:ring-[#3a1292]/10"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
            </button>
          )}
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[minmax(0,1fr)_180px_160px] border-b border-gray-100 bg-gray-50/70">
          <div className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Action</div>
          <div className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">User</div>
          <div className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            Time
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_downward</span>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[minmax(0,1fr)_180px_160px] px-6 py-3.5">
                <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                <div className="px-4"><div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" /></div>
                <div className="px-4"><div className="h-4 bg-gray-100 rounded animate-pulse w-full" /></div>
              </div>
            ))
          ) : logs.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <span className="material-symbols-outlined text-gray-300" style={{ fontSize: 48 }}>history</span>
              <p className="text-[14px] text-gray-400 mt-3 font-medium">No audit logs found</p>
              {search && (
                <button onClick={handleClearSearch} className="mt-3 text-[12px] text-[#3a1292] font-semibold hover:underline">
                  Clear search
                </button>
              )}
            </div>
          ) : logs.map(log => (
            <div key={log.id} className="grid grid-cols-[minmax(0,1fr)_180px_160px] hover:bg-gray-50/60 transition-colors">
              <div className="px-6 py-3.5">
                <ActionCell action={log.action} adminEmail={log.admin.email} />
              </div>
              <div className="px-4 py-3.5">
                <UserCell email={log.admin.email} />
              </div>
              <div className="px-4 py-3.5">
                <p className="text-[12px] text-gray-500 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <p className="text-[11px] text-gray-400 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination footer */}
        <div className="flex items-center justify-end gap-4 px-6 py-3 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 text-[12px] text-gray-500">
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
              className="border border-gray-200 rounded px-1.5 py-0.5 text-[12px] bg-white focus:outline-none focus:border-[#3a1292]"
            >
              {ROWS_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <span className="text-[12px] text-gray-500 tabular-nums">
            {loading ? "—" : total === 0 ? "0" : `${rangeStart}–${rangeEnd} of ${total}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 disabled:opacity-30 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
            </button>
            <button
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage(p => p + 1)}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 disabled:opacity-30 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
