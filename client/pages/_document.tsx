import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" data-db-theme="light">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />
 
        <style dangerouslySetInnerHTML={{ __html: `
          .material-symbols-outlined{font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;font-style:normal;display:inline-block;line-height:1;text-transform:none;letter-spacing:normal;white-space:nowrap;direction:ltr}
          .scrollbar-hide::-webkit-scrollbar{display:none}
          .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
          body { font-family: 'Poppins', sans-serif; }
 
          /* ── THEME VARIABLES (Locked to Light) ─────────────────── */
          :root {
            --db-bg:             #F8FAFC;
            --db-surface:        #ffffff;
            --db-dialog-bg:      var(--db-surface);
            --db-card:           #ffffff;
            --db-card-shadow:    0 4px 20px rgba(58, 18, 146, 0.05), inset 0 0 0 1px rgba(255,255,255,0.4);
            --db-section-shadow: 0 4px 12px rgba(58, 18, 146, 0.04);
            --db-sidebar-bg:          #ffffff;
            --db-sidebar-border:      rgba(58, 18, 146, 0.08);
            --db-sidebar-logo-text:   #111827;
            --db-sidebar-section:     #9CA3AF;
            --db-sidebar-nav-text:    #374151;
            --db-sidebar-nav-hover:   rgba(58, 18, 146, 0.04);
            --db-sidebar-nav-hover-text: #111827;
            --db-sidebar-user-bg:     #f9fafb;
            --db-sidebar-user-text:   #111827;
            --db-sidebar-user-sub:    #6B7280;
            --db-sidebar-progress:    #E5E7EB;
            --db-primary:             #3a1292;
            --db-primary-10:          rgba(58, 18, 146, 0.1);
            --db-primary-20:          rgba(58, 18, 146, 0.2);
            --db-primary-40:          rgba(58, 18, 146, 0.4);
            --db-primary-50:          rgba(58, 18, 146, 0.5);
            --db-primary-text:        #ffffff;
            --db-text:                #111827;
            --db-text-secondary:      #374151;
            --db-text-muted:          #6B7280;
            --db-border:              rgba(58, 18, 146, 0.08);
            --db-table-hover:         rgba(58, 18, 146, 0.02);
            --db-table-head:          rgba(58, 18, 146, 0.04);
            --db-btn-sec:             #F3F4F6;
            --db-btn-sec-hover:       #E5E7EB;
            --db-ring-track:          #E5E7EB;
          }
 
          /* ── NAV ITEM ──────────────────────────────────────────── */
          .db-nav-item {
            display:flex;align-items:center;gap:12px;padding:14px 16px;
            border-radius:12px;color:var(--db-sidebar-nav-text);
            border:1px solid transparent;
            transition:background 0.15s ease,color 0.15s ease,border-color 0.15s ease,box-shadow 0.15s ease;text-decoration:none;
          }
          .db-nav-item:hover { background:var(--db-sidebar-nav-hover); color:var(--db-sidebar-nav-hover-text); }
          .db-nav-item.active {
            background: linear-gradient(90deg, rgba(0,168,150,0.12) 0%, rgba(0,168,150,0.05) 100%);
            color: var(--db-primary);
            border-color: rgba(0,168,150,0.34);
            box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
          }
 
          /* ── CARD ELEVATION ────────────────────────────────────── */
          .db-card { background:var(--db-card); border:1px solid var(--db-border); border-radius:12px; box-shadow:var(--db-card-shadow); }
 
          /* ── CARD HOVER ─────────────────────────────────────────── */
          .db-card-hover {
            transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.3s ease !important;
            will-change: transform;
          }
          .db-card-hover:hover {
            transform: translateY(-6px);
            box-shadow: 0 20px 40px rgba(58, 18, 146, 0.12), 0 0 0 1px var(--db-primary-20) !important;
            border-color: var(--db-primary-20) !important;
          }
 
          /* ── PRIMARY BUTTON ─────────────────────────────────────── */
          .db-btn-primary {
            transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s ease, filter 0.2s ease !important;
            will-change: transform;
          }
          .db-btn-primary:hover {
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 8px 24px var(--db-primary-40) !important;
            filter: brightness(1.1);
          }
          .db-btn-primary:active {
            transform: scale(0.98) !important;
            box-shadow: none !important;
          }
 
          /* ── SECONDARY BUTTON ───────────────────────────────────── */
          .db-btn-secondary {
            transition: background-color 0.15s ease-out, border-color 0.15s ease-out, transform 0.15s ease-out !important;
          }
          .db-btn-secondary:hover {
            background: var(--db-btn-sec-hover) !important;
            transform: scale(1.02);
          }
          .db-btn-secondary:active { transform: scale(0.98) !important; }
        `}} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
