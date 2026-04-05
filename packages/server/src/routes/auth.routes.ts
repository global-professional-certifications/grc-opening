import { Router } from 'express';
<<<<<<< HEAD
import { registerUser, loginUser } from '../controllers/auth.controller';
=======
import { registerUser, sendOtp, verifyEmail } from '../controllers/auth.controller';
>>>>>>> origin/ayush

const router: Router = Router();

router.post('/register', registerUser);
<<<<<<< HEAD
router.post('/login', loginUser);
=======
router.post('/send-otp', sendOtp);
router.post('/verify-email', verifyEmail);
>>>>>>> origin/ayush

export default router;
