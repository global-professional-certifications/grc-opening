import { Request, Response } from 'express';
import fs from 'fs';

/**
 * The resume checker uses the same AI enhance microservice
 * but with a generic "quality review" job description.
 * It returns the enhanced data which the client interprets
 * as a quality check (summary, skills analysis, experience review, etc.).
 */
const AI_SERVICE_URL = process.env.AI_RESUME_SERVICE_URL
  || 'https://resume-enhancer-fmp3.onrender.com';

// A generic JD prompt that tells the AI to focus on quality review
const CHECKER_JD = `
Quality Review — General Resume Assessment.

This is a general resume quality review. Please carefully analyze the resume for:
- Spelling, grammar, and punctuation errors
- Weak or vague bullet points that lack quantifiable impact
- Missing critical sections (summary, skills, experience, education)
- Formatting inconsistencies
- Repetitive language or phrases
- ATS compatibility issues (special characters, tables, images)
- Missing action verbs at the start of bullet points
- Overly long or overly short resume content

Enhance the resume to be ATS-friendly, well-structured, and impactful while preserving
all factual information. Focus on strengthening weak areas and fixing any issues found.
`.trim();

export const checkResume = async (req: Request, res: Response): Promise<void> => {
  const file = req.file;

  try {
    if (!file) {
      res.status(400).json({ error: 'No resume file uploaded. Please upload a PDF, DOCX, or TXT file.' });
      return;
    }

    const fileBuffer = fs.readFileSync(file.path);
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: file.mimetype });

    const form = new FormData();
    form.append('resume', blob, file.originalname);
    form.append('job_description', CHECKER_JD);
    form.append('style', 'modern');

    console.log(`[ResumeChecker] Forwarding to AI service: ${AI_SERVICE_URL}/api/resume/enhance`);

    const aiResponse = await fetch(`${AI_SERVICE_URL}/api/resume/enhance`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(120_000), // 2-minute timeout
    });

    // Clean up the temp file
    try { fs.unlinkSync(file.path); } catch { /* ignore */ }

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.text().catch(() => '');
      console.error(`[ResumeChecker] AI service error (${aiResponse.status}):`, errorBody);

      if (aiResponse.status === 422) {
        res.status(422).json({
          error: 'The AI service could not process your resume. Please check the file format.',
          details: errorBody,
        });
        return;
      }

      res.status(502).json({
        error: 'The AI resume service is temporarily unavailable. Please try again shortly.',
      });
      return;
    }

    const result = await aiResponse.json();

    // Transform the EnhancedResume data into a checker-friendly response
    // The client CheckerResults component expects a specific format,
    // so we synthesize a quality report from the enhancement data.
    const checkerReport = buildCheckerReport(result);

    res.status(200).json({ success: true, data: checkerReport, enhanced: result });

  } catch (error: any) {
    console.error('[ResumeChecker] Error:', error);

    if (file?.path) {
      try { fs.unlinkSync(file.path); } catch { /* ignore */ }
    }

    if (error.name === 'TimeoutError' || error.code === 'UND_ERR_CONNECT_TIMEOUT') {
      res.status(504).json({
        error: 'The AI service took too long to respond. The service may be warming up — please try again in a minute.',
      });
      return;
    }

    res.status(500).json({ error: `Failed to check resume: ${error.message || 'Unknown error'}` });
  }
};

// ── Transform enhanced resume into checker report ──────────────

interface CheckerCategory {
  name: string;
  score: number;
  issue_count: number;
  level: 'no_issues' | 'warning' | 'error';
  issues: Array<{ message: string; original_text?: string | null; corrected_text?: string | null; suggestion: string }>;
  passed: boolean;
}

function buildCheckerReport(enhanced: any) {
  const contact = enhanced.contact || {};
  const summary = enhanced.summary || '';
  const skills = enhanced.skills || [];
  const experience = enhanced.experience || [];
  const education = enhanced.education || [];
  const certifications = enhanced.certifications || [];
  const keywordsWoven = enhanced.keywords_woven_in || [];
  const keywordsAdded = enhanced.keywords_added || [];
  const sectionsModified = enhanced.sections_modified || [];
  const notes = enhanced.enhancement_notes || '';

  // ── Determine sections found ──────────────────────────────────
  const sections_found = [
    { name: 'Contact Information', present: !!(contact.name || contact.email || contact.phone) },
    { name: 'Professional Summary', present: !!summary },
    { name: 'Skills', present: Array.isArray(skills) ? skills.length > 0 : Object.keys(skills).length > 0 },
    { name: 'Experience', present: experience.length > 0 },
    { name: 'Education', present: education.length > 0 },
    { name: 'Certifications', present: certifications.length > 0 },
  ];

  const missingSections = sections_found.filter(s => !s.present);
  const presentSections = sections_found.filter(s => s.present);

  // ── Score categories ──────────────────────────────────────────
  // ATS Parse Rate — based on section completeness
  const atsSectionScore = Math.round((presentSections.length / sections_found.length) * 100);
  const atsIssues: CheckerCategory['issues'] = [];
  missingSections.forEach(s => {
    atsIssues.push({
      message: `Missing section: ${s.name}`,
      suggestion: `Add a "${s.name}" section to improve ATS compatibility and completeness.`,
    });
  });

  // Quantifying Impact — based on bullet points with numbers
  let totalBullets = 0;
  let quantifiedBullets = 0;
  experience.forEach((exp: any) => {
    (exp.bullets || []).forEach((b: string) => {
      totalBullets++;
      if (/\d/.test(b)) quantifiedBullets++;
    });
  });
  const quantifyScore = totalBullets > 0 ? Math.round((quantifiedBullets / totalBullets) * 100) : 50;
  const quantifyIssues: CheckerCategory['issues'] = [];
  if (totalBullets > 0 && quantifiedBullets < totalBullets) {
    const weak = totalBullets - quantifiedBullets;
    quantifyIssues.push({
      message: `${weak} of ${totalBullets} bullet points lack quantifiable metrics.`,
      suggestion: 'Add numbers, percentages, or measurable outcomes to strengthen impact (e.g., "Reduced risk by 30%").',
    });
  }

  // Repetition — based on keywords analysis
  const repetitionScore = keywordsWoven.length > 0 ? Math.min(95, 70 + keywordsWoven.length * 3) : 75;
  const repetitionIssues: CheckerCategory['issues'] = [];
  if (keywordsAdded.length > 0) {
    repetitionIssues.push({
      message: `${keywordsAdded.length} new keywords were identified as missing and added.`,
      suggestion: `Ensure these keywords are naturally integrated: ${keywordsAdded.slice(0, 5).join(', ')}${keywordsAdded.length > 5 ? '…' : ''}.`,
    });
  }

  // Spelling & Grammar — infer from enhancement notes
  const hasGrammarIssues = notes.toLowerCase().includes('grammar') || notes.toLowerCase().includes('spelling') || notes.toLowerCase().includes('typo');
  const grammarScore = hasGrammarIssues ? 65 : 90;
  const grammarIssues: CheckerCategory['issues'] = [];
  if (hasGrammarIssues) {
    grammarIssues.push({
      message: 'Grammar or spelling issues were detected and corrected by the AI.',
      suggestion: 'Review the enhanced version for corrected phrasing.',
    });
  }

  // Format — based on section structure
  const formatScore = presentSections.length >= 4 ? 90 : presentSections.length >= 3 ? 75 : 55;
  const formatIssues: CheckerCategory['issues'] = [];
  if (!contact.email) {
    formatIssues.push({
      message: 'No email address found in contact information.',
      suggestion: 'Add a professional email address for recruiters to reach you.',
    });
  }
  if (!contact.phone) {
    formatIssues.push({
      message: 'No phone number found in contact information.',
      suggestion: 'Include a phone number for direct contact.',
    });
  }

  // Style — based on summary quality and modifications
  const styleScore = sectionsModified.length > 0 ? Math.min(85, 60 + sectionsModified.length * 5) : 80;
  const styleIssues: CheckerCategory['issues'] = [];
  if (sectionsModified.length > 0) {
    styleIssues.push({
      message: `${sectionsModified.length} section(s) required style improvements: ${sectionsModified.join(', ')}.`,
      suggestion: 'The AI has enhanced these sections. Review the changes to ensure they match your voice.',
    });
  }

  // ── Build categories ──────────────────────────────────────────
  function buildCategory(name: string, score: number, issues: CheckerCategory['issues']): CheckerCategory {
    return {
      name,
      score: Math.max(0, Math.min(100, score)),
      issue_count: issues.length,
      level: issues.length === 0 ? 'no_issues' : score >= 70 ? 'warning' : 'error',
      issues,
      passed: issues.length === 0,
    };
  }

  const allIssues = [...atsIssues, ...quantifyIssues, ...repetitionIssues, ...grammarIssues, ...formatIssues, ...styleIssues];
  const scores = [atsSectionScore, quantifyScore, repetitionScore, grammarScore, formatScore, styleScore];
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  // ── Enhancements (actionable tips) ────────────────────────────
  const enhancements: string[] = [];
  if (notes) enhancements.push(notes);
  if (missingSections.length > 0) enhancements.push(`Add missing sections: ${missingSections.map(s => s.name).join(', ')}.`);
  if (quantifiedBullets < totalBullets) enhancements.push('Add measurable results to your bullet points (percentages, dollar amounts, team sizes).');
  if (!contact.linkedin) enhancements.push('Add your LinkedIn URL to make it easy for recruiters to learn more about you.');
  if (keywordsAdded.length > 0) enhancements.push(`Consider naturally incorporating these keywords: ${keywordsAdded.join(', ')}.`);

  return {
    overall_score: overallScore,
    total_issues: allIssues.length,
    ats_parse_rate: buildCategory('ATS Parse Rate', atsSectionScore, atsIssues),
    quantifying_impact: buildCategory('Quantifying Impact', quantifyScore, quantifyIssues),
    repetition: buildCategory('Repetition', repetitionScore, repetitionIssues),
    spelling_grammar: buildCategory('Spelling & Grammar', grammarScore, grammarIssues),
    format: buildCategory('Format', formatScore, formatIssues),
    style: buildCategory('Style', styleScore, styleIssues),
    sections_found,
    hyperlinks: [], // No hyperlink checking in this mode
    enhancements,
  };
}
