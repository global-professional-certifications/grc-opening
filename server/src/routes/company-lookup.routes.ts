import { Router, Request, Response } from 'express';
import { authenticateLocal } from '../middleware/auth-local.middleware';
import { CompanyLookupService } from '../services/company-lookup.service';
import rateLimit from 'express-rate-limit';

const router = Router();
const lookupService = new CompanyLookupService();

// Rate limit: 10 requests per minute per IP to prevent API key bleeding
const lookupRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many lookup requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get(
  '/',
  authenticateLocal,
  lookupRateLimiter,
  async (req: Request, res: Response): Promise<void> => {

    try {
      const q = req.query.q as string;
      if (!q || q.trim().length < 2) {
        res.status(400).json({ error: 'Search query too short. Must be at least 2 characters.' });
        return;
      }

      // Check if user is an employer
      if ((req as any).user?.role !== 'EMPLOYER') {
        res.status(403).json({ error: 'Only employers can use this service.' });
        return;
      }

      const result = await lookupService.lookupCompany(q);

      if (!result) {
        res.status(404).json({ error: 'No company details found.' });
        return;
      }

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('[CompanyLookupRoute] Error:', error);
      res.status(500).json({ error: 'Failed to look up company details.' });
    }

  }
);

export default router;
