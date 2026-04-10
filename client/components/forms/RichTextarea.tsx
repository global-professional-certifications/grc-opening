/**
 * RichTextarea — contenteditable rich text editor with a working toolbar.
 *
 * API:
 *   value         — HTML string (controlled from parent state)
 *   onChangeValue — called with new HTML string on every change
 *
 * Toolbar commands use document.execCommand (deprecated spec but universally
 * supported in every shipping browser). No external deps needed.
 */

import { useRef, useEffect, useCallback, useState, Fragment } from 'react';

const MONO = { fontFamily: "'JetBrains Mono', monospace" };

// ─── Types ────────────────────────────────────────────────────────────────────

type ToolbarCmd =
  | 'bold'
  | 'italic'
  | 'insertUnorderedList'
  | 'insertOrderedList'
  | 'createLink'
  | 'insertImage';

const TOOLBAR: { icon: string; cmd: ToolbarCmd; title: string; sepBefore?: true }[] = [
  { icon: 'format_bold',          cmd: 'bold',                title: 'Bold (Ctrl+B)'   },
  { icon: 'format_italic',        cmd: 'italic',              title: 'Italic (Ctrl+I)' },
  { icon: 'format_list_bulleted', cmd: 'insertUnorderedList', title: 'Bullet list'     },
  { icon: 'format_list_numbered', cmd: 'insertOrderedList',   title: 'Numbered list'   },
  { icon: 'link',                 cmd: 'createLink',          title: 'Insert link',    sepBefore: true },
  { icon: 'image',                cmd: 'insertImage',         title: 'Insert image URL' },
];

export interface RichTextareaProps {
  label?:          string;
  error?:          string;
  value:           string;
  onChangeValue:   (html: string) => void;
  placeholder?:    string;
  /** Approximate visible rows (each row ≈ 26 px). Default 6. */
  minRows?:        number;
  className?:      string;
  disabled?:       boolean;
}

// ─── One-time CSS injection ───────────────────────────────────────────────────

const EDITOR_CSS = /* css */ `
  .grc-rte:empty::before {
    content: attr(data-placeholder);
    color: var(--db-text-muted, #637A8C);
    pointer-events: none;
    display: block;
  }
  .grc-rte b, .grc-rte strong { font-weight: 700 !important; }
  .grc-rte i, .grc-rte em     { font-style: italic !important; }
  .grc-rte u                  { text-decoration: underline; }
  .grc-rte ul { list-style-type: disc;    padding-left: 1.5em; margin: 4px 0; }
  .grc-rte ol { list-style-type: decimal; padding-left: 1.5em; margin: 4px 0; }
  .grc-rte li { margin: 2px 0; }
  .grc-rte a  { color: var(--db-primary, #04ffb4); text-decoration: underline; cursor: pointer; }
  .grc-rte img { max-width: 100%; border-radius: 6px; margin: 4px 0; display: block; }
  .grc-rte p, .grc-rte div { min-height: 1em; }
`;

// Wrap deprecated-but-universally-supported execCommand APIs so TypeScript
// doesn't surface the deprecation hint on every call site.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _doc = () => document as any;
const exec       = (cmd: string, val?: string) => _doc().execCommand(cmd, false, val ?? null);
const queryState = (cmd: string): boolean => { try { return _doc().queryCommandState(cmd); } catch { return false; } };

let _cssInjected = false;
function ensureEditorCSS() {
  if (typeof document === 'undefined' || _cssInjected) return;
  if (document.getElementById('grc-rte-styles')) { _cssInjected = true; return; }
  const s = document.createElement('style');
  s.id = 'grc-rte-styles';
  s.textContent = EDITOR_CSS;
  document.head.appendChild(s);
  _cssInjected = true;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RichTextarea({
  label,
  error,
  value,
  onChangeValue,
  placeholder = 'Start typing…',
  minRows    = 6,
  className  = '',
  disabled   = false,
}: RichTextareaProps) {
  const editorRef    = useRef<HTMLDivElement>(null);
  const onChangeRef  = useRef(onChangeValue);
  onChangeRef.current = onChangeValue;

  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  // ── CSS injection ──────────────────────────────────────────────────────────
  useEffect(() => { ensureEditorCSS(); }, []);

  // ── Seed initial HTML (mount only — never overwrite while user is typing) ──
  useEffect(() => {
    const el = editorRef.current;
    if (el) el.innerHTML = value || '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentional empty deps

  // ── Sync external value changes (e.g. draft restore) ──────────────────────
  useEffect(() => {
    const el = editorRef.current;
    if (!el || document.activeElement === el) return; // don't interrupt typing
    if (el.innerHTML !== value) el.innerHTML = value || '';
  }, [value]);

  // ── Track which format commands are active at current cursor position ──────
  const syncFormats = useCallback(() => {
    const active = new Set<string>();
    (['bold', 'italic', 'insertUnorderedList', 'insertOrderedList'] as const).forEach((cmd) => {
      if (queryState(cmd)) active.add(cmd);
    });
    setActiveFormats(active);
  }, []);

  // ── Emit current innerHTML to parent ──────────────────────────────────────
  const emit = useCallback(() => {
    const el = editorRef.current;
    if (el) onChangeRef.current(el.innerHTML);
  }, []);

  const handleInput = useCallback(() => { emit(); }, [emit]);

  // ── Paste: strip rich formatting, keep plain text with newlines ────────────
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const plain = e.clipboardData.getData('text/plain');
    if (!plain) return;
    // Split lines so pasted newlines become proper paragraphs
    const lines = plain.split('\n');
    lines.forEach((line, i) => {
      exec('insertText', line);
      if (i < lines.length - 1) exec('insertParagraph');
    });
    emit();
  }, [emit]);

  // ── Execute a toolbar command ──────────────────────────────────────────────
  const execCmd = useCallback((cmd: ToolbarCmd) => {
    if (disabled) return;
    const el = editorRef.current;
    if (!el) return;

    // Ensure editor is focused before issuing a command
    el.focus();

    switch (cmd) {
      case 'createLink': {
        const sel = window.getSelection()?.toString().trim();
        const url = window.prompt('Enter link URL (include https://):', 'https://');
        if (!url) return;
        if (sel) {
          exec('createLink', url);
        } else {
          // No selection — insert the URL itself as an anchor
          exec('insertHTML',
            `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
          );
        }
        break;
      }
      case 'insertImage': {
        const url = window.prompt('Enter image URL:', 'https://');
        if (!url) return;
        exec('insertImage', url);
        break;
      }
      default:
        exec(cmd);
    }

    syncFormats();
    // Let the DOM settle before reading innerHTML
    setTimeout(emit, 0);
  }, [disabled, syncFormats, emit]);

  const minHeight = `${minRows * 26}px`;

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {label && (
        <label
          className="text-sm font-bold tracking-wide uppercase mb-2"
          style={{ ...MONO, color: 'var(--db-text)' }}
        >
          {label}
        </label>
      )}

      {/* ── Outer shell ──────────────────────────────────────────────── */}
      <div
        className="border rounded-lg overflow-hidden transition-all focus-within:ring-1 focus-within:ring-[var(--db-primary)] focus-within:border-[var(--db-primary)]"
        style={{
          backgroundColor: 'var(--db-card)',
          borderColor: error ? '#ef4444' : 'var(--db-border)',
        }}
      >

        {/* ── Toolbar ──────────────────────────────────────────────────── */}
        <div
          className="flex items-center px-2 py-1.5 border-b gap-0.5 flex-wrap"
          style={{ borderColor: 'var(--db-border)', backgroundColor: 'rgba(0,0,0,0.1)' }}
        >
          {TOOLBAR.map(({ icon, cmd, title, sepBefore }) => {
            const isActive = activeFormats.has(cmd);
            return (
              <Fragment key={cmd}>
                {sepBefore && (
                  <span
                    aria-hidden
                    className="inline-block w-px h-4 mx-1 flex-shrink-0"
                    style={{ backgroundColor: 'var(--db-border)' }}
                  />
                )}
                <button
                  type="button"
                  title={title}
                  aria-label={title}
                  aria-pressed={isActive}
                  disabled={disabled}
                  onMouseDown={(e) => {
                    // Prevent editor losing focus when clicking toolbar button
                    e.preventDefault();
                    execCmd(cmd);
                  }}
                  className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded transition-all"
                  style={{
                    backgroundColor: isActive ? 'rgba(4,255,180,0.15)' : 'transparent',
                    color: isActive ? 'var(--db-primary)' : 'var(--db-text-secondary)',
                    opacity: disabled ? 0.4 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 17, lineHeight: '1' }}>
                    {icon}
                  </span>
                </button>
              </Fragment>
            );
          })}

          <span
            className="ml-auto text-[10px] tracking-widest select-none flex-shrink-0"
            style={{ ...MONO, color: 'var(--db-text-muted)' }}
          >
            RICH TEXT
          </span>
        </div>

        {/* ── Editable content area ──────────────────────────────────── */}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          data-placeholder={placeholder}
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyUp={syncFormats}
          onMouseUp={syncFormats}
          onSelect={syncFormats}
          className="grc-rte px-4 py-3 outline-none"
          style={{
            minHeight,
            color: 'var(--db-text)',
            fontSize: '14px',
            lineHeight: '1.65',
            overflowY: 'auto',
            wordBreak: 'break-word',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />
      </div>

      {/* ── Validation error ──────────────────────────────────────────── */}
      {error && (
        <span className="flex items-center gap-1 text-xs mt-1.5" style={{ color: '#f87171' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>error</span>
          {error}
        </span>
      )}
    </div>
  );
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/**
 * Strip HTML tags to get plain text for validation/character-counting.
 * Exported so step components can use it without duplicating the logic.
 */
export function extractText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?(p|div|li|ul|ol)[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
