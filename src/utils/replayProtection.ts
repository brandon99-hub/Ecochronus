import { Request, Response, NextFunction } from 'express';

// Simple in-memory store for nonce tracking
// In production, use Redis or similar for distributed systems
const usedNonces = new Map<string, number>();

const NONCE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_NONCE_AGE = NONCE_EXPIRY_MS;

export interface ReplayProtectionRequest extends Request {
  nonce?: string;
  timestamp?: number;
}

export const generateNonce = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

export const verifyNonce = (nonce: string, timestamp: number): boolean => {
  const now = Date.now();
  
  // Check if nonce was already used
  if (usedNonces.has(nonce)) {
    return false;
  }
  
  // Check if timestamp is too old
  if (now - timestamp > MAX_NONCE_AGE) {
    return false;
  }
  
  // Check if timestamp is in the future (clock skew)
  if (timestamp > now + 60000) { // 1 minute tolerance
    return false;
  }
  
  // Mark nonce as used
  usedNonces.set(nonce, now);
  
  // Clean up old nonces periodically
  if (usedNonces.size > 10000) {
    const cutoff = now - MAX_NONCE_AGE;
    for (const [key, value] of usedNonces.entries()) {
      if (value < cutoff) {
        usedNonces.delete(key);
      }
    }
  }
  
  return true;
};

export const replayProtectionMiddleware = (
  req: ReplayProtectionRequest,
  res: Response,
  next: NextFunction
): void => {
  const nonce = req.headers['x-nonce'] as string;
  const timestamp = parseInt(req.headers['x-timestamp'] as string, 10);
  
  // Only enforce for state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    if (!nonce || !timestamp || isNaN(timestamp)) {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid nonce/timestamp headers',
      });
      return;
    }
    
    if (!verifyNonce(nonce, timestamp)) {
      res.status(400).json({
        success: false,
        error: 'Invalid or replayed request',
      });
      return;
    }
    
    req.nonce = nonce;
    req.timestamp = timestamp;
  }
  
  next();
};

