import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateLocal } from '../middleware/auth-local.middleware';
import { analyseResume } from '../controllers/resume-analyser.controller';
import rateLimit from 'express-rate-limit';

const router: Router = Router();

// ==========================================
// AI RESUME ANALYSER ROUTES
// ==========================================

// The AI microservice accepts PDF, DOCX, DOC, and TXT files.
// We need a separate multer config from the regular resume upload
// (which only allows PDF).
const ANALYSER_UPLOADS_DIR = path.join(__dirname, '../../uploads/analyser');
if (!fs.existsSync(ANALYSER_UPLOADS_DIR)) {
  fs.mkdirSync(ANALYSER_UPLOADS_DIR, { recursive: true });
}

const ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword',       // .doc
  'text/plain',               // .txt
];

const analyserUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, ANALYSER_UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `analyse-${unique}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, DOC, and TXT files are allowed.'));
    }
  },
});

const publicRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 requests per window
  message: { error: 'Too many analysis requests from this IP, please try again after 10 minutes' },
  standardHeaders: true, 
  legacyHeaders: false, 
});

// Public endpoint — no authentication required
// Anyone (even without an account) can use the analyser from the home page
router.post(
  '/public/analyse',
  publicRateLimiter,
  analyserUpload.single('resume'),
  analyseResume
);

// Authenticated endpoint — requires login
// Used from the job seeker dashboard
router.post(
  '/analyse',
  authenticateLocal,
  analyserUpload.single('resume'),
  analyseResume
);

export default router;
