import { Request, Response } from 'express';
import fs from 'fs';

const CHECKER_API_URL = (process.env.RESUME_CHECKER_API_URL || '').trim();
const CHECKER_API_KEY = (process.env.RESUME_CHECKER_API_KEY || '').trim();

export const checkResume = async (req: Request, res: Response): Promise<void> => {
  const file = req.file;

  try {
    if (!file) {
      res.status(400).json({ error: 'No resume file uploaded. Please upload a PDF, DOCX, or TXT file.' });
      return;
    }

    if (!CHECKER_API_URL) {
      try { fs.unlinkSync(file.path); } catch { /* ignore */ }
      res.status(503).json({ error: 'Resume checker service is not configured. Please contact support.' });
      return;
    }

    const fileBuffer = fs.readFileSync(file.path);
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: file.mimetype });

    const form = new FormData();
    form.append('file', blob, file.originalname);

    console.log(`[ResumeChecker] POST → ${CHECKER_API_URL}`);
    console.log(`[ResumeChecker] Key prefix: ${CHECKER_API_KEY.slice(0, 8)}… (length ${CHECKER_API_KEY.length})`);

    const checkerResponse = await fetch(CHECKER_API_URL, {
      method: 'POST',
      headers: { 'X-API-Key': CHECKER_API_KEY },
      body: form,
      signal: AbortSignal.timeout(120_000),
    });

    try { fs.unlinkSync(file.path); } catch { /* ignore */ }

    // Read the raw body once regardless of status — needed for both error and success paths
    const rawBody = await checkerResponse.text().catch(() => '');

    if (!checkerResponse.ok) {
      console.error(`[ResumeChecker] ← ${checkerResponse.status} ${checkerResponse.statusText}`);
      console.error(`[ResumeChecker] Response body:`, rawBody.slice(0, 500));

      // Parse JSON error if the API returned one, otherwise keep raw text
      let apiMessage: string = rawBody;
      try {
        const parsed = JSON.parse(rawBody);
        apiMessage = parsed.message || parsed.error || parsed.detail || rawBody;
      } catch { /* raw text */ }

      if (checkerResponse.status === 401 || checkerResponse.status === 403) {
        res.status(502).json({
          error: `Resume checker authentication failed (${checkerResponse.status}): ${apiMessage || 'Invalid or missing API key'}. Check RESUME_CHECKER_API_KEY in server .env.`,
        });
        return;
      }

      // For all other failures, surface the real status + message for debuggability
      res.status(502).json({
        error: `Resume checker returned ${checkerResponse.status}: ${apiMessage || checkerResponse.statusText}`,
      });
      return;
    }

    // Attempt to parse JSON; fall back to wrapping the raw text
    let result: unknown;
    try {
      result = JSON.parse(rawBody);
    } catch {
      result = { raw: rawBody };
    }

    res.status(200).json({ success: true, data: result });

  } catch (error: any) {
    console.error('[ResumeChecker] Error:', error);

    if (file?.path) {
      try { fs.unlinkSync(file.path); } catch { /* ignore */ }
    }

    if (error.name === 'TimeoutError' || error.code === 'UND_ERR_CONNECT_TIMEOUT') {
      res.status(504).json({ error: 'The checker service took too long to respond. Please try again in a minute.' });
      return;
    }

    res.status(500).json({ error: `Failed to check resume: ${error.message || 'Unknown error'}` });
  }
};
