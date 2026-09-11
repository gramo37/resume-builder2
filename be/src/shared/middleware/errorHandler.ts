import type { ErrorRequestHandler } from 'express';
import { AppError } from '../helpers/appError';
import { env } from '../../config/env';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
    return;
  }

  console.error(err);

  res.status(500).json({
    success: false,
    message: env.isDev && err instanceof Error ? err.message : 'Internal server error',
  });
};
