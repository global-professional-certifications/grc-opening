import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&family=Syne:wght@600;700&family=JetBrains+Mono:wght@400;500&display=swap" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />

        {/* ── Blocking script: runs before React hydrates, zero flicker ── */}
        {/* Reads localStorage; defaults to "light" if no preference stored. */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var t = localStorage.getItem('grc-dash-theme');
              if (t !== 'dark' && t !== 'light') t = 'light';
              document.documentElement.setAttribute('data-db-theme', t);
            } catch(e) {
              document.documentElement.setAttribute('data-db-theme', 'light');
            }
          })();
        `}} />

        <style dangerouslySetInnerHTML={{ __html: `
          .material-symbols-outlined{font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;font-style:normal;display:inline-block;line-height:1;text-transform:none;letter-spacing:normal;white-space:nowrap;direction:ltr}
          .scrollbar-hide::-webkit-scrollbar{display:none}
          .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}

          /* ── LIGHT THEME (new default) ─────────────────────────── */
          html[data-db-theme="light"], html:not([data-db-theme]) {
            --db-bg:             #F8FAFC;
            --db-surface:        #F1F5F9;
            --db-card:           #FFFFFF;
            --db-card-shadow:    0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04);
            --db-section-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 2px 6px rgba(0,0,0,0.04);
            --db-sidebar-bg:          #FFFFFF;
            --db-sidebar-border:      #E5E7EB;
            --db-sidebar-logo-text:   #111827;
            --db-sidebar-section:     #9CA3AF;
            --db-sidebar-nav-text:    #374151;
            --db-sidebar-nav-hover:   #F3F4F6;
            --db-sidebar-nav-hover-text: #111827;
            --db-sidebar-user-bg:     #F9FAFB;
            --db-sidebar-user-text:   #111827;
            --db-sidebar-user-sub:    #6B7280;
            --db-sidebar-progress:    #E5E7EB;
            --db-primary:        #00A896;
            --db-primary-10:     rgba(0,168,150,0.1);
            --db-primary-20:     rgba(0,168,150,0.18);
            --db-primary-40:     rgba(0,168,150,0.4);
            --db-primary-50:     rgba(0,168,150,0.5);
            --db-primary-text:   #ffffff;
            --db-text:           #111827;
            --db-text-secondary: #374151;
            --db-text-muted:     #6B7280;
            --db-border:         #E5E7EB;
            --db-table-hover:    #F9FAFB;
            --db-table-head:     #F3F4F6;
            --db-btn-sec:        #F3F4F6;
            --db-btn-sec-hover:  #E5E7EB;
            --db-ring-track:     #E5E7EB;
          }

          /* ── DARK THEME ────────────────────────────────────────── */
          html[data-db-theme="dark"] {
            --db-bg:             #080D1A;
            --db-surface:        #0F1628;
            --db-card:           #151E35;
            --db-card-shadow:    none;
            --db-section-shadow: none;
            --db-sidebar-bg:          #080D1A;
            --db-sidebar-border:      rgba(148,163,184,0.12);
            --db-sidebar-logo-text:   #ffffff;
            --db-sidebar-section:     #475569;
            --db-sidebar-nav-text:    #94a3b8;
            --db-sidebar-nav-hover:   #1e293b;
            --db-sidebar-nav-hover-text: #ffffff;
            --db-sidebar-user-bg:     rgba(15,22,40,0.3);
            --db-sidebar-user-text:   #ffffff;
            --db-sidebar-user-sub:    #64748b;
            --db-sidebar-progress:    #1e293b;
            --db-primary:        #00c7b3;
            --db-primary-10:     rgba(0,199,179,0.1);
            --db-primary-20:     rgba(0,199,179,0.2);
            --db-primary-40:     rgba(0,199,179,0.4);
            --db-primary-50:     rgba(0,199,179,0.5);
            --db-primary-text:   #080D1A;
            --db-text:           #f1f5f9;
            --db-text-secondary: #94a3b8;
            --db-text-muted:     #64748b;
            --db-border:         #1e293b;
            --db-table-hover:    rgba(15,22,40,0.3);
            --db-table-head:     rgba(15,22,40,0.5);
            --db-btn-sec:        #1e293b;
            --db-btn-sec-hover:  #334155;
            --db-ring-track:     #1e293b;
          }

          /* ── NAV ITEM ──────────────────────────────────────────── */
          .db-nav-item {
            display:flex;align-items:center;gap:12px;padding:10px 16px;
            border-radius:6px;color:var(--db-sidebar-nav-text);
            transition:background 0.15s ease,color 0.15s ease;text-decoration:none;
          }
          .db-nav-item:hover { background:var(--db-sidebar-nav-hover); color:var(--db-sidebar-nav-hover-text); }
          .db-nav-item.active { background:var(--db-primary-10); color:var(--db-primary); border-right:2px solid var(--db-primary); }

          /* ── CARD ELEVATION ────────────────────────────────────── */
          .db-card { background:var(--db-card); border:1px solid var(--db-border); border-radius:8px; box-shadow:var(--db-card-shadow); }

          /* ── TRANSITIONS (theme switching — excludes transform) ────── */
          html[data-db-theme] * { transition:background-color 0.2s ease,color 0.2s ease,border-color 0.2s ease; }

          /* ── CARD HOVER ─────────────────────────────────────────── */
          /* Upward lift + shadow grow + subtle primary border glow   */
          .db-card-hover {
            transition: transform 0.25s ease-out, box-shadow 0.25s ease-out, border-color 0.25s ease-out !important;
            will-change: transform;
          }
          .db-card-hover:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 28px rgba(0,0,0,0.10), 0 0 0 1px var(--db-primary-20) !important;
            border-color: var(--db-primary-20) !important;
          }
          /* Dark mode: slightly stronger shadow */
          html[data-db-theme="dark"] .db-card-hover:hover {
            box-shadow: 0 12px 32px rgba(0,0,0,0.35), 0 0 0 1px var(--db-primary-20) !important;
          }

          /* ── PRIMARY BUTTON ─────────────────────────────────────── */
          .db-btn-primary {
            transition: transform 0.15s ease-out, box-shadow 0.15s ease-out, filter 0.15s ease-out !important;
            will-change: transform;
          }
          .db-btn-primary:hover {
            transform: scale(1.04);
            box-shadow: 0 4px 16px var(--db-primary-40) !important;
            filter: brightness(1.06);
          }
          .db-btn-primary:active {
            transform: scale(0.97) !important;
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
