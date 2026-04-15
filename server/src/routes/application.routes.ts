import { Router } from 'express';
import { requireRole, authenticateClerk } from '../middleware/clerk.middleware';
import { updateApplicationStatus } from '../controllers/application.controller';

const router: Router = Router();

// Endpoint for EMPLOYERS to update status
router.patch('/:id/status', authenticateClerk, requireRole(['EMPLOYER']), updateApplicationStatus);

export default router;
