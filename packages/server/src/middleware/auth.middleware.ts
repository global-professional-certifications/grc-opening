import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  id: string;
  role: string;
  email_verified: boolean;
}

/**
 * Validates the JWT Bearer token and securely attaches 'req.user'.
 */
export const validateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authentication token.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;
    
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email_verified: decoded.email_verified,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Token expired or invalid.' });
    return;
  }
};

/**
 * Ensures req.user matches one of the strictly allowed server-side roles.
 * Never trust client-sent strings via payload! Always use the token.
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Failsafe in case requireRole is used without validateJWT
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required to access this resource.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to perform this action.' });
      return;
    }

    next();
  };
};
