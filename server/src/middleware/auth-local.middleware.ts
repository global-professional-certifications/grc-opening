import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';


export const authenticateLocal = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Not authenticated (local)' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = String(process.env.JWT_SECRET || 'dev_secret_keys_grc_2026');
    const decoded: any = jwt.verify(token, secret, { algorithms: ['HS256'] });
    req.user = {
      id: decoded.userId,
      role: decoded.role,
      email_verified: true,
      clerkId: undefined
    };
    next();
  } catch (err: any) {
    console.error("[AuthLocalMiddleware] Verification failed:", err.message);
    return res.status(403).json({ error: `Auth failed (local): ${err.message}` });
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
