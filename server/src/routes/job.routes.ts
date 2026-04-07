import { Router } from 'express';
import { requireRole, validateJWT } from '../middleware/auth.middleware';
import { createJob, getEmployerJobs, closeJob } from '../controllers/job.controller';

const router: Router = Router();

// Endpoint for employers to create a job
router.post('/', validateJWT, requireRole(['EMPLOYER']), createJob);

// Endpoint for employers to view all jobs they've generated
router.get('/my-postings', validateJWT, requireRole(['EMPLOYER']), getEmployerJobs);

// Endpoint for employers to soft delete/close an active job
router.patch('/:id/close', validateJWT, requireRole(['EMPLOYER']), closeJob);

export default router;
