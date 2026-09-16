import type { RequestHandler } from 'express';
import { accessTokenVerifier } from '../aws/cognito';
import { AppError } from '../helpers/appError';

export const authMiddleware: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    next(new AppError(401, 'Missing or invalid authorization header'));
    return;
  }

  const accessToken = header.slice(7);

  try {
    const payload = await accessTokenVerifier.verify(accessToken);
    req.user = {
      sub: payload.sub,
      username: payload.username,
    };
    req.accessToken = accessToken;
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
  }
};
