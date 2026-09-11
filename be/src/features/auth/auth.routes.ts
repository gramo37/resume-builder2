import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/authMiddleware';
import { authController } from './auth.controller';

export const authRoutes = Router();

authRoutes.post('/register', authController.register);
authRoutes.post('/login', authController.login);
authRoutes.get('/me', authMiddleware, authController.me);
