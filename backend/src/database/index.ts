import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Load environment variables
dotenv.config();

// Create connection pool
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

// Disable prepared statements for better compatibility
const client = postgres(connectionString, {
  max: 10,
  prepare: false,
});

// Create Drizzle instance
export const db = drizzle(client, { schema });

export type Database = typeof db;
export * from './schema';

