import { Router } from 'express';
import { registerUser, loginUser, resendVerification, verifyEmail, forgotPassword, resetPassword } from '../controllers/auth.controller';

const router: Router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/resend-verification', resendVerification);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
