import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateLocal } from '../middleware/auth-local.middleware';
import { checkResume } from '../controllers/resume-checker.controller';
import rateLimit from 'express-rate-limit';

const router: Router = Router();

const CHECKER_UPLOADS_DIR = path.join(__dirname, '../../uploads/checker');
if (!fs.existsSync(CHECKER_UPLOADS_DIR)) {
  fs.mkdirSync(CHECKER_UPLOADS_DIR, { recursive: true });
}

const ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain', // .txt
];

const checkerUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, CHECKER_UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `check-${unique}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and TXT files are allowed.'));
    }
  },
});

const publicRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { error: 'Too many check requests from this IP, please try again after 10 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public endpoint
router.post(
  '/public/check',
  publicRateLimiter,
  checkerUpload.single('resume'),
  checkResume
);

// Authenticated endpoint
router.post(
  '/check',
  authenticateLocal,
  checkerUpload.single('resume'),
  checkResume
);

export default router;
