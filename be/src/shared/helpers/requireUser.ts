import type { Request } from 'express';
import { User } from '../database';
import { AppError } from './appError';

export async function requireLocalUser(req: Request): Promise<User> {
  if (!req.user?.sub) {
    throw new AppError(401, 'Unauthorized');
  }

  const user = await User.findOne({ where: { cognitoSub: req.user.sub } });
  if (!user) {
    throw new AppError(401, 'Unauthorized');
  }

  return user;
}
