import { Router } from 'express';
import { requireRole, validateJWT } from '../middleware/auth.middleware';
import { updateApplicationStatus } from '../controllers/application.controller';

const router: Router = Router();

// Endpoint for EMPLOYERS to update status
router.patch('/:id/status', validateJWT, requireRole(['EMPLOYER']), updateApplicationStatus);

export default router;
