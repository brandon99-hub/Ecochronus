import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.accessExpiry,
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiry,
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, jwtConfig.secret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, jwtConfig.refreshSecret) as TokenPayload;
};

