import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.post('/test', (req, res) => res.json({ ok: true }));

const server = app.listen(4001, () => {
  setTimeout(() => server.close(), 2000);
});
