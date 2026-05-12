/**
 * Resume Export — DOCX Generator
 *
 * Uses the `docx` library to build a professionally formatted
 * Word document from the EnhancedResume data structure.
 */
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Tab,
  TabStopPosition,
  TabStopType,
  convertInchesToTwip,
} from "docx";
import type { EnhancedResume } from "../../modules/resume-analyser/ResumeAnalyser";
import { getStyleTokens } from "./styles";

// ── Helpers ────────────────────────────────────────────────────

function hexToDocxColor(hex: string): string {
  return hex.replace("#", "");
}

function contactSeparator(): TextRun {
  return new TextRun({ text: "  |  ", color: "999999", size: 18, font: "Calibri" });
}

// ── Main Generator ─────────────────────────────────────────────
export function generateResumeDocument(data: EnhancedResume): Document {
  const tokens = getStyleTokens(data.style);
  const primaryHex = hexToDocxColor(tokens.primaryColor);
  const fontFamily = tokens.headingFont === "times" ? "Times New Roman" : "Calibri";

  const sections: Paragraph[] = [];

  // ── Name ─────────────────────────────────────────────────────
  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: data.contact?.name || "Resume",
          bold: true,
          size: 44,
          font: fontFamily,
          color: primaryHex,
        }),
      ],
    })
  );

  // ── Contact Row ──────────────────────────────────────────────
  const contactParts: TextRun[] = [];
  const contactItems: string[] = [];
  if (data.contact?.email) contactItems.push(data.contact.email);
  if (data.contact?.phone) contactItems.push(data.contact.phone);
  if (data.contact?.location) contactItems.push(data.contact.location);
  if (data.contact?.linkedin) contactItems.push(data.contact.linkedin);
  if (data.contact?.github) contactItems.push(data.contact.github);
  if (data.contact?.website) contactItems.push(data.contact.website);

  contactItems.forEach((item, i) => {
    if (i > 0) contactParts.push(contactSeparator());
    contactParts.push(new TextRun({ text: item, size: 18, font: fontFamily, color: "555555" }));
  });

  if (contactParts.length > 0) {
    sections.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: contactParts,
      })
    );
  }

  // ── Divider ──────────────────────────────────────────────────
  sections.push(
    new Paragraph({
      spacing: { after: 200 },
      border: {
        bottom: { color: primaryHex, size: 6, style: BorderStyle.SINGLE, space: 1 },
      },
      children: [],
    })
  );

  // ── Section Title Helper ─────────────────────────────────────
  function sectionTitle(title: string): Paragraph {
    return new Paragraph({
      spacing: { before: 240, after: 80 },
      border: {
        bottom: { color: primaryHex, size: 4, style: BorderStyle.SINGLE, space: 2 },
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 24,
          font: fontFamily,
          color: primaryHex,
        }),
      ],
    });
  }

  // ── Professional Summary ─────────────────────────────────────
  if (data.summary) {
    sections.push(sectionTitle("Professional Summary"));
    sections.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: data.summary,
            size: 20,
            font: fontFamily,
            color: "333333",
          }),
        ],
      })
    );
  }

  // ── Skills ───────────────────────────────────────────────────
  const flatSkills: string[] = Array.isArray(data.skills)
    ? data.skills
    : data.skills
    ? Object.values(data.skills).flat()
    : [];

  if (flatSkills.length > 0) {
    sections.push(sectionTitle("Skills"));

    if (!Array.isArray(data.skills) && data.skills) {
      // Grouped skills
      Object.entries(data.skills).forEach(([category, skills]) => {
        sections.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: `${category}: `,
                bold: true,
                size: 20,
                font: fontFamily,
                color: "333333",
              }),
              new TextRun({
                text: (skills as string[]).join(", "),
                size: 20,
                font: fontFamily,
                color: "555555",
              }),
            ],
          })
        );
      });
    } else {
      sections.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: flatSkills.join("  •  "),
              size: 20,
              font: fontFamily,
              color: "444444",
            }),
          ],
        })
      );
    }
  }

  // ── Experience ───────────────────────────────────────────────
  if (data.experience && data.experience.length > 0) {
    sections.push(sectionTitle("Experience"));

    data.experience.forEach((exp) => {
      // Title + dates
      const titleChildren: TextRun[] = [
        new TextRun({
          text: exp.title,
          bold: true,
          size: 22,
          font: fontFamily,
          color: "222222",
        }),
      ];
      if (exp.dates) {
        titleChildren.push(
          new TextRun({
            text: "\t" + exp.dates,
            size: 18,
            font: fontFamily,
            color: "777777",
          })
        );
      }
      sections.push(
        new Paragraph({
          spacing: { before: 120, after: 20 },
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: titleChildren,
        })
      );

      // Company + location
      let companyText = exp.company;
      if (exp.location) companyText += `, ${exp.location}`;
      sections.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: companyText,
              italics: true,
              size: 20,
              font: fontFamily,
              color: "555555",
            }),
          ],
        })
      );

      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet) => {
          sections.push(
            new Paragraph({
              spacing: { after: 40 },
              indent: { left: convertInchesToTwip(0.25) },
              bullet: { level: 0 },
              children: [
                new TextRun({
                  text: bullet,
                  size: 19,
                  font: fontFamily,
                  color: "333333",
                }),
              ],
            })
          );
        });
      }
    });
  }

  // ── Education ────────────────────────────────────────────────
  if (data.education && data.education.length > 0) {
    sections.push(sectionTitle("Education"));

    data.education.forEach((edu) => {
      const degreeChildren: TextRun[] = [
        new TextRun({
          text: edu.degree,
          bold: true,
          size: 22,
          font: fontFamily,
          color: "222222",
        }),
      ];
      if (edu.dates) {
        degreeChildren.push(
          new TextRun({
            text: "\t" + edu.dates,
            size: 18,
            font: fontFamily,
            color: "777777",
          })
        );
      }
      sections.push(
        new Paragraph({
          spacing: { before: 120, after: 20 },
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: degreeChildren,
        })
      );

      sections.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: edu.institution,
              italics: true,
              size: 20,
              font: fontFamily,
              color: "555555",
            }),
          ],
        })
      );

      if (edu.details) {
        sections.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: edu.details,
                size: 19,
                font: fontFamily,
                color: "444444",
              }),
            ],
          })
        );
      }
    });
  }

  // ── Certifications ───────────────────────────────────────────
  if (data.certifications && data.certifications.length > 0) {
    sections.push(sectionTitle("Certifications"));
    sections.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: data.certifications.join("  •  "),
            size: 20,
            font: fontFamily,
            color: "444444",
          }),
        ],
      })
    );
  }

  // ── Build Document ───────────────────────────────────────────
  return new Document({
    styles: {
      default: {
        document: {
          run: { font: fontFamily, size: 20 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(0.85),
              right: convertInchesToTwip(0.85),
            },
          },
        },
        children: sections,
      },
    ],
  });
}
