import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  console.error('Error:', err);
  
  // Handle known error types
  if (err.name === 'ValidationError') {
    return sendError(res, err.message, 400);
  }
  
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return sendError(res, 'Unauthorized', 401);
  }
  
  if (err.name === 'NotFoundError') {
    return sendError(res, err.message, 404);
  }
  
  // Default to 500
  return sendError(
    res,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    500
  );
};

export const notFoundHandler = (req: Request, res: Response): Response => {
  return sendError(res, `Route ${req.method} ${req.path} not found`, 404);
};

