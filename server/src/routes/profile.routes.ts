import { Router } from 'express';
import { authenticateLocal, requireRole } from '../middleware/auth-local.middleware';
import {
  getSeekerProfile,
  updateSeekerProfile,
  getEmployerProfile,
  updateEmployerProfile,
  deleteAccount,
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
// ACCOUNT DELETION (any authenticated role)
// ==========================================
router.delete('/me', deleteAccount);

// ==========================================
// EMPLOYER ROUTES
// ==========================================
router.get('/employer', requireRole(['EMPLOYER']), getEmployerProfile);
router.patch('/employer', requireRole(['EMPLOYER']), updateEmployerProfile);

export default router;
