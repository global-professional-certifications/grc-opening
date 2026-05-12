/**
 * Resume Export — Public API
 *
 * Convenience functions to generate and download
 * PDF and DOCX files from an EnhancedResume object.
 */
import type { EnhancedResume } from "../../modules/resume-analyser/ResumeAnalyser";

function getFileName(data: EnhancedResume, ext: string): string {
  const name = data.contact?.name?.trim();
  if (name) {
    const safe = name.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_");
    return `${safe}_Enhanced_Resume.${ext}`;
  }
  return `Enhanced_Resume.${ext}`;
}

/**
 * Generate and download a PDF resume.
 */
export async function exportResumePDF(data: EnhancedResume): Promise<void> {
  const { generateResumePDF } = await import("./pdfGenerator");
  const doc = generateResumePDF(data);
  doc.save(getFileName(data, "pdf"));
}

/**
 * Generate and download a DOCX resume.
 */
export async function exportResumeDOCX(data: EnhancedResume): Promise<void> {
  const { generateResumeDocument } = await import("./docxGenerator");
  const { Packer } = await import("docx");
  const { saveAs } = await import("file-saver");

  const doc = generateResumeDocument(data);
  const blob = await Packer.toBlob(doc);
  saveAs(blob, getFileName(data, "docx"));
}
