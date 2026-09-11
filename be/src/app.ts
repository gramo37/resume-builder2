import cors from 'cors';
import express from 'express';
import { authRoutes } from './features/auth';
import { errorHandler } from './shared/middleware/errorHandler';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ success: true, message: 'ok' });
  });

  app.use('/api/auth', authRoutes);

  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  app.use(errorHandler);

  return app;
}
