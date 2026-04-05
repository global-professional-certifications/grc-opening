import { Router } from 'express';
import { registerUser, loginUser, sendOtp, verifyEmail } from '../controllers/auth.controller';

const router: Router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/send-otp', sendOtp);
router.post('/verify-email', verifyEmail);

export default router;
