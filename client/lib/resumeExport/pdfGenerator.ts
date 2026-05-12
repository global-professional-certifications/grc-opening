/**
 * Resume Export — PDF Generator
 *
 * Uses jsPDF to build a professionally formatted PDF resume
 * from the EnhancedResume data structure.
 */
import { jsPDF } from "jspdf";
import type { EnhancedResume } from "../../modules/resume-analyser/ResumeAnalyser";
import { getStyleTokens } from "./styles";

// ── Constants ──────────────────────────────────────────────────
const PAGE_W = 210;   // A4 width in mm
const PAGE_H = 297;   // A4 height in mm
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_H = 12;
const LINE_H = 5;
const SECTION_GAP = 6;

// ── Helpers ────────────────────────────────────────────────────
function needsNewPage(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_H - FOOTER_H - MARGIN) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function addPageNumbers(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W / 2, PAGE_H - 8, { align: "center" });
  }
}

function drawSectionDivider(doc: jsPDF, y: number, tokens: ReturnType<typeof getStyleTokens>): number {
  if (tokens.sectionDivider === "line") {
    doc.setDrawColor(...tokens.primaryRgb);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    return y + 3;
  }
  return y + 1;
}

/**
 * Wrap text to fit within maxWidth mm and return lines.
 */
function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth);
}

// ── Main Generator ─────────────────────────────────────────────
export function generateResumePDF(data: EnhancedResume): jsPDF {
  const tokens = getStyleTokens(data.style);
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  let y = MARGIN;

  // ── Header ───────────────────────────────────────────────────
  if (tokens.headerBg) {
    doc.setFillColor(...tokens.primaryRgb);
    doc.rect(0, 0, PAGE_W, 42, "F");
    doc.setTextColor(255, 255, 255);
  } else {
    doc.setTextColor(...tokens.primaryRgb);
  }

  // Name
  const name = data.contact?.name || "Resume";
  doc.setFont(tokens.headingFont, "bold");
  doc.setFontSize(22);
  doc.text(name, PAGE_W / 2, y + 8, { align: "center" });

  // Contact row
  const contactParts: string[] = [];
  if (data.contact?.email) contactParts.push(data.contact.email);
  if (data.contact?.phone) contactParts.push(data.contact.phone);
  if (data.contact?.location) contactParts.push(data.contact.location);
  if (data.contact?.linkedin) contactParts.push(data.contact.linkedin);
  if (data.contact?.github) contactParts.push(data.contact.github);
  if (data.contact?.website) contactParts.push(data.contact.website);

  if (contactParts.length > 0) {
    doc.setFont(tokens.bodyFont, "normal");
    doc.setFontSize(9);
    const contactText = contactParts.join("  |  ");
    const contactLines = wrapText(doc, contactText, CONTENT_W);
    contactLines.forEach((line, i) => {
      doc.text(line, PAGE_W / 2, y + 16 + i * 4, { align: "center" });
    });
    y = y + 16 + contactLines.length * 4 + 4;
  } else {
    y += 20;
  }

  if (tokens.headerBg) {
    y = Math.max(y, 48);
  } else {
    y += 2;
    y = drawSectionDivider(doc, y, tokens);
  }

  // Reset text color after header
  doc.setTextColor(40, 40, 40);

  // ── Section Renderer Helper ──────────────────────────────────
  function renderSectionTitle(title: string): number {
    y = needsNewPage(doc, y, 14);
    y += SECTION_GAP;
    doc.setFont(tokens.headingFont, "bold");
    doc.setFontSize(12);
    doc.setTextColor(...tokens.primaryRgb);
    doc.text(title.toUpperCase(), MARGIN, y);
    y += 2;
    y = drawSectionDivider(doc, y, tokens);
    doc.setTextColor(40, 40, 40);
    y += 2;
    return y;
  }

  // ── Professional Summary ─────────────────────────────────────
  if (data.summary) {
    y = renderSectionTitle("Professional Summary");
    doc.setFont(tokens.bodyFont, "normal");
    doc.setFontSize(10);
    const lines = wrapText(doc, data.summary, CONTENT_W);
    lines.forEach((line) => {
      y = needsNewPage(doc, y, LINE_H);
      doc.text(line, MARGIN, y);
      y += LINE_H;
    });
  }

  // ── Skills ───────────────────────────────────────────────────
  const flatSkills: string[] = Array.isArray(data.skills)
    ? data.skills
    : data.skills
    ? Object.values(data.skills).flat()
    : [];

  if (flatSkills.length > 0) {
    y = renderSectionTitle("Skills");
    doc.setFont(tokens.bodyFont, "normal");
    doc.setFontSize(10);

    if (!Array.isArray(data.skills) && data.skills) {
      // Grouped skills
      Object.entries(data.skills).forEach(([category, skills]) => {
        y = needsNewPage(doc, y, LINE_H * 2);
        doc.setFont(tokens.bodyFont, "bold");
        doc.setFontSize(10);
        doc.text(`${category}:`, MARGIN, y);
        doc.setFont(tokens.bodyFont, "normal");
        const skillText = (skills as string[]).join(", ");
        const catLines = wrapText(doc, skillText, CONTENT_W - 2);
        catLines.forEach((line, i) => {
          y = needsNewPage(doc, y, LINE_H);
          doc.text(line, MARGIN + 2, y + (i === 0 ? 0 : 0));
          if (i > 0) y += LINE_H;
        });
        y += LINE_H + 1;
      });
    } else {
      // Flat skills — render as comma-separated
      const skillText = flatSkills.join("  •  ");
      const lines = wrapText(doc, skillText, CONTENT_W);
      lines.forEach((line) => {
        y = needsNewPage(doc, y, LINE_H);
        doc.text(line, MARGIN, y);
        y += LINE_H;
      });
    }
  }

  // ── Experience ───────────────────────────────────────────────
  if (data.experience && data.experience.length > 0) {
    y = renderSectionTitle("Experience");

    data.experience.forEach((exp, i) => {
      y = needsNewPage(doc, y, 20);

      // Title and dates on same line
      doc.setFont(tokens.bodyFont, "bold");
      doc.setFontSize(10.5);
      doc.text(exp.title, MARGIN, y);
      if (exp.dates) {
        doc.setFont(tokens.bodyFont, "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(exp.dates, PAGE_W - MARGIN, y, { align: "right" });
        doc.setTextColor(40, 40, 40);
      }
      y += LINE_H;

      // Company and location
      doc.setFont(tokens.bodyFont, "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(80, 80, 80);
      let compLine = exp.company;
      if (exp.location) compLine += `, ${exp.location}`;
      doc.text(compLine, MARGIN, y);
      doc.setTextColor(40, 40, 40);
      y += LINE_H + 1;

      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        doc.setFont(tokens.bodyFont, "normal");
        doc.setFontSize(9.5);
        exp.bullets.forEach((bullet) => {
          const bulletLines = wrapText(doc, bullet, CONTENT_W - 8);
          bulletLines.forEach((line, j) => {
            y = needsNewPage(doc, y, LINE_H);
            if (j === 0) {
              doc.text("•", MARGIN + 2, y);
              doc.text(line, MARGIN + 7, y);
            } else {
              doc.text(line, MARGIN + 7, y);
            }
            y += LINE_H;
          });
        });
      }

      if (i < data.experience!.length - 1) y += 2;
    });
  }

  // ── Education ────────────────────────────────────────────────
  if (data.education && data.education.length > 0) {
    y = renderSectionTitle("Education");

    data.education.forEach((edu) => {
      y = needsNewPage(doc, y, 14);

      doc.setFont(tokens.bodyFont, "bold");
      doc.setFontSize(10.5);
      doc.text(edu.degree, MARGIN, y);
      if (edu.dates) {
        doc.setFont(tokens.bodyFont, "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(edu.dates, PAGE_W - MARGIN, y, { align: "right" });
        doc.setTextColor(40, 40, 40);
      }
      y += LINE_H;

      doc.setFont(tokens.bodyFont, "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(80, 80, 80);
      doc.text(edu.institution, MARGIN, y);
      doc.setTextColor(40, 40, 40);
      y += LINE_H;

      if (edu.details) {
        doc.setFontSize(9);
        const lines = wrapText(doc, edu.details, CONTENT_W);
        lines.forEach((line) => {
          y = needsNewPage(doc, y, LINE_H);
          doc.text(line, MARGIN, y);
          y += LINE_H;
        });
      }
      y += 2;
    });
  }

  // ── Certifications ───────────────────────────────────────────
  if (data.certifications && data.certifications.length > 0) {
    y = renderSectionTitle("Certifications");
    doc.setFont(tokens.bodyFont, "normal");
    doc.setFontSize(10);
    const certText = data.certifications.join("  •  ");
    const lines = wrapText(doc, certText, CONTENT_W);
    lines.forEach((line) => {
      y = needsNewPage(doc, y, LINE_H);
      doc.text(line, MARGIN, y);
      y += LINE_H;
    });
  }

  // ── Page Numbers ─────────────────────────────────────────────
  addPageNumbers(doc);

  return doc;
}
