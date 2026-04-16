import { Request, Response, NextFunction } from 'express';
import { ClerkExpressRequireAuth, RequireAuthProp } from '@clerk/clerk-sdk-node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const clerkAuth = ClerkExpressRequireAuth({});

// Ensure the request type has `auth` populated by Clerk
export const mapClerkToDbUser = async (req: RequireAuthProp<Request>, res: Response, next: NextFunction) => {
  try {
    const clerkId = req.auth.userId;

    if (!clerkId) {
      return res.status(401).json({ error: 'No Clerk userId found' });
    }

    // Find the user in our database
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true, emailVerified: true }
    });

    if (!user) {
      // User exists in Clerk but not in our DB yet.
      // We allow this so they can access /auth/sync or /auth/me
      req.user = {
        clerkId,
        role: 'GUEST', // Temporary role until synced
        email_verified: true,
        needsSync: true,
      };
      return next();
    }

    req.user = {
      id: user.id,
      clerkId,
      role: user.role,
      email_verified: user.emailVerified,
      needsSync: false,
    };

    next();
  } catch (error) {
    console.error('Clerk user mapping error:', error);
    res.status(500).json({ error: 'Internal server error during auth mapping' });
  }
};

export const authenticateClerk = (req: Request, res: Response, next: NextFunction) => {
  clerkAuth(req as any, res as any, (err?: any) => {
    if (err) return next(err);
    mapClerkToDbUser(req as any, res, next);
  });
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
