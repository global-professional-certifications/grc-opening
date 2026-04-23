import { Router } from 'express';
import { authenticateLocal, requireRole } from '../middleware/auth-local.middleware';
import { updateApplicationStatus, getMyApplications, getSeekerStats, getEmployerApplications, getApplicationDetail, withdrawApplication } from '../controllers/application.controller';

const router: Router = Router();

// Endpoint for SEEKERS to view their stats
router.get('/stats', authenticateLocal, requireRole(['JOB_SEEKER']), getSeekerStats);


// Endpoint for SEEKERS to view their own applications
router.get('/me', authenticateLocal, requireRole(['JOB_SEEKER']), getMyApplications);

// Endpoint for EMPLOYERS to view all their applications
router.get('/employer', authenticateLocal, requireRole(['EMPLOYER']), getEmployerApplications);

// Endpoint for EMPLOYERS to view a single applicant's full detail
router.get('/:id/detail', authenticateLocal, requireRole(['EMPLOYER']), getApplicationDetail);

// Endpoint for EMPLOYERS to update status
router.patch('/:id/status', authenticateLocal, requireRole(['EMPLOYER']), updateApplicationStatus);

// Endpoint for SEEKERS to withdraw their own application
router.patch('/:id/withdraw', authenticateLocal, requireRole(['JOB_SEEKER']), withdrawApplication);

export default router;
