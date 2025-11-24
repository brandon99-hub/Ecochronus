import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { sendError } from '../utils/response';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    sendError(res, 'Access token required', 401);
    return;
  }
  
  try {
    const decoded = jwt.verify(token, jwtConfig.secret) as { userId: string; email: string; username: string };
    req.userId = decoded.userId;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      username: decoded.username,
    };
    next();
  } catch (err) {
    sendError(res, 'Invalid or expired token', 401);
    return;
  }
};

