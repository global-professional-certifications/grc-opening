import { Router } from 'express';
import { authenticateLocal, requireRole } from '../middleware/auth-local.middleware';
import { uploadResumeLocal } from '../middleware/upload.middleware';
import {
  uploadResume,
  getResumeStatus,
  listResumes,
  getParsedData,
  deleteResume,
} from '../controllers/resume.controller';

const router: Router = Router();

// All resume endpoints require authentication + JOB_SEEKER role
router.use(authenticateLocal);
router.use(requireRole(['JOB_SEEKER']));

// ==========================================
// RESUME ROUTES
// ==========================================

// Upload a resume (PDF only, max 5MB)
router.post('/upload', uploadResumeLocal.single('resume'), uploadResume);

// List all resumes for the authenticated user
router.get('/', listResumes);

// Get parsing status for a specific resume
router.get('/:id/status', getResumeStatus);

// Get full parsed data for a completed resume
router.get('/:id/parsed', getParsedData);

// Delete a resume
router.delete('/:id', deleteResume);

export default router;
