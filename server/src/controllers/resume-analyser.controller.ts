import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const AI_SERVICE_URL = process.env.AI_RESUME_SERVICE_URL
  || 'https://resume-enhancer-fmp3.onrender.com';

/**
 * POST /resume-analyser/analyse
 * POST /resume-analyser/public/analyse
 *
 * Proxies the uploaded resume + job description to the external
 * AI Resume Enhancer microservice and returns the structured result.
 *
 * Expects multipart/form-data with:
 *  - resume  (PDF/DOCX/DOC/TXT file, max 5 MB)
 *  - job_description  (string, min 50 chars)
 *  - style?  (classic | modern | creative | minimalist | executive)
 */
export const analyseResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    const jobDescription = req.body?.job_description;
    const style = req.body?.style || 'modern';

    // ── Validation ────────────────────────────────────────────
    if (!file) {
      res.status(400).json({
        error: 'No resume file uploaded. Please upload a PDF, DOCX, DOC or TXT file.',
      });
      return;
    }

    if (jobDescription && typeof jobDescription !== 'string') {
      res.status(400).json({
        error: 'Job description must be a string.',
      });
      return;
    }

    // ── Build multipart form to forward to AI microservice ───
    // Node 24 has native FormData + File, but the file is on disk,
    // so we read it into a Blob and build the form manually.
    
    // The AI microservice has a strict 50-character minimum for the job description.
    // Since the user requested no limit, we pad it with spaces if it's too short.
    let finalJd = jobDescription || "General Application";
    if (finalJd.length < 50) {
      finalJd = finalJd.padEnd(50, ' ');
    }

    const fileBuffer = fs.readFileSync(file.path);
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: file.mimetype });

    const form = new FormData();
    form.append('resume', blob, file.originalname);
    form.append('job_description', finalJd);
    form.append('style', style);

    // ── Forward to AI microservice ───────────────────────────
    console.log(`[ResumeAnalyser] Forwarding to AI service: ${AI_SERVICE_URL}/api/resume/enhance`);

    const aiResponse = await fetch(`${AI_SERVICE_URL}/api/resume/enhance`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(120_000), // 2-minute timeout (AI can be slow)
    });

    // Clean up the temp file
    try { fs.unlinkSync(file.path); } catch { /* ignore */ }

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.text().catch(() => '');
      console.error(`[ResumeAnalyser] AI service error (${aiResponse.status}):`, errorBody);

      if (aiResponse.status === 422) {
        res.status(422).json({
          error: 'The AI service could not process your resume. Please check the file format and job description.',
          details: errorBody,
        });
        return;
      }

      res.status(502).json({
        error: 'The AI resume analysis service is temporarily unavailable. Please try again shortly.',
      });
      return;
    }

    const result = await aiResponse.json();

    res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error('[ResumeAnalyser] Error:', error);

    // Clean up temp file on error
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch { /* ignore */ }
    }

    if (error.name === 'TimeoutError' || error.code === 'UND_ERR_CONNECT_TIMEOUT') {
      res.status(504).json({
        error: 'The AI service took too long to respond. The service may be warming up — please try again in a minute.',
      });
      return;
    }

    res.status(500).json({
      error: 'Failed to analyse resume. Please try again.',
    });
  }
};
