import type { Request, Response } from 'express';
import { AppError } from '../../shared/helpers/appError';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { authService } from './auth.service';

function requireAccessContext(req: Request): { sub: string; accessToken: string } {
  if (!req.user?.sub || !req.accessToken) {
    throw new AppError(401, 'Unauthorized');
  }

  return { sub: req.user.sub, accessToken: req.accessToken };
}

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  }),

  confirm: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.confirm(req.body);
    res.status(200).json({ success: true, data: result });
  }),

  resendCode: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.resendCode(req.body);
    res.status(200).json({ success: true, data: result });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    res.status(200).json({ success: true, data: result });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.refresh(req.body);
    res.status(200).json({ success: true, data: result });
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.forgotPassword(req.body);
    res.status(200).json({ success: true, data: result });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.resetPassword(req.body);
    res.status(200).json({ success: true, data: result });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const { accessToken } = requireAccessContext(req);
    const result = await authService.logout(accessToken);
    res.status(200).json({ success: true, data: result });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const { sub, accessToken } = requireAccessContext(req);
    const user = await authService.getProfile(sub, accessToken);
    res.status(200).json({ success: true, data: user });
  }),
};
