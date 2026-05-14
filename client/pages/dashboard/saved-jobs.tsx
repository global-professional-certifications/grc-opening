import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { apiFetch } from '../../lib/api';
import Link from 'next/link';
import { JobDetailDialog, type SupportedCurrency } from '../../modules/dashboard/jobs/JobDetailDialog';
import { EmployerProfileModal, type EmployerForModal } from '../../modules/dashboard/EmployerProfileModal';

// Matches the DiscoveryJob shape returned by GET /jobs/saved
interface SavedJob {
  id: string;
  title: string;
  companyName: string;
  companyLogoText: string;
  category: string;
  workMode: string; // "Remote" | "Hybrid" | "On-site"
  jobType: string;
  seniority: string;
  experienceLevel: string;
  postedAtLabel: string;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  undisclosedSalary: boolean;
  location: string;
  deadline: string | null;
  applicationWindowLabel: string;
  description: string;
  responsibilities: string;
  qualifications: string;
  niceToHave: string;
  verified: boolean;
  isSaved: boolean;
  isApplied: boolean;
  applicationId: string | null;
  tags: string[];
}

type EmployerPayload = {
  companyName?: string | null;
  industry?: string | null;
  companySize?: string | null;
  description?: string | null;
  tagline?: string | null;
  foundedYear?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
};

type JobDetailWithEmployerResponse = {
  job?: {
    employer?: EmployerPayload | null;
  } | null;
};

function normalizeOptionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function toEmployerForModal(employer: EmployerPayload | null | undefined, fallbackName: string): EmployerForModal {
  return {
    companyName: normalizeOptionalText(employer?.companyName) ?? fallbackName,
    industry: normalizeOptionalText(employer?.industry),
    companySize: normalizeOptionalText(employer?.companySize),
    description: normalizeOptionalText(employer?.description),
    tagline: normalizeOptionalText(employer?.tagline),
    foundedYear: normalizeOptionalText(employer?.foundedYear),
    website: normalizeOptionalText(employer?.website),
    address: normalizeOptionalText(employer?.address),
    city: normalizeOptionalText(employer?.city),
    state: normalizeOptionalText(employer?.state),
    country: normalizeOptionalText(employer?.country),
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState<SavedJob | null>(null);
  const [selectedEmployer, setSelectedEmployer] = useState<EmployerForModal | null>(null);
  const [employerError, setEmployerError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<SupportedCurrency>('USD');

  const [search, setSearch] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 12;

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('grc_preferred_currency') as SupportedCurrency | null;
    if (stored) setCurrency(stored);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'grc_preferred_currency' && e.newValue) {
        setCurrency(e.newValue as SupportedCurrency);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const fetchSavedJobs = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ jobs: SavedJob[] }>('/jobs/saved');
      setJobs(data.jobs || []);
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to load saved jobs'));
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (jobId: string) => {
    setJobs(prev => prev.filter(j => j.id !== jobId));
    setSelectedJob(prev => (prev?.id === jobId ? null : prev));
    try {
      await apiFetch(`/jobs/${jobId}/save`, { method: 'DELETE' });
    } catch (e: unknown) {
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

  const handleOpenEmployerProfile = useCallback(async (job: Pick<SavedJob, 'id' | 'companyName'>) => {
    setEmployerError(null);
    try {
      const response = await apiFetch<JobDetailWithEmployerResponse>(`/jobs/${job.id}`);
      setSelectedEmployer(toEmployerForModal(response.job?.employer, job.companyName));
    } catch (e: unknown) {
      setEmployerError(e instanceof Error ? e.message : 'Failed to load employer details');
    }
  }, []);

  const handleApplyFromModal = useCallback(async (job: SavedJob) => {
    try {
      await apiFetch(`/jobs/${job.id}/apply`, { method: 'POST', body: JSON.stringify({ notes: '' }) });
      setJobs(prev => prev.map(j => (j.id === job.id ? { ...j, isApplied: true } : j)));
      setSelectedJob(prev => (prev && prev.id === job.id ? { ...prev, isApplied: true } : prev));
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to apply for this job'));
    }
  }, []);

  const handleWithdrawFromModal = useCallback(async (job: SavedJob) => {
    try {
      await apiFetch(`/jobs/${job.id}/withdraw`, { method: 'PATCH' });
      setJobs(prev => prev.map(j => (j.id === job.id ? { ...j, isApplied: false } : j)));
      setSelectedJob(prev => (prev && prev.id === job.id ? { ...prev, isApplied: false } : prev));
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to withdraw application'));
    }
  }, []);

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

        {employerError && (
          <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm flex items-center justify-between">
            Could not load employer details - {employerError}
            <button onClick={() => setEmployerError(null)} className="font-bold">x</button>
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
                <div
                  key={job.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedJob(job)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedJob(job);
                    }
                  }}
                  className="group relative flex flex-col rounded-2xl transition-all shadow-sm hover:-translate-y-0.5 hover:shadow-lg overflow-hidden cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--db-primary)]"
                  style={{ background: 'var(--db-card)', border: '1px solid var(--db-border)' }}
                >

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
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleOpenEmployerProfile(job);
                        }}
                        className="text-[11px] font-bold uppercase tracking-wider mb-1 truncate transition-opacity hover:opacity-80 focus:outline-none"
                        style={{ color: 'var(--db-primary)' }}
                        aria-label={`View ${job.companyName} profile`}
                      >
                        {job.companyName}
                      </button>
                      <h3 className="text-[16px] font-bold leading-tight line-clamp-2" style={{ color: 'var(--db-text)' }} title={job.title}>
                        {job.title}
                      </h3>
                    </div>

                    {/* Unsave button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleUnsave(job.id);
                      }}
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
                      {!closed && !job.isApplied && (
                        <Link
                          href={`/dashboard/job/${job.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-4 py-2 rounded-lg font-bold text-[12px] transition-all shadow-sm hover:shadow-md hover:scale-[1.02]"
                          style={{ background: 'var(--db-primary)', color: 'var(--db-primary-text)' }}
                        >
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

        {selectedJob && (
          <JobDetailDialog
            job={selectedJob}
            selectedCurrency={currency}
            isApplied={selectedJob.isApplied}
            onClose={() => setSelectedJob(null)}
            onRequestApply={() => { void handleApplyFromModal(selectedJob); }}
            onWithdraw={() => { void handleWithdrawFromModal(selectedJob); }}
            onToggleSave={() => {
              void handleUnsave(selectedJob.id);
              setSelectedJob(null);
            }}
          />
        )}
        {selectedEmployer && (
          <EmployerProfileModal employer={selectedEmployer} onClose={() => setSelectedEmployer(null)} />
        )}

      </div>
    </DashboardLayout>
  );
}

