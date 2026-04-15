import { Router } from 'express';
import { authenticateClerk } from '../middleware/clerk.middleware';
import { registerUser, loginUser, resendVerification, verifyEmail, forgotPassword, resetPassword, syncClerkUser, getMe } from '../controllers/auth.controller';

const router: Router = Router();

router.get('/me', authenticateClerk, getMe);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/resend-verification', resendVerification);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/sync', syncClerkUser);

export default router;
