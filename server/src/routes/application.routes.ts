import { Router } from 'express';
import { authenticateLocal, requireRole } from '../middleware/auth-local.middleware';
import { updateApplicationStatus } from '../controllers/application.controller';

const router: Router = Router();

// Endpoint for EMPLOYERS to update status
router.patch('/:id/status', authenticateLocal, requireRole(['EMPLOYER']), updateApplicationStatus);

export default router;
