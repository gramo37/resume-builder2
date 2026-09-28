import cors from 'cors';
import express, { type RequestHandler } from 'express';
import { authRoutes } from './features/auth';
import { resumeRoutes, templateRoutes } from './features/resume';
import { authMiddleware } from './shared/middleware/authMiddleware';
import { errorHandler } from './shared/middleware/errorHandler';

export function createApp(options?: { authenticate?: RequestHandler }) {
  const app = express();
  const authenticate = options?.authenticate ?? authMiddleware;

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ success: true, message: 'ok' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/templates', authenticate, templateRoutes);
  app.use('/api/resumes', authenticate, resumeRoutes);

  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  app.use(errorHandler);

  return app;
}
