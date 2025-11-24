import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
}

const accessSecret: Secret = jwtConfig.secret;
const refreshSecret: Secret = jwtConfig.refreshSecret;

const toSignOptions = (expiresIn: SignOptions['expiresIn']): SignOptions => ({
  expiresIn,
});

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(
    payload,
    accessSecret,
    toSignOptions(jwtConfig.accessExpiry as SignOptions['expiresIn'])
  );
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(
    payload,
    refreshSecret,
    toSignOptions(jwtConfig.refreshExpiry as SignOptions['expiresIn'])
  );
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, accessSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, refreshSecret) as TokenPayload;
};

