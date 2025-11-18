import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as schema from './schema';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

async function runMigrations() {
  try {
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();

