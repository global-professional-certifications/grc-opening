import { Router } from 'express';
import { requireRole, authenticateClerk } from '../middleware/clerk.middleware';
import {
  getSeekerProfile,
  updateSeekerProfile,
  getEmployerProfile,
  updateEmployerProfile
} from '../controllers/profile.controller';

const router: Router = Router();

// All layout endpoints require authentication
router.use(authenticateClerk);

// ==========================================
// JOB SEEKER ROUTES
// ==========================================
router.get('/seeker', requireRole(['JOB_SEEKER']), getSeekerProfile);
router.patch('/seeker', requireRole(['JOB_SEEKER']), updateSeekerProfile);

// ==========================================
// EMPLOYER ROUTES
// ==========================================
router.get('/employer', requireRole(['EMPLOYER']), getEmployerProfile);
router.patch('/employer', requireRole(['EMPLOYER']), updateEmployerProfile);

export default router;
