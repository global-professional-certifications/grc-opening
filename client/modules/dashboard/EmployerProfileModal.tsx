import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const POPPINS = { fontFamily: "'Poppins', sans-serif" };
const MONO    = { fontFamily: "'JetBrains Mono', monospace" };
const PRIMARY = 'var(--db-primary)';

export interface EmployerForModal {
  companyName: string;
  industry:    string | null;
  companySize: string | null;
  description: string | null;
  tagline:     string | null;
  foundedYear: string | null;
  website:     string | null;
  address:     string | null;
  city:        string | null;
  state:       string | null;
  country:     string | null;
  otherUrl:    string | null;
}

interface Props {
  employer: EmployerForModal;
  onClose:  () => void;
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'var(--db-primary-10)', border: '1px solid var(--db-primary-20)' }}
      >
        <span className="material-symbols-outlined text-[16px]" style={{ color: PRIMARY }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--db-text-muted)', ...MONO }}>
          {label}
        </p>
        <p className="text-[13px] font-semibold break-words" style={{ color: 'var(--db-text)', ...POPPINS }}>
          {value}
        </p>
      </div>
    </div>
  );
}

export function EmployerProfileModal({ employer, onClose }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 200);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const initials = employer.companyName
    .split(/\s+/)
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const locationParts = [employer.city, employer.state, employer.country].filter(Boolean);
  const locationStr   = locationParts.join(', ');
  const addressStr    = [employer.address, locationStr].filter(Boolean).join(' · ');

  const details: Array<{ icon: string; label: string; value: string }> = [
    employer.industry    && { icon: 'category',     label: 'Industry',      value: employer.industry },
    employer.companySize && { icon: 'group',         label: 'Company Size',  value: employer.companySize },
    employer.foundedYear && { icon: 'calendar_month', label: 'Founded',      value: employer.foundedYear },
    addressStr           && { icon: 'location_on',   label: 'Location',      value: addressStr },
  ].filter(Boolean) as Array<{ icon: string; label: string; value: string }>;

  const overlay = (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6"
      style={{
        background:            visible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)',
        backdropFilter:        visible ? 'blur(12px)' : 'blur(0px)',
        WebkitBackdropFilter:  visible ? 'blur(12px)' : 'blur(0px)',
        transition:            'background 0.2s ease, backdrop-filter 0.2s ease',
      }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-[28px] overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          background:  'var(--db-card)',
          border:      '1px solid var(--db-border)',
          boxShadow:   '0 40px 80px rgba(0,0,0,0.3)',
          transform:   visible ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.97)',
          opacity:     visible ? 1 : 0,
          transition:  'transform 0.24s cubic-bezier(0.34,1.36,0.64,1), opacity 0.18s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ────────────────────────────────────────────── */}
        <div
          className="relative px-7 pt-7 pb-6"
          style={{ background: 'linear-gradient(135deg, var(--db-primary-10) 0%, transparent 60%)' }}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-black/8 dark:hover:bg-white/8"
            style={{ color: 'var(--db-text-muted)', border: '1px solid var(--db-border)' }}
            aria-label="Close"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>close</span>
          </button>

          <div className="flex items-center gap-5">
            {/* Logo avatar */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-xl font-bold shadow-sm"
              style={{
                background: 'linear-gradient(135deg, var(--db-primary-10) 0%, var(--db-primary-20, rgba(99,102,241,0.2)) 100%)',
                border:     '2px solid var(--db-primary-20)',
                color:      PRIMARY,
                ...POPPINS,
              }}
            >
              {initials}
            </div>

            <div className="min-w-0 flex-1 pr-10">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[1.18rem] font-bold leading-tight truncate" style={{ color: 'var(--db-text)', ...POPPINS }}>
                  {employer.companyName}
                </h2>
                <span
                  className="material-symbols-outlined shrink-0"
                  style={{ fontSize: 18, color: PRIMARY, fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
              </div>
              {employer.tagline && (
                <p className="text-[13px] mt-1 leading-snug" style={{ color: 'var(--db-text-secondary)', ...POPPINS }}>
                  {employer.tagline}
                </p>
              )}
              {employer.industry && !employer.tagline && (
                <p className="text-[12px] mt-1 font-medium" style={{ color: 'var(--db-primary)', ...MONO }}>
                  {employer.industry}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--db-border)', flexShrink: 0 }} />

        {/* ── Scrollable body ───────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-7 py-6 space-y-6">

          {/* About */}
          {employer.description && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: PRIMARY, ...MONO }}>
                About
              </p>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--db-text-secondary)', ...POPPINS }}>
                {employer.description}
              </p>
            </div>
          )}

          {/* Details grid */}
          {details.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: PRIMARY, ...MONO }}>
                Company Overview
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {details.map(d => (
                  <DetailRow key={d.label} icon={d.icon} label={d.label} value={d.value} />
                ))}
              </div>
            </div>
          )}

          {/* Website & Links */}
          {(employer.website || employer.otherUrl) && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: PRIMARY, ...MONO }}>
                Links
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {employer.website && (
                  <a
                    href={employer.website.startsWith('http') ? employer.website : `https://${employer.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[13px] font-semibold transition-opacity hover:opacity-70"
                    style={{ color: PRIMARY }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>open_in_new</span>
                    {employer.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {employer.otherUrl && (
                  <a
                    href={employer.otherUrl.startsWith('http') ? employer.otherUrl : `https://${employer.otherUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[13px] font-semibold transition-opacity hover:opacity-70"
                    style={{ color: PRIMARY }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>link</span>
                    {employer.otherUrl.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!employer.description && details.length === 0 && !employer.website && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="material-symbols-outlined text-5xl mb-3" style={{ color: 'var(--db-text-muted)', opacity: 0.3 }}>
                business
              </span>
              <p className="text-[13px]" style={{ color: 'var(--db-text-muted)' }}>
                No additional company details available.
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────── */}
        <div
          className="px-7 py-4 flex justify-end"
          style={{ borderTop: '1px solid var(--db-border)', background: 'var(--db-bg)' }}
        >
          <button
            onClick={handleClose}
            className="px-6 py-2.5 rounded-full text-[13px] font-bold border transition-all hover:scale-105 active:scale-95"
            style={{ borderColor: 'var(--db-border)', color: 'var(--db-text)', background: 'transparent' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
