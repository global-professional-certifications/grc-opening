import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { enqueueResumeParse } from '../queues/resume.queue';
import { parseResume as parseResumeLocally } from '../services/resume-parser.service';

const prisma = new PrismaClient();

const AI_RESUME_PARSER_BASE_URL = (process.env.AI_RESUME_PARSER_BASE_URL || '').trim();
const AI_RESUME_PARSER_API_KEY = (process.env.AI_RESUME_PARSER_API_KEY || '').trim();
const AI_RESUME_PARSER_ENDPOINT = (process.env.AI_RESUME_PARSER_ENDPOINT || '/parse').trim();
const AI_RESUME_PARSER_FILE_FIELD = (process.env.AI_RESUME_PARSER_FILE_FIELD || 'resume').trim();

interface ParsedWorkExperiencePreview {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

interface ParsedEducationPreview {
  institution: string;
  degree: string;
  field: string;
  gpa: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface ParsedCertificationPreview {
  name: string;
}

interface ResumeParsedFormPreview {
  firstName?: string;
  lastName?: string;
  professionalTitle?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedInUrl?: string;
  summary?: string;
  coreCompetencies?: string[];
  certifications?: ParsedCertificationPreview[];
  workExperience?: ParsedWorkExperiencePreview[];
  education?: ParsedEducationPreview[];
}

const RESUME_PREVIEW_LABELS: Record<keyof ResumeParsedFormPreview, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  professionalTitle: 'Professional Title',
  email: 'Email',
  phone: 'Phone Number',
  location: 'Location',
  linkedInUrl: 'LinkedIn URL',
  summary: 'Summary',
  coreCompetencies: 'Skills',
  certifications: 'Certifications',
  workExperience: 'Work Experience',
  education: 'Education',
};

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (typeof item === 'number') return String(item);
      const record = asRecord(item);
      if (!record) return '';
      return asString(record.name) || asString(record.skill) || asString(record.value);
    })
    .filter((item, idx, arr) => item.length > 0 && arr.findIndex((v) => v.toLowerCase() === item.toLowerCase()) === idx);
}

function findValueByKeys(node: unknown, keys: string[], depth = 0): unknown {
  if (node == null || depth > 6) return undefined;

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findValueByKeys(item, keys, depth + 1);
      if (found !== undefined) return found;
    }
    return undefined;
  }

  const record = asRecord(node);
  if (!record) return undefined;

  for (const [rawKey, value] of Object.entries(record)) {
    const normalized = normalizeKey(rawKey);
    if (keys.includes(normalized)) return value;
  }

  for (const value of Object.values(record)) {
    const found = findValueByKeys(value, keys, depth + 1);
    if (found !== undefined) return found;
  }

  return undefined;
}

function parseNameParts(raw: unknown): { firstName?: string; lastName?: string } {
  const firstNameDirect = asString(findValueByKeys(raw, ['firstname', 'givenname', 'forename']));
  const lastNameDirect = asString(findValueByKeys(raw, ['lastname', 'surname', 'familyname']));

  if (firstNameDirect || lastNameDirect) {
    return {
      firstName: firstNameDirect || undefined,
      lastName: lastNameDirect || undefined,
    };
  }

  const fullName = asString(findValueByKeys(raw, ['name', 'fullname', 'candidate', 'candidatename']));
  if (!fullName) return {};

  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { firstName: parts[0] };
  if (parts.length >= 2) {
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    };
  }

  return {};
}

function toExperienceList(raw: unknown): ParsedWorkExperiencePreview[] {
  let value = findValueByKeys(raw, [
    'workexperience',
    'experience',
    'employmenthistory',
    'employment',
    'workhistory',
  ]);

  if (value && !Array.isArray(value)) {
    const record = asRecord(value);
    if (record) {
      value = record.items || record.values || record.data || value;
    }
  }

  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;

      const title = asString(record.title) || asString(record.role) || asString(record.position);
      const company = asString(record.company) || asString(record.employer) || asString(record.organization);
      const location = asString(record.location);
      const startDate = asString(record.startDate) || asString(record.start_date) || asString(record.from);
      const endDate = asString(record.endDate) || asString(record.end_date) || asString(record.to);
      const currentRaw = record.current ?? record.isCurrent ?? record.present;
      const current = typeof currentRaw === 'boolean'
        ? currentRaw
        : /present|current|now/i.test(asString(currentRaw));
      const description = asString(record.description) || asString(record.summary);

      if (!title && !company && !description) return null;

      return {
        title,
        company,
        location,
        startDate,
        endDate,
        current,
        description,
      };
    })
    .filter((item): item is ParsedWorkExperiencePreview => Boolean(item));
}

function toEducationList(raw: unknown): ParsedEducationPreview[] {
  let value = findValueByKeys(raw, ['education', 'educations', 'academics', 'academic']);

  if (value && !Array.isArray(value)) {
    const record = asRecord(value);
    if (record) {
      value = record.items || record.values || record.data || value;
    }
  }

  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;

      const institution = asString(record.institution) || asString(record.school) || asString(record.university);
      const degree = asString(record.degree);
      const field = asString(record.field) || asString(record.fieldOfStudy) || asString(record.major);
      const gpa = asString(record.gpa);
      const startDate = asString(record.startDate) || asString(record.start_date) || asString(record.from);
      const endDate = asString(record.endDate) || asString(record.end_date) || asString(record.to);
      const description = asString(record.description);

      if (!institution && !degree && !field) return null;

      return {
        institution,
        degree,
        field,
        gpa,
        startDate,
        endDate,
        description,
      };
    })
    .filter((item): item is ParsedEducationPreview => Boolean(item));
}

function toCertificationList(raw: unknown): ParsedCertificationPreview[] {
  const value = findValueByKeys(raw, [
    'certifications',
    'certification',
    'licenses',
    'credentials',
  ]);

  const names = asStringArray(value);
  return names.map((name) => ({ name }));
}

function normalizeResumeToFormPreview(raw: unknown): ResumeParsedFormPreview {
  const name = parseNameParts(raw);

  const email = asString(findValueByKeys(raw, ['email', 'emailaddress']));
  const phone = asString(findValueByKeys(raw, ['phone', 'phonenumber', 'mobile', 'contactnumber']));
  const location = asString(findValueByKeys(raw, ['location', 'city', 'address']));
  const linkedInUrl = asString(findValueByKeys(raw, ['linkedinurl', 'linkedin', 'linkedinprofile']));
  const professionalTitle = asString(findValueByKeys(raw, ['professionaltitle', 'title', 'headline', 'designation', 'currentrole']));
  const summary = asString(findValueByKeys(raw, ['summary', 'profile', 'objective', 'about']));

  const skills = asStringArray(findValueByKeys(raw, [
    'skills',
    'corecompetencies',
    'competencies',
    'technicalskills',
    'keyskills',
  ]));

  const workExperience = toExperienceList(raw);
  const education = toEducationList(raw);
  const certifications = toCertificationList(raw);

  const preview: ResumeParsedFormPreview = {};

  if (name.firstName) preview.firstName = name.firstName;
  if (name.lastName) preview.lastName = name.lastName;
  if (professionalTitle) preview.professionalTitle = professionalTitle;
  if (email) preview.email = email;
  if (phone) preview.phone = phone;
  if (location) preview.location = location;
  if (linkedInUrl) preview.linkedInUrl = linkedInUrl;
  if (summary) preview.summary = summary;
  if (skills.length > 0) preview.coreCompetencies = skills;
  if (certifications.length > 0) preview.certifications = certifications;
  if (workExperience.length > 0) preview.workExperience = workExperience;
  if (education.length > 0) preview.education = education;

  return preview;
}

function collectFilledFieldLabels(preview: ResumeParsedFormPreview): string[] {
  return (Object.keys(preview) as (keyof ResumeParsedFormPreview)[])
    .filter((key) => {
      const value = preview[key];
      if (Array.isArray(value)) return value.length > 0;
      return Boolean(value);
    })
    .map((key) => RESUME_PREVIEW_LABELS[key]);
}

function getParserUrl(): string {
  // Re-read at call time so tsx watch picks up .env changes without requiring a manual restart
  const base = (process.env.AI_RESUME_PARSER_BASE_URL || '').trim().replace(/\/+$/, '');
  const endpointRaw = (process.env.AI_RESUME_PARSER_ENDPOINT || '').trim();

  if (!endpointRaw) return base; // full URL already in base — use as-is

  const endpoint = endpointRaw.startsWith('/') ? endpointRaw : `/${endpointRaw}`;
  return `${base}${endpoint}`;
}

class AiParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiParserError';
  }
}

async function parseResumeViaAiService(file: Express.Multer.File): Promise<unknown> {
  const baseUrl = (process.env.AI_RESUME_PARSER_BASE_URL || '').trim();
  if (!baseUrl) {
    throw new AiParserError('AI parser base URL is not configured');
  }

  const fileBuffer = fs.readFileSync(file.path);
  const blob = new Blob([new Uint8Array(fileBuffer)], { type: file.mimetype });
  const form = new FormData();
  // Read file field name from env at call time (API expects 'file')
  const fileField = (process.env.AI_RESUME_PARSER_FILE_FIELD || 'file').trim();
  form.append(fileField, blob, file.originalname);

  const apiKey = (process.env.AI_RESUME_PARSER_API_KEY || '').trim();
  const headers: Record<string, string> = {};
  if (apiKey) {
    // API uses HTTPBearer auth — Authorization: Bearer <key> only
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(getParserUrl(), {
    method: 'POST',
    headers,
    body: form,
    signal: AbortSignal.timeout(120_000),
  });

  const responseBody = await response.text().catch(() => '');
  if (!response.ok) {
    throw new AiParserError(`AI parser returned ${response.status}: ${responseBody || response.statusText}`);
  }

  try {
    const parsed = responseBody ? JSON.parse(responseBody) : {};
    // ── DEBUG: log raw API response so we can see its exact schema ──
    console.log('[ResumeParser] RAW API RESPONSE KEYS (top-level):', Object.keys(parsed));
    console.log('[ResumeParser] RAW API RESPONSE (full):\n', JSON.stringify(parsed, null, 2));
    return parsed;
  } catch {
    console.log('[ResumeParser] RAW API RESPONSE (non-JSON):', responseBody);
    return { raw: responseBody };
  }
}

function cleanupUploadedFile(filePath?: string): void {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Ignore cleanup errors for temp parser files
  }
}

// =====================================
// UPLOAD RESUME
// =====================================

/**
 * POST /resume/upload
 * 
 * Handles resume file upload for job seekers.
 * 
 * Flow:
 * 1. Multer middleware stores file on disk
 * 2. Create Resume record in DB (status: PENDING)
 * 3. Enqueue parsing job to BullMQ
 * 4. Return 202 Accepted with resumeId
 * 
 * The actual parsing happens asynchronously in the worker process.
 */
export const uploadResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id!;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No file uploaded. Please upload a PDF resume.' });
      return;
    }

    // Find the seeker profile
    const profile = await prisma.seekerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      res.status(404).json({ error: 'Seeker profile not found. Please complete registration first.' });
      return;
    }

    // Create Resume record
    const resume = await prisma.resume.create({
      data: {
        seekerId: profile.id,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        status: 'PENDING',
      },
    });

    // Enqueue parsing job
    await enqueueResumeParse({
      resumeId: resume.id,
      userId,
      seekerId: profile.id,
      fileUrl: file.path,
    });

    res.status(202).json({
      message: 'Resume uploaded successfully. Parsing in progress.',
      resumeId: resume.id,
      status: 'PENDING',
    });

  } catch (error: any) {
    console.error('[ResumeController] Upload error:', error);

    // Handle multer-specific errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: 'File too large. Maximum size is 5MB.' });
      return;
    }

    res.status(500).json({ error: 'Failed to upload resume. Please try again.' });
  }
};

// =====================================
// PARSE RESUME (PROFILE PREVIEW)
// =====================================

/**
 * POST /resume/parse-preview
 *
 * Parses an uploaded resume and returns extracted profile fields
 * that the client can preview and apply/discard.
 *
 * This endpoint is synchronous (no queue/polling) so the UI can
 * immediately show the parsed preview panel.
 */
export const parseResumePreview = async (req: Request, res: Response): Promise<void> => {
  const file = req.file;

  try {
    if (!file) {
      res.status(400).json({
        error: 'No file uploaded. Please upload a PDF, DOC, or DOCX resume.',
      });
      return;
    }

    let rawResult: unknown;
    let source: 'ai' | 'local' = 'ai';
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');

    if (AI_RESUME_PARSER_BASE_URL) {
      try {
        rawResult = await parseResumeViaAiService(file);
      } catch (aiErr: any) {
        console.warn('[ResumeController] AI parser failed, falling back to local parser:', aiErr?.message);
        // Fall back to local PDF parser rather than hard-failing
        if (isPdf) {
          source = 'local';
          rawResult = await parseResumeLocally(file.path);
        } else {
          // Can't fall back for non-PDF formats
          res.status(502).json({
            error: `Resume parser unavailable: ${aiErr?.message || 'Unknown error'}. Please fill in your details manually.`,
          });
          return;
        }
      }
    } else {
      if (!isPdf) {
        res.status(503).json({
          error: 'AI resume parser is not configured. Configure AI_RESUME_PARSER_BASE_URL to parse DOC/DOCX files.',
        });
        return;
      }

      source = 'local';
      rawResult = await parseResumeLocally(file.path);
    }

    const parsedData = normalizeResumeToFormPreview(rawResult);
    const filledFields = collectFilledFieldLabels(parsedData);

    if (filledFields.length === 0) {
      res.status(422).json({
        error: 'The resume was processed, but no profile fields could be extracted.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      source,
      parsedData,
      filledFields,
      filledCount: filledFields.length,
    });
  } catch (error: any) {
    console.error('[ResumeController] Parse preview error:', error);

    if (error?.name === 'TimeoutError' || error?.code === 'UND_ERR_CONNECT_TIMEOUT') {
      res.status(504).json({
        error: 'The resume parser took too long to respond. Please try again.',
      });
      return;
    }

    res.status(502).json({
      error: error?.message || 'Failed to parse resume. Please try again.',
    });
  } finally {
    cleanupUploadedFile(file?.path);
  }
};

// =====================================
// GET RESUME STATUS
// =====================================

/**
 * GET /resume/:id/status
 * 
 * Check the parsing status of a resume.
 * Returns status + parsed data if completed.
 */
export const getResumeStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id!;
    const id = req.params.id as string;

    const profile = await prisma.seekerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      res.status(404).json({ error: 'Seeker profile not found' });
      return;
    }

    const resume = await prisma.resume.findFirst({
      where: {
        id,
        seekerId: profile.id,
      },
    });

    if (!resume) {
      res.status(404).json({ error: 'Resume not found' });
      return;
    }

    const response: Record<string, any> = {
      id: resume.id,
      originalName: resume.originalName,
      status: resume.status,
      createdAt: resume.createdAt,
      processedAt: resume.processedAt,
    };

    if (resume.status === 'COMPLETED') {
      response.parsedData = resume.parsedData;
    }

    if (resume.status === 'FAILED') {
      response.errorMessage = resume.errorMessage;
      response.retryCount = resume.retryCount;
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('[ResumeController] Status check error:', error);
    res.status(500).json({ error: 'Failed to fetch resume status' });
  }
};

// =====================================
// LIST RESUMES
// =====================================

/**
 * GET /resume
 * 
 * List all resumes for the authenticated seeker.
 */
export const listResumes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id!;

    const profile = await prisma.seekerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      res.status(404).json({ error: 'Seeker profile not found' });
      return;
    }

    const resumes = await prisma.resume.findMany({
      where: { seekerId: profile.id },
      select: {
        id: true,
        originalName: true,
        fileSize: true,
        status: true,
        createdAt: true,
        processedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ resumes });

  } catch (error) {
    console.error('[ResumeController] List error:', error);
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
};

// =====================================
// GET PARSED DATA
// =====================================

/**
 * GET /resume/:id/parsed
 * 
 * Get the full parsed data for a completed resume.
 */
export const getParsedData = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id!;
    const id = req.params.id as string;

    const profile = await prisma.seekerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      res.status(404).json({ error: 'Seeker profile not found' });
      return;
    }

    const resume = await prisma.resume.findFirst({
      where: {
        id,
        seekerId: profile.id,
        status: 'COMPLETED',
      },
    });

    if (!resume) {
      res.status(404).json({ error: 'Parsed resume not found. It may still be processing.' });
      return;
    }

    res.status(200).json({
      resumeId: resume.id,
      originalName: resume.originalName,
      parsedData: resume.parsedData,
      processedAt: resume.processedAt,
    });

  } catch (error) {
    console.error('[ResumeController] Get parsed data error:', error);
    res.status(500).json({ error: 'Failed to fetch parsed data' });
  }
};

// =====================================
// DELETE RESUME
// =====================================

/**
 * DELETE /resume/:id
 * 
 * Delete a resume record (and optionally the file).
 */
export const deleteResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id!;
    const id = req.params.id as string;

    const profile = await prisma.seekerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      res.status(404).json({ error: 'Seeker profile not found' });
      return;
    }

    const resume = await prisma.resume.findFirst({
      where: {
        id,
        seekerId: profile.id,
      },
    });

    if (!resume) {
      res.status(404).json({ error: 'Resume not found' });
      return;
    }

    // Delete file from disk
    try {
      const fs = await import('fs');
      if (fs.existsSync(resume.filePath)) {
        fs.unlinkSync(resume.filePath);
      }
    } catch (fsErr) {
      console.warn(`[ResumeController] Could not delete file: ${resume.filePath}`, fsErr);
    }

    // Delete DB record
    await prisma.resume.delete({ where: { id: id as string } });

    res.status(200).json({ message: 'Resume deleted successfully' });

  } catch (error) {
    console.error('[ResumeController] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
};
