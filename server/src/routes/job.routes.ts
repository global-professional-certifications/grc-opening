import { Router } from 'express';
import { authenticateLocal, requireRole } from '../middleware/auth-local.middleware';
import { createJob, updateJob, getEmployerJobs, closeJob, getDashboardStats, getRecentApplicants, getDiscoveryJobs, getJobById, saveJob, unsaveJob, getSavedJobs, withdrawJobApplication } from '../controllers/job.controller';
import { applyToJob, reportJob } from '../controllers/application.controller';

const router: Router = Router();

router.post('/', authenticateLocal, requireRole(['EMPLOYER']), createJob);
router.get('/my-postings', authenticateLocal, requireRole(['EMPLOYER']), getEmployerJobs);
router.get('/discover', authenticateLocal, requireRole(['JOB_SEEKER']), getDiscoveryJobs);
router.get('/saved', authenticateLocal, requireRole(['JOB_SEEKER']), getSavedJobs);
router.get('/stats', authenticateLocal, requireRole(['EMPLOYER']), getDashboardStats);
router.get('/recent-applicants', authenticateLocal, requireRole(['EMPLOYER']), getRecentApplicants);
router.patch('/:id/withdraw', authenticateLocal, requireRole(['JOB_SEEKER']), withdrawJobApplication);
router.patch('/:id/close', authenticateLocal, requireRole(['EMPLOYER']), closeJob);
router.patch('/:id', authenticateLocal, requireRole(['EMPLOYER']), updateJob);
router.post('/:id/apply', authenticateLocal, requireRole(['JOB_SEEKER']), applyToJob);
router.post('/:id/report', authenticateLocal, requireRole(['JOB_SEEKER']), reportJob);
router.post('/:id/save', authenticateLocal, requireRole(['JOB_SEEKER']), saveJob);
router.delete('/:id/save', authenticateLocal, requireRole(['JOB_SEEKER']), unsaveJob);
// Must be last to avoid shadowing named routes above
router.get('/:id', authenticateLocal, getJobById);

export default router;
