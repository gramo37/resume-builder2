import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/authMiddleware';
import { authController } from './auth.controller';

export const authRoutes = Router();

authRoutes.post('/register', authController.register);
authRoutes.post('/confirm', authController.confirm);
authRoutes.post('/resend-code', authController.resendCode);
authRoutes.post('/login', authController.login);
authRoutes.post('/refresh', authController.refresh);
authRoutes.post('/forgot-password', authController.forgotPassword);
authRoutes.post('/reset-password', authController.resetPassword);
authRoutes.post('/logout', authMiddleware, authController.logout);
authRoutes.get('/me', authMiddleware, authController.me);
