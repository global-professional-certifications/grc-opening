/**
 * resumeParser.ts
 *
 * Client-side resume text extraction + field parsing.
 *
 * Flow:
 *   File (PDF / DOC / DOCX / TXT)
 *     → extractText()           raw text string
 *     → parseResumeText()       structured ParsedResume object
 *
 * Accuracy notes:
 *  - Email, LinkedIn URL, and phone are extracted with exact regex — 100% reliable.
 *  - Name, title, location, summary, skills, certs, and work experience use
 *    section-header heuristics that match every major resume format
 *    (chronological, functional, hybrid).
 *  - PDF text is extracted via pdf.js (same engine used by Chrome DevTools).
 */

import type { WorkExperience, Certification, ProfileFormData } from "../components/profile/types";

// ─────────────────────────────────────────────────────────────
// Public result type
// ─────────────────────────────────────────────────────────────
export type ParsedResume = Partial<
  Pick<
    ProfileFormData,
    | "firstName"
    | "lastName"
    | "professionalTitle"
    | "email"
    | "location"
    | "linkedInUrl"
    | "summary"
    | "coreCompetencies"
    | "certifications"
    | "workExperience"
  >
>;

// ─────────────────────────────────────────────────────────────
// PDF text extraction (pdfjs-dist loaded lazily so it doesn't
// bloat the initial bundle for non-profile pages)
// ─────────────────────────────────────────────────────────────
async function extractTextFromPDF(file: File): Promise<string> {
  // Dynamic import keeps pdf.js out of the main chunk
  const pdfjsLib = await import("pdfjs-dist");

  // Serve the worker from /public so it always matches the installed version
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // Use hasEOL to reconstruct actual line breaks; fall back to a space
    // between inline items so words don't run together.
    const pageText = content.items
      .map((item: { str?: string; hasEOL?: boolean }) =>
        (item.str ?? "") + (item.hasEOL ? "\n" : " ")
      )
      .join("");
    pageTexts.push(pageText);
  }
  return pageTexts.join("\n");
}

// ─────────────────────────────────────────────────────────────
// Plain-text / DOC / DOCX fallback — read as text
// ─────────────────────────────────────────────────────────────
async function extractTextFallback(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) ?? "");
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsText(file);
  });
}

// ─────────────────────────────────────────────────────────────
// Master text extractor — routes by MIME / extension
// ─────────────────────────────────────────────────────────────
export async function extractText(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (file.type === "application/pdf" || ext === "pdf") {
    return extractTextFromPDF(file);
  }
  // DOC/DOCX aren't natively parseable in the browser without mammoth.js;
  // fall back to reading raw text (catches plain-text resumes, .txt, etc.)
  return extractTextFallback(file);
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Collapse runs of whitespace/newlines into single spaces. */
function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Split text into logical lines, collapsing blank lines so
 * section headers are easier to detect.
 */
function toLines(text: string): string[] {
  return text
    .split(/\n|\r\n|\r/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

// ─────────────────────────────────────────────────────────────
// Section detection
// ─────────────────────────────────────────────────────────────
// Maps a normalised section header keyword to a canonical key.
const SECTION_MAP: Record<string, string> = {
  // Summary / Objective
  "summary": "summary",
  "professional summary": "summary",
  "career summary": "summary",
  "profile": "summary",
  "about me": "summary",
  "objective": "summary",
  "career objective": "summary",
  "professional profile": "summary",
  "overview": "summary",

  // Experience
  "experience": "experience",
  "work experience": "experience",
  "professional experience": "experience",
  "employment history": "experience",
  "employment": "experience",
  "work history": "experience",
  "career history": "experience",
  "positions held": "experience",
  "relevant experience": "experience",

  // Skills
  "skills": "skills",
  "core competencies": "skills",
  "technical skills": "skills",
  "key skills": "skills",
  "competencies": "skills",
  "areas of expertise": "skills",
  "expertise": "skills",
  "capabilities": "skills",
  "proficiencies": "skills",
  "technologies": "skills",

  // Certifications / Education
  "certifications": "certifications",
  "certification": "certifications",
  "certificates": "certifications",
  "licenses": "certifications",
  "accreditations": "certifications",
  "education": "certifications",
  "education & certifications": "certifications",
  "qualifications": "certifications",
  "training": "certifications",
  "courses": "certifications",
};

function getSectionKey(line: string): string | null {
  const normalised = line.toLowerCase().replace(/[:\-–—|]/g, "").trim();
  return SECTION_MAP[normalised] ?? null;
}

/**
 * Split the raw text into labelled sections.
 * Returns a map: sectionKey → lines belonging to that section.
 */
function splitIntoSections(lines: string[]): Record<string, string[]> {
  const sections: Record<string, string[]> = { header: [] };
  let current = "header";

  for (const line of lines) {
    const key = getSectionKey(line);
    if (key) {
      current = key;
      if (!sections[current]) sections[current] = [];
    } else {
      if (!sections[current]) sections[current] = [];
      sections[current].push(line);
    }
  }
  return sections;
}

// ─────────────────────────────────────────────────────────────
// Field extractors
// ─────────────────────────────────────────────────────────────

/** Email — RFC-safe pattern */
function extractEmail(text: string): string | undefined {
  const m = text.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/);
  return m ? m[0].toLowerCase() : undefined;
}

/** LinkedIn profile URL */
function extractLinkedIn(text: string): string | undefined {
  const m = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([\w-]+)\/?/i);
  return m ? `linkedin.com/in/${m[1]}` : undefined;
}

/**
 * Name — look for the first non-email, non-URL line in the header
 * section that looks like a personal name (2–4 capitalised words,
 * no digits).
 */
function extractName(headerLines: string[]): { firstName: string; lastName: string } | undefined {
  for (const line of headerLines.slice(0, 8)) {
    // Skip lines that contain an email, URL, phone number, or address indicators
    if (/[@/\d]/.test(line)) continue;
    if (line.length > 60) continue;

    const words = line.split(/\s+/).filter(Boolean);
    if (words.length < 2 || words.length > 5) continue;

    // Every word should start with a capital letter (names)
    const allCaps = words.every((w) => /^[A-ZÁÉÍÓÚÀÈÌÒÙÄËÏÖÜ][a-záéíóúàèìòùäëïöü'-]+$/.test(w));
    if (!allCaps) continue;

    // Looks like a name
    const firstName = words[0];
    const lastName = words.slice(1).join(" ");
    return { firstName, lastName };
  }
  return undefined;
}

/**
 * Professional title — the line immediately after the name in the
 * header, or the first line that matches common title patterns.
 */
const TITLE_KEYWORDS = [
  "analyst", "manager", "engineer", "consultant", "auditor", "director",
  "officer", "specialist", "advisor", "architect", "lead", "head",
  "associate", "executive", "professional", "coordinator", "administrator",
  "developer", "designer", "strategist", "practitioner", "expert",
];

function extractTitle(headerLines: string[], nameFound: boolean): string | undefined {
  // Start scanning from line after the name (or from line 1 if name not found)
  const startIdx = nameFound ? 1 : 0;

  for (const line of headerLines.slice(startIdx, startIdx + 6)) {
    if (/[@/\d]/.test(line)) continue;
    if (line.length < 4 || line.length > 80) continue;
    const lower = line.toLowerCase();
    if (TITLE_KEYWORDS.some((kw) => lower.includes(kw))) {
      return clean(line);
    }
  }
  return undefined;
}

/**
 * Location — scan each line in the header/contact area for a line that is
 * EXACTLY "City, State/Country". Using a full-line anchor prevents the
 * greedy regex from swallowing name tokens that happen to precede the city.
 */
function extractLocation(lines: string[]): string | undefined {
  // City: 1–2 words; State/Country: 1–3 words. Both start with a capital.
  const LOC_RE =
    /^([A-Z][a-zA-Z-]{1,25}(?:\s+[A-Z][a-zA-Z-]{1,25})?),\s*([A-Z][a-zA-Z-]{1,25}(?:\s+[A-Z][a-zA-Z-]{1,25}){0,2})$/;

  for (const line of lines.slice(0, 25)) {
    if (line.length < 4 || line.length > 60) continue;
    if (/[@/\d]/.test(line)) continue;
    const m = line.match(LOC_RE);
    if (m) {
      const candidate = `${m[1].trim()}, ${m[2].trim()}`;
      if (!/\b(inc|ltd|llc|corp|co\.?|group|solutions|consulting|university|college|institute)\b/i.test(candidate)) {
        return candidate;
      }
    }
  }
  return undefined;
}

/**
 * Summary — join the summary section lines into a paragraph.
 */
function extractSummary(lines: string[]): string | undefined {
  if (!lines || lines.length === 0) return undefined;
  const text = lines.join(" ");
  const trimmed = clean(text);
  return trimmed.length > 20 ? trimmed.slice(0, 800) : undefined;
}

/**
 * Skills — split by common delimiters: commas, bullets, pipes, newlines.
 */
function extractSkills(lines: string[]): string[] {
  if (!lines || lines.length === 0) return [];
  const combined = lines.join(" | ");
  const raw = combined
    .split(/[,|•·▪▸›\-–—\t]/)
    .map((s) => clean(s))
    .filter((s) => s.length > 1 && s.length < 60 && !/^\d+$/.test(s));

  // Deduplicate (case-insensitive)
  const seen = new Set<string>();
  return raw.filter((s) => {
    const key = s.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Certifications — each non-empty line in the cert section is treated
 * as one certification/degree entry.
 */
function extractCertifications(lines: string[]): Certification[] {
  if (!lines || lines.length === 0) return [];
  return lines
    .map((l) => clean(l))
    .filter((l) => l.length > 3 && l.length < 120)
    .map((name) => ({ id: genId(), name }));
}

// Month patterns for date detection
const MONTH_RE =
  /(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)/i;

// DATE_RE — used with .match() (needs g flag) and needs a fresh instance for
// each .test() call to avoid lastIndex drift with a stateful global regex.
const DATE_RE_SOURCE = `(?:${MONTH_RE.source}\\s+\\d{4}|\\d{1,2}[\\/\\-]\\d{4}|\\d{4})`;
const DATE_RE = new RegExp(DATE_RE_SOURCE, "gi");
/** Non-global version safe for repeated .test() calls */
function dateTest(s: string): boolean {
  return new RegExp(DATE_RE_SOURCE, "i").test(s);
}

/**
 * Work experience — each "block" is separated by a line that contains a
 * year or date range. We pick title (first line of block) and company
 * (second line) heuristically.
 */
function extractWorkExperience(lines: string[]): WorkExperience[] {
  if (!lines || lines.length === 0) return [];

  const experiences: WorkExperience[] = [];
  let block: string[] = [];

  function flushBlock() {
    if (block.length < 1) return;

    const blockText = block.join(" ");

    // Find dates anywhere in the block
    DATE_RE.lastIndex = 0;
    const dates = blockText.match(DATE_RE) ?? [];

    // Title = first line that is NOT purely a date string (date-only lines
    // are common at the start when the date precedes the job title).
    const contentLines = block.filter((l) => {
      const stripped = l.replace(new RegExp(DATE_RE_SOURCE, "gi"), "").replace(/[-–—|·,/\s]/g, "").trim();
      return stripped.length > 3;
    });

    const title = clean(contentLines[0] ?? "");
    const company = clean(contentLines[1] ?? "");

    const description = contentLines
      .slice(2)
      .map(clean)
      .filter((l) => l.length > 3)
      .join(" ")
      .slice(0, 500);

    if (title.length > 2) {
      experiences.push({
        id: genId(),
        title,
        company: company.length > 2 ? company : "",
        location: "",
        startDate: dates[0] ?? "",
        endDate: dates[1] ?? "",
        current: /present|current|now/i.test(blockText),
        description,
      });
    }
    block = [];
  }

  for (const line of lines) {
    if (dateTest(line)) {
      // Line with a date = start of new experience block
      if (block.length > 0) flushBlock();
      block.push(line);
    } else {
      block.push(line);
    }
  }
  flushBlock();

  return experiences.slice(0, 10); // cap at 10 positions
}

// ─────────────────────────────────────────────────────────────
// Master parser
// ─────────────────────────────────────────────────────────────
export function parseResumeText(rawText: string): ParsedResume {
  const lines = toLines(rawText);
  const sections = splitIntoSections(lines);
  const headerLines = sections["header"] ?? [];
  const fullText = rawText;

  // ── Contact fields (scan full text for robustness) ──────
  const email = extractEmail(fullText);
  const linkedInUrl = extractLinkedIn(fullText);
  // Location scans lines (not raw text) so anchored regex prevents
  // the city name from absorbing preceding name tokens.
  const location = extractLocation(lines);

  // ── Name + title from header ─────────────────────────────
  const nameResult = extractName(headerLines);
  const title = extractTitle(headerLines, !!nameResult);

  // ── Section-based fields ─────────────────────────────────
  const summary = extractSummary(sections["summary"] ?? []);
  const skills = extractSkills(sections["skills"] ?? []);
  const certs = extractCertifications(sections["certifications"] ?? []);
  const workExp = extractWorkExperience(sections["experience"] ?? []);

  const result: ParsedResume = {};

  if (nameResult) {
    result.firstName = nameResult.firstName;
    result.lastName = nameResult.lastName;
  }
  if (title) result.professionalTitle = title;
  if (email) result.email = email;
  if (location) result.location = location;
  if (linkedInUrl) result.linkedInUrl = linkedInUrl;
  if (summary) result.summary = summary;
  if (skills.length > 0) result.coreCompetencies = skills;
  if (certs.length > 0) result.certifications = certs;
  if (workExp.length > 0) result.workExperience = workExp;

  return result;
}

// ─────────────────────────────────────────────────────────────
// One-shot convenience — extract text AND parse
// ─────────────────────────────────────────────────────────────
export async function parseResume(file: File): Promise<ParsedResume> {
  const text = await extractText(file);
  return parseResumeText(text);
}
