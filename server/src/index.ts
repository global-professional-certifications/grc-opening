import dotenv from 'dotenv';
import { validateEnv } from './config/env';

dotenv.config();
validateEnv();

import express from 'express';
import { corsMiddleware } from './middleware/cors';
import healthRouter from './routes/health';
import authRouter from './routes/auth.routes';
import profileRouter from './routes/profile.routes';
import jobRouter from './routes/job.routes';
import applicationRouter from './routes/application.routes';
import adminRouter from './routes/admin.routes';
import { adminLogin } from './controllers/admin.controller';
import resumeRouter from './routes/resume.routes';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to the GRC Openings API',
    status: 'online',
    version: '1.0.0',
    documentation: 'https://github.com/grc-opening/grc-opening' // Placeholder for future docs
  });
});

app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/profile', profileRouter);
app.use('/jobs', jobRouter);
app.use('/applications', applicationRouter);
app.post('/admin/login', adminLogin);   // public — registered before auth middleware
app.use('/admin', adminRouter);
app.use('/resume', resumeRouter);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);

  // Start the resume worker inline for development convenience.
  // In production, run the worker as a separate process:
  //   npx tsx src/worker/resume.worker.ts
  if (process.env.INLINE_WORKER !== 'false') {
    const { isRedisAvailable } = require('./config/redis');
    isRedisAvailable().then((available: boolean) => {
      if (available) {
        const { startResumeWorker } = require('./worker/resume.worker');
        startResumeWorker();
        console.log(`   Resume worker: running inline`);
      } else {
        console.log(`   Resume worker: ⏸ skipped (Redis not available)`);
        console.log(`     → Resume upload works, but parsing is deferred until Redis is running.`);
        console.log(`     → To install Redis: https://redis.io/download`);
      }
    });
  }
});

export default app;
