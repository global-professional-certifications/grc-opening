import React, { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { adminFetch as apiFetch } from "../../lib/api";

interface Company {
  id: string;
  companyName: string;
  isVerified: boolean;
  industry?: string;
  city?: string;
  country?: string;
  createdAt: string;
  _count: { jobs: number };
  user: { id: string; email: string; status: string };
}

function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      Pending
    </span>
  );
}

function AccountBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE:    "bg-emerald-50 text-emerald-700",
    SUSPENDED: "bg-amber-50 text-amber-700",
    BANNED:    "bg-red-50 text-red-600",
  };
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const LIMIT = 20;

  const fetchCompanies = useCallback(() => {
    setLoading(true);
    apiFetch<{ companies: Company[]; total: number }>(`/admin/companies?page=${page}&limit=${LIMIT}`)
      .then(data => { setCompanies(data.companies); setTotal(data.total); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  async function toggleVerify(company: Company) {
    setActionLoading(company.id);
    try {
      const next = !company.isVerified;
      await apiFetch(`/admin/companies/${company.id}/verify`, {
        method: "PATCH",
        body: JSON.stringify({ verified: next }),
      });
      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, isVerified: next } : c));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = companies.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.companyName.toLowerCase().includes(q) ||
      c.user.email.toLowerCase().includes(q) ||
      (c.industry ?? "").toLowerCase().includes(q) ||
      (c.country ?? "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminLayout title="Companies">
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
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search company, email, country..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[13px] focus:outline-none focus:border-[#3a1292] focus:ring-2 focus:ring-[#3a1292]/10"
          />
        </div>
        <span className="text-[12px] text-gray-400">{total} companies</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50/60">
          {["COMPANY", "OWNER", "JOBS", "LOCATION", "STATUS", "REGISTERED", "ACTION"].map(h => (
            <p key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</p>
          ))}
        </div>
        <div className="divide-y divide-gray-50">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-4 px-6 py-4">
                {Array.from({ length: 7 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ))
          ) : filtered.map(c => (
            <div key={c.id} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-4 px-6 py-3.5 items-center hover:bg-gray-50/50 transition-colors">
              {/* Company */}
              <div className="overflow-hidden">
                <p className="text-[13px] font-bold text-gray-800 truncate">{c.companyName}</p>
                {c.industry && <p className="text-[10px] text-gray-400 truncate">{c.industry}</p>}
              </div>

              {/* Owner */}
              <div className="text-right">
                <p className="text-[11px] text-gray-600 truncate max-w-[160px]">{c.user.email}</p>
                <AccountBadge status={c.user.status} />
              </div>

              {/* Jobs */}
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-center">
                {c._count.jobs}
              </span>

              {/* Location */}
              <p className="text-[11px] text-gray-400 whitespace-nowrap">
                {[c.city, c.country].filter(Boolean).join(", ") || "—"}
              </p>

              {/* Verified */}
              <VerifiedBadge verified={c.isVerified} />

              {/* Registered */}
              <p className="text-[11px] text-gray-400 whitespace-nowrap">
                {new Date(c.createdAt).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })}
              </p>

              {/* Action */}
              <button
                disabled={actionLoading === c.id}
                onClick={() => toggleVerify(c)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 whitespace-nowrap ${
                  c.isVerified
                    ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    : "bg-[#3a1292] text-white hover:bg-[#2e0e74] shadow-sm"
                }`}
              >
                {actionLoading === c.id ? "..." : c.isVerified ? "Revoke" : "Verify"}
              </button>
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="px-6 py-12 text-center text-[13px] text-gray-400">No companies found.</div>
          )}
        </div>
      </div>

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
    </AdminLayout>
  );
}
