import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

async function createTables() {
  try {
    console.log('Creating tables...');

    // Create enums first
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE progress_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'PENDING_REVIEW', 'COMPLETED', 'FAILED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE proof_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        device_id VARCHAR(255),
        device_info TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create refresh_tokens table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token VARCHAR(500) NOT NULL UNIQUE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create missions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS missions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        reward_amount INTEGER NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        requirements JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create mission_progress table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS mission_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
        status progress_status NOT NULL DEFAULT 'NOT_STARTED',
        progress INTEGER NOT NULL DEFAULT 0,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, mission_id)
      );
    `);

    // Create proofs table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS proofs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mission_progress_id UUID NOT NULL REFERENCES mission_progress(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        storage_url TEXT NOT NULL,
        storage_key TEXT NOT NULL,
        status proof_status NOT NULL DEFAULT 'PENDING',
        anti_cheat_score REAL,
        verified_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create rewards table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS rewards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mission_progress_id VARCHAR(255) NOT NULL,
        amount INTEGER NOT NULL,
        type VARCHAR(50) NOT NULL,
        metadata JSONB,
        issued_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create vouchers table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS vouchers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(100) NOT NULL UNIQUE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        type VARCHAR(50) NOT NULL,
        value INTEGER NOT NULL,
        expires_at TIMESTAMP,
        used_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log('All tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTables();

