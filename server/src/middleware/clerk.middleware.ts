import { Request, Response, NextFunction } from 'express';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { PrismaClient } from '@prisma/client';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const prisma = new PrismaClient();

export const authenticateClerk = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Verify the Clerk token
    const decoded = await clerkClient.verifyToken(token);
    const clerkId = decoded.sub;

    // Find the user in our database
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true, emailVerified: true }
    });

    if (!user) {
      // User exists in Clerk but not in our DB yet
      // This might happen if the sync hasn't completed
      return res.status(401).json({ error: 'User not found in database. Sync required.' });
    }

    req.user = {
      id: user.id,
      role: user.role,
      email_verified: user.emailVerified,
    };

    next();
  } catch (error) {
    console.error('Clerk authentication error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    next();
  };
};
