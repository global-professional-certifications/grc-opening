import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { apiFetch } from '../../lib/api';
import Link from 'next/link';

// Matches the DiscoveryJob shape returned by GET /jobs/saved
interface SavedJob {
  id: string;
  title: string;
  companyName: string;
  workMode: string; // "Remote" | "Hybrid" | "On-site"
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  undisclosedSalary: boolean;
  location: string;
  deadline: string | null;
  isSaved: boolean;
  isApplied: boolean;
  applicationId: string | null;
  tags: string[];
}

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 12;

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ jobs: SavedJob[] }>('/jobs/saved');
      setJobs(data.jobs || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load saved jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (jobId: string) => {
    setJobs(prev => prev.filter(j => j.id !== jobId));
    try {
      await apiFetch(`/jobs/${jobId}/save`, { method: 'DELETE' });
    } catch (e: any) {
      console.error('Failed to unsave job:', e);
      fetchSavedJobs();
    }
  };

  const isJobClosed = (job: SavedJob): boolean => {
    if (!job.deadline) return false;
    return new Date(job.deadline).getTime() < Date.now();
  };

  const formatSalary = (job: SavedJob): string => {
    if (job.undisclosedSalary) return 'Competitive';
    if (!job.salaryMin && !job.salaryMax) return 'Competitive';
    const fmt = (v: number) =>
      new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(v);
    if (job.salaryMin && job.salaryMax)
      return `${job.salaryCurrency} ${fmt(job.salaryMin)} – ${fmt(job.salaryMax)}`;
    if (job.salaryMin) return `${job.salaryCurrency} ${fmt(job.salaryMin)}+`;
    return `Up to ${job.salaryCurrency} ${fmt(job.salaryMax)}`;
  };

  // Normalize workMode for filter comparison: "Remote" → "REMOTE" etc.
  const normalizeMode = (mode: string) => mode.toUpperCase().replace('-', '_').replace(' ', '_');

  const filteredJobs = jobs.filter(j => {
    const term = search.toLowerCase();
    const matchSearch = j.title.toLowerCase().includes(term) || j.companyName.toLowerCase().includes(term);
    const matchMode = workModeFilter ? normalizeMode(j.workMode) === workModeFilter : true;
    return matchSearch && matchMode;
  });

  const totalPages = Math.ceil(filteredJobs.length / LIMIT);
  const displayedJobs = filteredJobs.slice((page - 1) * LIMIT, page * LIMIT);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--db-text)' }}>Saved Jobs</h1>
            <p className="mt-1 text-sm font-medium" style={{ color: 'var(--db-text-muted)' }}>
              Roles you have bookmarked for later.
            </p>
          </div>
          <div className="text-sm font-bold px-4 py-2 rounded-full" style={{ background: 'var(--db-card)', color: 'var(--db-text)', border: '1px solid var(--db-border)' }}>
            {jobs.length} Total Saved
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm flex items-center justify-between">
            {error}
            <button onClick={() => setError('')} className="font-bold">✕</button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input
              type="text"
              placeholder="Search by job title or company..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none transition-all shadow-sm"
              style={{ background: 'var(--db-card)', borderColor: 'var(--db-border)', color: 'var(--db-text)' }}
            />
          </div>
          <select
            value={workModeFilter}
            onChange={(e) => { setWorkModeFilter(e.target.value); setPage(1); }}
            className="w-full sm:w-48 px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none shadow-sm cursor-pointer"
            style={{ background: 'var(--db-card)', borderColor: 'var(--db-border)', color: 'var(--db-text)' }}
          >
            <option value="">All Work Modes</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ON_SITE">On-Site</option>
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="h-64 rounded-2xl animate-pulse" style={{ background: 'var(--db-card)', border: '1px solid var(--db-border)' }} />
            ))}
          </div>
        )}

        {/* Empty — no saved jobs */}
        {!loading && jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed" style={{ borderColor: 'var(--db-border)', background: 'var(--db-card)' }}>
            <span className="material-symbols-outlined text-6xl mb-4" style={{ color: 'var(--db-text-muted)', opacity: 0.5 }}>bookmark_border</span>
            <h3 className="text-lg font-bold" style={{ color: 'var(--db-text)' }}>No saved jobs yet</h3>
            <p className="mt-2 text-sm max-w-sm mb-6" style={{ color: 'var(--db-text-muted)' }}>
              Keep track of roles you're interested in by clicking the bookmark icon on any job posting.
            </p>
            <Link href="/dashboard/jobs" className="px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all hover:scale-105" style={{ background: 'var(--db-primary)', color: 'var(--db-primary-text)' }}>
              Browse Jobs
            </Link>
          </div>
        )}

        {/* Empty — filtered */}
        {!loading && jobs.length > 0 && filteredJobs.length === 0 && (
          <div className="text-center py-12 rounded-2xl" style={{ border: '1px solid var(--db-border)', background: 'var(--db-card)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--db-text-muted)' }}>No saved jobs match your search.</p>
            <button onClick={() => { setSearch(''); setWorkModeFilter(''); }} className="mt-4 text-sm font-bold" style={{ color: 'var(--db-primary)' }}>Clear Filters</button>
          </div>
        )}

        {/* Grid */}
        {!loading && displayedJobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedJobs.map((job) => {
              const closed = isJobClosed(job);

              return (
                <div key={job.id} className="group relative flex flex-col rounded-2xl transition-all shadow-sm hover:shadow-lg overflow-hidden" style={{ background: 'var(--db-card)', border: '1px solid var(--db-border)' }}>

                  {/* Closed Banner */}
                  {closed && (
                    <div className="absolute top-4 left-4 z-10 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      Closed
                    </div>
                  )}

                  {/* Applied Banner */}
                  {job.isApplied && !closed && (
                    <div className="absolute top-4 left-4 z-10 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Applied
                    </div>
                  )}

                  {/* Header */}
                  <div className="p-6 pb-5 flex gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner" style={{ background: 'var(--db-bg)' }}>
                      <span className="material-symbols-outlined text-2xl" style={{ color: 'var(--db-primary)' }}>corporate_fare</span>
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider mb-1 truncate" style={{ color: 'var(--db-primary)' }}>{job.companyName}</p>
                      <h3 className="text-[16px] font-bold leading-tight line-clamp-2" style={{ color: 'var(--db-text)' }} title={job.title}>
                        {job.title}
                      </h3>
                    </div>

                    {/* Unsave button */}
                    <button
                      onClick={() => handleUnsave(job.id)}
                      className="absolute top-4 right-4 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 text-red-500"
                      title="Remove from saved"
                    >
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                    </button>
                    <div className="absolute top-5 right-5 sm:hidden opacity-100 pointer-events-none">
                      <span className="material-symbols-outlined text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="px-6 flex flex-wrap gap-2 mb-6">
                    <span className="px-2.5 py-1 rounded-md border text-[11px] font-semibold flex items-center gap-1.5" style={{ borderColor: 'var(--db-border)', color: 'var(--db-text-muted)' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--db-primary)' }} />
                      {job.workMode}
                    </span>
                    {job.location && (
                      <span className="px-2.5 py-1 rounded-md border text-[11px] font-semibold flex items-center gap-1.5" style={{ borderColor: 'var(--db-border)', color: 'var(--db-text-muted)' }}>
                        <span className="material-symbols-outlined text-[13px]">location_on</span>
                        <span className="truncate max-w-[100px]">{job.location}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex-1" />

                  {/* Footer */}
                  <div className="p-4 px-6 border-t flex items-center justify-between" style={{ borderColor: 'var(--db-border)', background: 'rgba(0,0,0,0.02)' }}>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest mb-0.5" style={{ color: 'var(--db-text-muted)' }}>Salary</p>
                      <p className="text-[13px] font-bold" style={{ color: 'var(--db-text)' }}>
                        {formatSalary(job)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/job/${job.id}`} className="p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ color: 'var(--db-text-secondary)' }}>
                        <span className="material-symbols-outlined text-[20px] block">visibility</span>
                      </Link>
                      {!closed && !job.isApplied && (
                        <Link href={`/dashboard/job/${job.id}`} className="px-4 py-2 rounded-lg font-bold text-[12px] transition-all shadow-sm hover:shadow-md hover:scale-[1.02]" style={{ background: 'var(--db-primary)', color: 'var(--db-primary-text)' }}>
                          Apply Now
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 border-t mt-8" style={{ borderColor: 'var(--db-border)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--db-text-muted)' }}>
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 rounded-xl border text-sm font-bold disabled:opacity-40 transition-all hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderColor: 'var(--db-border)', color: 'var(--db-text)' }}
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 rounded-xl border text-sm font-bold disabled:opacity-40 transition-all hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderColor: 'var(--db-border)', color: 'var(--db-text)' }}
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
