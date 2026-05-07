import { Router } from 'express';
import { authenticateLocal, requireRole } from '../middleware/auth-local.middleware';
import {
  getAdminStats,
  getAdminUsers,
  updateUserStatus,
  disableUser,
  enableUser,
  getAdminCompanies,
  setCompanyVerification,
  getAdminJobs,
  approveJob,
  rejectJob,
  closeJobAdmin,
  getAdminApplications,
  getAuditLogs,
  getAdminSeekerProfile,
  sendBroadcast,
} from '../controllers/admin.controller';

const router = Router();

router.use(authenticateLocal, requireRole(['ADMIN']));

router.get('/stats',                    getAdminStats);

router.get('/users',                    getAdminUsers);
router.patch('/users/:id/status',       updateUserStatus);
router.patch('/users/:id/disable',      disableUser);
router.patch('/users/:id/enable',       enableUser);

router.get('/companies',                getAdminCompanies);
router.patch('/companies/:id/verify',   setCompanyVerification);

router.get('/jobs',                     getAdminJobs);
router.patch('/jobs/:id/approve',       approveJob);
router.patch('/jobs/:id/reject',        rejectJob);
router.patch('/jobs/:id/close',         closeJobAdmin);

router.get('/applications',             getAdminApplications);
router.get('/seekers/:seekerId',        getAdminSeekerProfile);

router.get('/audit-logs',               getAuditLogs);

router.post('/broadcast',               sendBroadcast);

export default router;
