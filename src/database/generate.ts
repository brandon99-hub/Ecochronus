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
        selected_god VARCHAR(50),
        xp INTEGER NOT NULL DEFAULT 0,
        level INTEGER NOT NULL DEFAULT 1,
        total_eco_karma INTEGER NOT NULL DEFAULT 0,
        corruption_cleared INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Add new columns to existing users table if they don't exist
    console.log('Migrating users table...');
    await db.execute(sql`
      DO $$ 
      BEGIN
        -- Add selected_god column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='selected_god') THEN
          ALTER TABLE users ADD COLUMN selected_god VARCHAR(50);
        END IF;
        
        -- Add xp column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='xp') THEN
          ALTER TABLE users ADD COLUMN xp INTEGER NOT NULL DEFAULT 0;
        END IF;
        
        -- Add level column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='level') THEN
          ALTER TABLE users ADD COLUMN level INTEGER NOT NULL DEFAULT 1;
        END IF;
        
        -- Add total_eco_karma column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='total_eco_karma') THEN
          ALTER TABLE users ADD COLUMN total_eco_karma INTEGER NOT NULL DEFAULT 0;
        END IF;
        
        -- Add corruption_cleared column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='corruption_cleared') THEN
          ALTER TABLE users ADD COLUMN corruption_cleared INTEGER NOT NULL DEFAULT 0;
        END IF;
      END $$;
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
        category VARCHAR(50),
        god VARCHAR(50),
        region VARCHAR(50),
        reward_amount INTEGER NOT NULL,
        corruption_level INTEGER NOT NULL DEFAULT 0,
        is_corruption_mission BOOLEAN NOT NULL DEFAULT false,
        requires_corruption_cleared BOOLEAN NOT NULL DEFAULT false,
        unlocks_after_mission_id UUID,
        lesson_id UUID,
        is_active BOOLEAN NOT NULL DEFAULT true,
        requirements JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Add new columns to existing missions table if they don't exist
    console.log('Migrating missions table...');
    await db.execute(sql`
      DO $$ 
      BEGIN
        -- Add category column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='missions' AND column_name='category') THEN
          ALTER TABLE missions ADD COLUMN category VARCHAR(50);
        END IF;
        
        -- Add god column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='missions' AND column_name='god') THEN
          ALTER TABLE missions ADD COLUMN god VARCHAR(50);
        END IF;
        
        -- Add region column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='missions' AND column_name='region') THEN
          ALTER TABLE missions ADD COLUMN region VARCHAR(50);
        END IF;
        
        -- Add corruption_level column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='missions' AND column_name='corruption_level') THEN
          ALTER TABLE missions ADD COLUMN corruption_level INTEGER NOT NULL DEFAULT 0;
        END IF;
        
        -- Add is_corruption_mission column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='missions' AND column_name='is_corruption_mission') THEN
          ALTER TABLE missions ADD COLUMN is_corruption_mission BOOLEAN NOT NULL DEFAULT false;
        END IF;
        
        -- Add requires_corruption_cleared column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='missions' AND column_name='requires_corruption_cleared') THEN
          ALTER TABLE missions ADD COLUMN requires_corruption_cleared BOOLEAN NOT NULL DEFAULT false;
        END IF;
        
        -- Add unlocks_after_mission_id column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='missions' AND column_name='unlocks_after_mission_id') THEN
          ALTER TABLE missions ADD COLUMN unlocks_after_mission_id UUID;
        END IF;
        
        -- Add lesson_id column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='missions' AND column_name='lesson_id') THEN
          ALTER TABLE missions ADD COLUMN lesson_id UUID;
        END IF;
      END $$;
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

    // Create lessons table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS lessons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        content JSONB,
        god VARCHAR(50),
        "order" INTEGER NOT NULL,
        unlocks_mission_id UUID,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create quiz_questions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS quiz_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_answer INTEGER NOT NULL,
        explanation TEXT,
        "order" INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create learning_progress table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS learning_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        completed BOOLEAN NOT NULL DEFAULT false,
        quiz_score INTEGER,
        quiz_attempts INTEGER NOT NULL DEFAULT 0,
        completed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, lesson_id)
      );
    `);

    // Create badges table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS badges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        icon VARCHAR(100),
        requirement_type VARCHAR(50) NOT NULL,
        requirement_value INTEGER NOT NULL,
        reward_amount INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create user_badges table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_badges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
        earned_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, badge_id)
      );
    `);

    // Create map_regions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS map_regions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        region VARCHAR(50) NOT NULL,
        corruption_level INTEGER NOT NULL DEFAULT 100,
        is_unlocked BOOLEAN NOT NULL DEFAULT false,
        missions_completed INTEGER NOT NULL DEFAULT 0,
        total_missions INTEGER NOT NULL DEFAULT 0,
        last_cleared TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, region)
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

