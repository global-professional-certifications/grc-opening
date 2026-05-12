import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure the local uploads directory exists on disk
const UPLOADS_DIR = path.join(__dirname, '../../uploads/resumes');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
const PARSER_UPLOADS_DIR = path.join(__dirname, '../../uploads/resume-parser');
if (!fs.existsSync(PARSER_UPLOADS_DIR)) {
  fs.mkdirSync(PARSER_UPLOADS_DIR, { recursive: true });
}

// Set up local disk storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename: prefix with user ID (if available) and timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `resume-${uniqueSuffix}${ext}`);
  }
});

// Configure the multer upload middleware
export const uploadResumeLocal = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB strict limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'));
    }
  }
});

const parserStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, PARSER_UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `resume-parse-${uniqueSuffix}${ext}`);
  }
});

const PARSER_ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
]);

// Used by profile page resume auto-fill preview flow.
export const uploadResumeForParser = multer({
  storage: parserStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit for parser uploads
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isAllowedExt = ext === '.pdf' || ext === '.doc' || ext === '.docx';

    if (PARSER_ALLOWED_MIMES.has(file.mimetype) || isAllowedExt) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed.'));
    }
  }
});
