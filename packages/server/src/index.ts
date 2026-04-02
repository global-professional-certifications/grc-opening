import express from 'express';
import { corsMiddleware } from './middleware/cors';
import healthRouter from './routes/health';
import authRouter from './routes/auth.routes';
import profileRouter from './routes/profile.routes';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/profile', profileRouter);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});

export default app;
