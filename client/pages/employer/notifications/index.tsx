import { useState, useEffect } from 'react';
import { EmployerDashboardLayout } from '../../../components/layout/EmployerDashboardLayout';
import { apiFetch } from '../../../lib/api';
import { useRouter } from 'next/router';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

interface FeedbackModalState {
  title: string;
  feedback: string;
}

export default function EmployerNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalState | null>(null);

  useEffect(() => {
    if (!feedbackModal) return;
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setFeedbackModal(null); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [feedbackModal]);
  
  // Filtering & Pagination
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ADMIN, APPLICATIONS
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const LIMIT = 20;
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, [page, activeTab]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      let url = `/notifications?page=${page}&limit=${LIMIT}`;
      
      if (['ADMIN', 'APPLICATIONS'].includes(activeTab)) {
        url = `/notifications?limit=100`;
      }

      const data = await apiFetch<{ notifications: Notification[], total: number, unreadCount: number }>(url);
      
      let filtered = data.notifications || [];
      if (activeTab === 'APPLICATIONS') {
        filtered = filtered.filter(n => n.type === 'NEW_APPLICATION');
      } else if (activeTab === 'ADMIN') {
        filtered = filtered.filter(n => ['ACCOUNT_SUSPENDED', 'ACCOUNT_BANNED', 'ACCOUNT_REINSTATED', 'COMPANY_VERIFIED', 'COMPANY_VERIFICATION_REVOKED', 'JOB_FORCE_CLOSED'].includes(n.type));
      }
      
      if (['ADMIN', 'APPLICATIONS'].includes(activeTab)) {
        setTotal(filtered.length);
        setNotifications(filtered.slice((page - 1) * LIMIT, page * LIMIT));
      } else {
        setNotifications(filtered);
        setTotal(data.total || 0);
      }
      
      setUnreadCount(data.unreadCount || 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Failed to mark all as read:', e);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await apiFetch(`/notifications/${notification.id}/read`, { method: 'PATCH' });
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (e) {
        console.error('Failed to mark as read:', e);
      }
    }

    if (notification.type === 'NEW_APPLICATION' && notification.metadata?.jobId) {
      router.push(`/employer/applicants?jobId=${notification.metadata.jobId}`);
    } else if (notification.type === 'JOB_FORCE_CLOSED') {
      router.push('/employer/jobs');
    }
  };

  const timeAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'NEW_APPLICATION': return 'person_add';
      case 'JOB_FORCE_CLOSED': return 'gavel';
      case 'ACCOUNT_SUSPENDED': return 'block';
      case 'ACCOUNT_BANNED': return 'no_accounts';
      case 'ACCOUNT_REINSTATED': return 'verified_user';
      case 'COMPANY_VERIFIED': return 'verified';
      case 'COMPANY_VERIFICATION_REVOKED': return 'warning';
      default: return 'notifications';
    }
  };

  const getColorClassForType = (type: string) => {
    if (type === 'NEW_APPLICATION') return 'border-blue-500 text-blue-500';
    if (type === 'JOB_FORCE_CLOSED') return 'border-amber-500 text-amber-500';
    if (type === 'COMPANY_VERIFIED') return 'border-emerald-500 text-emerald-500';
    if (type.startsWith('ACCOUNT_') || type.includes('REVOKED')) return 'border-red-500 text-red-500';
    return 'border-gray-500 text-gray-500';
  };

  const extractAdminFeedback = (notification: Notification): string => {
    const reasonFromMetadata = typeof notification.metadata?.adminReason === 'string'
      ? notification.metadata.adminReason.trim()
      : '';
    if (reasonFromMetadata) return reasonFromMetadata;
    const reasonMatch = /Reason:\s*(.+)$/i.exec(notification.message);
    return reasonMatch?.[1]?.trim() || '';
  };

  const tabs = [
    { id: 'ALL', label: 'All Notifications' },
    { id: 'APPLICATIONS', label: 'New Applications' },
    { id: 'ADMIN', label: 'Admin Alerts' },
  ];

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <EmployerDashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: "var(--db-text)" }}>
              Notifications
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[11px] px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} New
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm font-medium" style={{ color: "var(--db-text-muted)" }}>
              Stay updated on your job listings and platform alerts.
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm font-bold px-5 py-2 rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-[1.02]"
              style={{ background: "var(--db-primary)", color: "var(--db-primary-text)" }}
            >
              Mark all as read
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm flex items-center justify-between">
            {error}
            <button onClick={() => setError('')} className="font-bold">✕</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide gap-2 p-1 rounded-xl" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1); }}
              className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition-all ${activeTab === tab.id ? 'shadow-sm' : 'opacity-60 hover:opacity-100'}`}
              style={{
                background: activeTab === tab.id ? "var(--db-bg)" : "transparent",
                color: activeTab === tab.id ? "var(--db-text)" : "var(--db-text-muted)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="rounded-2xl overflow-hidden shadow-sm border" style={{ background: "var(--db-card)", borderColor: "var(--db-border)" }}>
          {loading ? (
            <div className="divide-y" style={{ borderColor: "var(--db-border)" }}>
              {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className="p-6 flex gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="flex-1 space-y-3 pt-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="material-symbols-outlined text-6xl mb-4" style={{ color: "var(--db-text-muted)", opacity: 0.3 }}>notifications_off</span>
              <h3 className="text-lg font-bold" style={{ color: "var(--db-text)" }}>No notifications</h3>
              <p className="mt-2 text-sm" style={{ color: "var(--db-text-muted)" }}>
                You don't have any notifications here yet.
              </p>
            </div>
          ) : (
            <div className="divide-y transition-all" style={{ borderColor: "var(--db-border)" }}>
              {notifications.map(n => {
                const colorClass = getColorClassForType(n.type);
                const isClickable = n.type === 'NEW_APPLICATION' || n.type === 'JOB_FORCE_CLOSED';
                const adminFeedback = extractAdminFeedback(n);
                const canShowAdminFeedback = !!adminFeedback && n.type !== 'NEW_APPLICATION';

                return (
                  <div
                    key={n.id}
                    onClick={() => isClickable ? handleNotificationClick(n) : undefined}
                    className={`relative p-5 sm:p-6 flex gap-4 sm:gap-5 transition-colors ${!n.isRead ? 'bg-black/[0.02] dark:bg-white/[0.02]' : ''} ${isClickable ? 'cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04]' : ''}`}
                  >
                    {/* Left Accent border for unread */}
                    {!n.isRead && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: "var(--db-primary)" }} />
                    )}

                    {/* Icon */}
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center shrink-0 ${colorClass.replace('text-', 'bg-').replace('500', '50 dark:bg-transparent')}`}>
                      <span className="material-symbols-outlined text-[20px] sm:text-[24px]">
                        {getIconForType(n.type)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h4 className={`text-[14px] sm:text-[15px] truncate ${!n.isRead ? 'font-bold' : 'font-semibold'}`} style={{ color: "var(--db-text)" }}>
                          {n.title}
                        </h4>
                        {/* Right-side controls: feedback button + timestamp stacked */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="text-[11px] font-medium" style={{ color: "var(--db-text-muted)" }}>
                            {timeAgo(n.createdAt)}
                          </span>
                          {canShowAdminFeedback && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFeedbackModal({ title: n.title, feedback: adminFeedback });
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-amber-300 text-amber-600 bg-amber-50 transition-all hover:bg-amber-100 hover:shadow-sm whitespace-nowrap"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>speaker_notes</span>
                              Admin Feedback
                            </button>
                          )}
                        </div>
                      </div>
                      <p className={`text-[13px] leading-relaxed ${!n.isRead ? 'font-medium' : ''}`} style={{ color: "var(--db-text-secondary)" }}>
                        {n.message.replace(/Reason:\s*.+$/i, '').trim()}
                      </p>

                      {!n.isRead && !isClickable && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleNotificationClick(n); }}
                          className="mt-2 text-[11px] font-bold uppercase tracking-wider hover:underline"
                          style={{ color: "var(--db-primary)" }}
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm font-medium" style={{ color: "var(--db-text-muted)" }}>
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 rounded-xl border text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderColor: "var(--db-border)", color: "var(--db-text)" }}
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 rounded-xl border text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderColor: "var(--db-border)", color: "var(--db-text)" }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {feedbackModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            onClick={() => setFeedbackModal(null)}
          >
            <div
              className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
              style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
              onClick={e => e.stopPropagation()}
            >
              {/* Coloured top stripe */}
              <div className="h-1 w-full bg-amber-400" />

              {/* Header */}
              <div className="px-6 pt-5 pb-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}>
                  <span className="material-symbols-outlined text-[20px] text-amber-500">gavel</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-0.5">Admin Feedback</p>
                  <h3 className="text-[15px] font-bold leading-snug" style={{ color: "var(--db-text)" }}>
                    {feedbackModal.title}
                  </h3>
                </div>
                <button
                  onClick={() => setFeedbackModal(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 hover:bg-black/8 dark:hover:bg-white/8"
                  style={{ color: "var(--db-text-muted)" }}
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                </button>
              </div>

              {/* Divider */}
              <div className="mx-6" style={{ height: 1, background: "var(--db-border)" }} />

              {/* Body */}
              <div className="px-6 py-5">
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--db-text-secondary)", wordBreak: "break-word" }}>
                  {feedbackModal.feedback}
                </p>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 flex justify-end gap-3">
                <button
                  onClick={() => setFeedbackModal(null)}
                  className="px-5 py-2 rounded-xl text-[13px] font-bold border transition-all hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ borderColor: "var(--db-border)", color: "var(--db-text)" }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </EmployerDashboardLayout>
  );
}
