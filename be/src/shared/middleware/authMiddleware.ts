import type { RequestHandler } from 'express';
import { AppError } from '../helpers/appError';
import { verifyToken } from '../helpers/jwt';

export const authMiddleware: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    next(new AppError(401, 'Missing or invalid authorization header'));
    return;
  }

  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
  }
};
