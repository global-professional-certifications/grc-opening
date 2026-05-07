import { Router } from 'express';
import { authenticateLocal } from '../middleware/auth-local.middleware';
import {
  getNotifications,
  markOneRead,
  markAllRead,
  deleteNotification
} from '../controllers/notification.controller';

const router = Router();

// All routes require authentication
router.use(authenticateLocal);

router.get('/', getNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markOneRead);
router.delete('/:id', deleteNotification);

export default router;
