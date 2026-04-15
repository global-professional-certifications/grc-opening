import { Router } from 'express';
import { requireRole, authenticateClerk } from '../middleware/clerk.middleware';
import { createJob, getEmployerJobs, closeJob, getDashboardStats, getRecentApplicants, getDiscoveryJobs } from '../controllers/job.controller';

const router: Router = Router();

// Endpoint for employers to create a job
router.post('/', authenticateClerk, requireRole(['EMPLOYER']), createJob);

// Endpoint for employers to view all jobs they've generated
router.get('/my-postings', authenticateClerk, requireRole(['EMPLOYER']), getEmployerJobs);

// Endpoint for job seeker discovery/feed
router.get('/discover', authenticateClerk, requireRole(['JOB_SEEKER']), getDiscoveryJobs);

// Endpoint for employer dashboard KPIs (active/closed jobs, applicant totals, shortlisted)
router.get('/stats', authenticateClerk, requireRole(['EMPLOYER']), getDashboardStats);

// Endpoint for the latest 6 applicants across all employer job postings
router.get('/recent-applicants', authenticateClerk, requireRole(['EMPLOYER']), getRecentApplicants);

// Endpoint for employers to soft delete/close an active job
router.patch('/:id/close', authenticateClerk, requireRole(['EMPLOYER']), closeJob);

export default router;
