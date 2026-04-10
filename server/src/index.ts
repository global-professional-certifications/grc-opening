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

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});

export default app;
// Force restart
