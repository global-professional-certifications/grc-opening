/**
 * Resume Export — Style Tokens
 *
 * Maps the `style` field from the EnhancedResume response to
 * concrete design tokens used by the PDF and DOCX generators.
 */

export interface ResumeStyleTokens {
  primaryColor: string;       // hex, e.g. "#3a1292"
  primaryRgb: [number, number, number]; // for jsPDF
  accentColor: string;
  accentRgb: [number, number, number];
  headingFont: string;        // jsPDF built-in font name
  bodyFont: string;
  sectionDivider: "line" | "dots" | "none";
  headerBg: boolean;          // coloured header band?
}

export const RESUME_STYLES: Record<string, ResumeStyleTokens> = {
  modern: {
    primaryColor: "#3a1292",
    primaryRgb: [58, 18, 146],
    accentColor: "#7c3aed",
    accentRgb: [124, 58, 237],
    headingFont: "helvetica",
    bodyFont: "helvetica",
    sectionDivider: "line",
    headerBg: true,
  },
  classic: {
    primaryColor: "#1a1a2e",
    primaryRgb: [26, 26, 46],
    accentColor: "#16213e",
    accentRgb: [22, 33, 62],
    headingFont: "times",
    bodyFont: "times",
    sectionDivider: "line",
    headerBg: false,
  },
  executive: {
    primaryColor: "#0f3460",
    primaryRgb: [15, 52, 96],
    accentColor: "#1a5276",
    accentRgb: [26, 82, 118],
    headingFont: "helvetica",
    bodyFont: "helvetica",
    sectionDivider: "line",
    headerBg: true,
  },
  minimalist: {
    primaryColor: "#333333",
    primaryRgb: [51, 51, 51],
    accentColor: "#666666",
    accentRgb: [102, 102, 102],
    headingFont: "helvetica",
    bodyFont: "helvetica",
    sectionDivider: "none",
    headerBg: false,
  },
  creative: {
    primaryColor: "#6c3483",
    primaryRgb: [108, 52, 131],
    accentColor: "#e74c3c",
    accentRgb: [231, 76, 60],
    headingFont: "helvetica",
    bodyFont: "helvetica",
    sectionDivider: "line",
    headerBg: true,
  },
};

export function getStyleTokens(style?: string): ResumeStyleTokens {
  return RESUME_STYLES[style || "modern"] || RESUME_STYLES.modern;
}
