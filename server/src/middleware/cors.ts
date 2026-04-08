import cors from 'cors';

export const corsMiddleware = cors({
  origin: [
    'http://localhost:3000', // Next.js dev server
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
