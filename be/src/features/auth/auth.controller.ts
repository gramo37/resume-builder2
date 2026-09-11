import type { Request, Response } from 'express';
import { AppError } from '../../shared/helpers/appError';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { authService } from './auth.service';

function requireUserId(req: Request): number {
  if (!req.user?.id) {
    throw new AppError(401, 'Unauthorized');
  }
  return req.user.id;
}

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    res.status(200).json({ success: true, data: result });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getProfile(requireUserId(req));
    res.status(200).json({ success: true, data: user });
  }),
};
