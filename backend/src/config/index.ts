import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
};

export { default as db } from './database';
export { jwtConfig } from './jwt';
export { storageConfig, googleOAuthConfig } from './storage';

