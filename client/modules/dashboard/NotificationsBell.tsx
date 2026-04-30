import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { apiFetch } from '../../lib/api';
import { useUser } from '../../contexts/UserContext';

export function NotificationsBell() {
  const router = useRouter();
  const { user } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('grc_token');
    if (!token) return;

    apiFetch<{ unreadCount: number }>('/notifications?limit=1')
      .then((res) => {
        setUnreadCount(res.unreadCount || 0);
      })
      .catch(console.error);
  }, []);

  const notificationsPath = user?.role === 'EMPLOYER'
    ? '/employer/notifications'
    : '/dashboard/notifications';

  return (
    <button
      onClick={() => router.push(notificationsPath)}
      className="relative w-10 h-10 flex items-center justify-center rounded-full border transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'var(--db-border)',
        color: 'var(--db-text-secondary)',
      }}
      aria-label="Notifications"
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: 20,
          fontVariationSettings: unreadCount > 0 ? "'FILL' 1" : "'FILL' 0",
        }}
      >
        notifications
      </span>

      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
      )}
    </button>
  );
}
