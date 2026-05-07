/**
 * One-time script to parse the GRC master JD CSV and emit a TypeScript library.
 * Run:  node scratch/parse-jd-csv.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = join(__dirname, '..', 'public', 'GRC Openings Master Data(Jobs).csv');
const outPath = join(__dirname, '..', 'lib', 'jdTemplates.ts');

// Read as latin1 to preserve Windows-1252 bytes, then fix smart quotes
let raw = readFileSync(csvPath, 'latin1');
// Windows-1252 0x92 = right single quote → ASCII apostrophe
raw = raw.replace(/\x92/g, "'");
// Windows-1252 0x93/0x94 = smart double quotes → ASCII double quotes
raw = raw.replace(/[\x93\x94]/g, '"');
// Windows-1252 0x96 = en-dash → ASCII dash
raw = raw.replace(/\x96/g, '-');
// Windows-1252 0x97 = em-dash → ASCII dash
raw = raw.replace(/\x97/g, '-');

// The CSV uses quoted multi-line fields. We need a proper parser.
function parseCSV(text) {
  const records = [];
  let i = 0;
  const len = text.length;

  function readField() {
    if (i >= len) return '';
    if (text[i] === '"') {
      // Quoted field — read until closing quote (doubled quotes are escaped)
      i++; // skip opening quote
      let val = '';
      while (i < len) {
        if (text[i] === '"') {
          if (i + 1 < len && text[i + 1] === '"') {
            val += '"';
            i += 2;
          } else {
            i++; // skip closing quote
            break;
          }
        } else {
          val += text[i];
          i++;
        }
      }
      return val;
    } else {
      // Unquoted field — read until comma or newline
      let val = '';
      while (i < len && text[i] !== ',' && text[i] !== '\r' && text[i] !== '\n') {
        val += text[i];
        i++;
      }
      return val;
    }
  }

  while (i < len) {
    const row = [];
    for (let col = 0; col < 5; col++) {
      row.push(readField());
      // Skip comma separator
      if (i < len && text[i] === ',') i++;
    }
    // Skip line ending
    while (i < len && (text[i] === '\r' || text[i] === '\n')) i++;
    records.push(row);
  }
  return records;
}

const rows = parseCSV(raw);

// Map CSV experience levels to our seniority options
const LEVEL_MAP = {
  'Foundation (Entry-Level)': 'Entry',
  'Associate (Early Career)': 'Associate',
  'Specialist (Mid-Level)': 'Mid-Senior',
  'Lead (Senior IC)': 'Lead/Manager',
  'Principal (Expert / Strategic)': 'Director',
  'Executive (Leadership)': 'Executive',
};

// Build the template array
const templates = [];
let currentLevel = '';

for (const row of rows) {
  const [level, role, category, jd] = row;

  // Skip header rows
  if (level === 'JOBS' || level === 'Experience Level ' || level === 'Experience Level') continue;
  // Skip empty divider rows
  if (!role && !jd) {
    if (level && LEVEL_MAP[level.trim()]) {
      currentLevel = LEVEL_MAP[level.trim()];
    }
    continue;
  }

  // Update current level if present
  if (level && level.trim()) {
    const mapped = LEVEL_MAP[level.trim()];
    if (mapped) currentLevel = mapped;
  }

  if (!role || !jd) continue;

  templates.push({
    seniority: currentLevel,
    role: role.trim(),
    category: category.trim(),
    description: jd.trim().replace(/\r/g, ''),
  });
}

console.log(`Parsed ${templates.length} JD templates`);
templates.forEach(t => console.log(`  [${t.seniority}] ${t.role} (${t.category})`));

// Generate TypeScript
let ts = `// ── Auto-generated JD Template Library ─────────────────────────────────────────
// Source: GRC Openings Master Data(Jobs).csv
// Generated: ${new Date().toISOString().slice(0, 10)}
// Do NOT edit manually — regenerate from the CSV with scratch/parse-jd-csv.mjs

export interface JDTemplate {
  /** Seniority level (matches SENIORITY_OPTIONS values) */
  seniority: string;
  /** Job role / title */
  role: string;
  /** Category (e.g. Risk, Compliance, Audit) */
  category: string;
  /** Full job description text */
  description: string;
}

export const JD_TEMPLATES: JDTemplate[] = [\n`;

for (const t of templates) {
  ts += `  {\n`;
  ts += `    seniority: ${JSON.stringify(t.seniority)},\n`;
  ts += `    role: ${JSON.stringify(t.role)},\n`;
  ts += `    category: ${JSON.stringify(t.category)},\n`;
  ts += `    description: ${JSON.stringify(t.description)},\n`;
  ts += `  },\n`;
}

ts += `];\n\n`;

// Helper: get unique roles for a seniority level
ts += `/** Get all unique roles available for a given seniority level */
export function getRolesForSeniority(seniority: string): string[] {
  return [...new Set(JD_TEMPLATES.filter(t => t.seniority === seniority).map(t => t.role))];
}

/** Find a JD template by seniority + role */
export function findJDTemplate(seniority: string, role: string): JDTemplate | undefined {
  return JD_TEMPLATES.find(t => t.seniority === seniority && t.role === role);
}

/** Get all unique seniority levels that have templates */
export function getAvailableSeniorities(): string[] {
  return [...new Set(JD_TEMPLATES.map(t => t.seniority))];
}

// ── Section headers recognised in the CSV JD text ─────────────────────────────
const SECTION_HEADERS = new Set([
  'job summary',
  'key responsibilities',
  'required skills and qualifications',
  'education',
  'certifications',
  'responsibilities',
  'qualifications',
  'skills and qualifications',
  'required qualifications',
  'preferred qualifications',
  'nice to have',
]);

function isSectionHeader(line: string): boolean {
  return SECTION_HEADERS.has(line.trim().toLowerCase());
}

/**
 * Convert a plain-text JD template into well-formatted HTML for the
 * RichTextarea contentEditable editor.
 *
 * Layout produced:
 *   • Section headers → <p><b>HEADER</b></p>
 *   • Summary paragraph → <p>text</p>
 *   • List items (under "Key Responsibilities" etc.) → <ul><li>…</li></ul>
 *   • Education / certs single lines → <p>text</p>
 */
export function formatJDToHTML(text: string): string {
  const lines = text.split('\\n');
  const parts: string[] = [];
  let inList = false;
  let currentSection = '';

  // Sections whose items should render as bullet lists
  const LIST_SECTIONS = new Set([
    'key responsibilities',
    'required skills and qualifications',
    'responsibilities',
    'qualifications',
    'skills and qualifications',
    'required qualifications',
    'preferred qualifications',
    'nice to have',
  ]);

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // Skip empty lines (they're section separators in the CSV)
    if (!trimmed) {
      if (inList) {
        parts.push('</ul>');
        inList = false;
      }
      continue;
    }

    // Section header
    if (isSectionHeader(trimmed)) {
      if (inList) {
        parts.push('</ul>');
        inList = false;
      }
      currentSection = trimmed.toLowerCase();
      parts.push(\`<p><b>\${trimmed}</b></p>\`);
      continue;
    }

    // If we're inside a list-type section, render as bullet items
    if (LIST_SECTIONS.has(currentSection)) {
      if (!inList) {
        parts.push('<ul>');
        inList = true;
      }
      parts.push(\`<li>\${trimmed}</li>\`);
      continue;
    }

    // Everything else: regular paragraph
    parts.push(\`<p>\${trimmed}</p>\`);
  }

  if (inList) {
    parts.push('</ul>');
  }

  return parts.join('');
}
`;

writeFileSync(outPath, ts, 'utf-8');
console.log(`\nWritten to ${outPath}`);
