import { Router } from 'express';
import { authenticateLocal, requireRole } from '../middleware/auth-local.middleware';
import {
  getSeekerProfile,
  updateSeekerProfile,
  getEmployerProfile,
  updateEmployerProfile
} from '../controllers/profile.controller';

const router: Router = Router();

// All layout endpoints require authentication
router.use(authenticateLocal);

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
