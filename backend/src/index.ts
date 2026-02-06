import path from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import { JobRecoveryService } from './services/jobRecovery';

// Load .env from project root when running from backend/
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config(); // Also load backend/.env if present

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server and recover jobs (recovery is non-blocking so server starts even if DB/Redis not ready)
async function startServer() {
  try {
    await JobRecoveryService.recoverPendingJobs();
    console.log('Job recovery complete.');
  } catch (error) {
    console.warn('Job recovery skipped (DB/Redis may not be running):', (error as Error).message);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // Start worker after server is up (so Redis/DB connection errors don't block startup)
    import('./workers/emailWorker').catch((err) => {
      console.warn('Email worker not started (Redis required):', (err as Error).message);
    });
  });
}

startServer();
