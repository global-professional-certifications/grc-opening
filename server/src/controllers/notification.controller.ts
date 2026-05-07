import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { purgeExpiredNotifications } from '../services/notification.service';

const prisma = new PrismaClient();

// ==========================================
// GET /notifications?page=&limit=&unread=
// ==========================================
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page = '1', limit = '20', unread } = req.query;

    // 1. Lazy purge of expired notifications
    await purgeExpiredNotifications().catch(console.error);

    // 2. Build where clause
    const where: any = {
      userId,
      expiresAt: { gt: new Date() } // Only non-expired
    };

    if (unread === 'true') {
      where.isRead = false;
    }

    const skip = (Number(page) - 1) * Number(limit);

    // 3. Query
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId,
          expiresAt: { gt: new Date() },
          isRead: false
        }
      })
    ]);

    res.json({
      notifications,
      total,
      unreadCount,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// PATCH /notifications/:id/read
// ==========================================
export const markOneRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    if (notification.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// PATCH /notifications/read-all
// ==========================================
export const markAllRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// DELETE /notifications/:id
// ==========================================
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    if (notification.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
