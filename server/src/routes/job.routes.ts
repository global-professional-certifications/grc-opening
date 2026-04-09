import { Router } from 'express';
import { requireRole, validateJWT } from '../middleware/auth.middleware';
import { createJob, getEmployerJobs, closeJob, getDashboardStats, getRecentApplicants, getDiscoveryJobs } from '../controllers/job.controller';

const router: Router = Router();

// Endpoint for employers to create a job
router.post('/', validateJWT, requireRole(['EMPLOYER']), createJob);

// Endpoint for employers to view all jobs they've generated
router.get('/my-postings', validateJWT, requireRole(['EMPLOYER']), getEmployerJobs);

// Endpoint for job seeker discovery/feed
router.get('/discover', validateJWT, requireRole(['JOB_SEEKER']), getDiscoveryJobs);

// Endpoint for employer dashboard KPIs (active/closed jobs, applicant totals, shortlisted)
router.get('/stats', validateJWT, requireRole(['EMPLOYER']), getDashboardStats);

// Endpoint for the latest 6 applicants across all employer job postings
router.get('/recent-applicants', validateJWT, requireRole(['EMPLOYER']), getRecentApplicants);

// Endpoint for employers to soft delete/close an active job
router.patch('/:id/close', validateJWT, requireRole(['EMPLOYER']), closeJob);

export default router;
