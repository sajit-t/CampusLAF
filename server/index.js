import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import studentRouter from './routes/students.js';
import itemRouter from './routes/items.js';
import claimRouter from './routes/claims.js';
import logsRouter from './routes/logs.js';
import { startWorker } from './worker.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static uploads
const uploadPath = path.resolve('./server/uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}
app.use('/uploads', express.static(uploadPath));

// Mount REST API Routers
app.use('/api/auth', authRouter);
app.use('/api/students', studentRouter);
app.use('/api/items', itemRouter);
app.use('/api/claims', claimRouter);
app.use('/api', logsRouter); // mounts /api/audit-logs and /api/analytics

// Serve Vite frontend build (production configuration)
const distPath = path.resolve('./dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  console.log('Serving production Vite build from dist/');
} else {
  // If dist doesn't exist, we assume it's running in dev mode
  app.get('/', (req, res) => {
    res.json({ message: 'Campus Lost & Found REST API Running. Frontend served by Vite.' });
  });
}

// Only start the worker and listener when running outside Vercel (local dev/production server)
if (!process.env.VERCEL) {
  startWorker();
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;
