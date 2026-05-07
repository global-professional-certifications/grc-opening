import { Router } from 'express';
import { loginLocal, registerCandidateLocal, registerEmployerLocal } from '../controllers/auth-local.controller';
import { authenticateLocal } from '../middleware/auth-local.middleware';
import { getMe } from '../controllers/auth.controller';
import { authenticateClerk } from '../middleware/clerk.middleware';
import { syncClerkUser } from '../controllers/auth.controller';

const router: Router = Router();

// Local (Database) Auth Routes
router.post('/local/login', loginLocal);
router.post('/local/register-candidate', registerCandidateLocal);
router.post('/local/register-employer', registerEmployerLocal);
router.get('/me', authenticateLocal, getMe);

/* Temporarily disabled Clerk
router.get('/clerk/me', authenticateClerk, getMe);
router.post('/sync', authenticateClerk, syncClerkUser);
*/

export default router;
