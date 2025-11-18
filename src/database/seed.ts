import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import * as schema from './schema';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

async function seed() {
  try {
    console.log('Seeding database...');

    // Create test missions
    const missions = [
      {
        title: 'Complete First Mission',
        description: 'Complete your first mission to earn 100 coins',
        type: 'action',
        rewardAmount: 100,
        isActive: true,
        requirements: { minLevel: 1 },
      },
      {
        title: 'Photo Challenge',
        description: 'Take a photo to complete this mission',
        type: 'photo',
        rewardAmount: 200,
        isActive: true,
        requirements: { requiresProof: true },
      },
      {
        title: 'Video Challenge',
        description: 'Record a video to complete this mission',
        type: 'video',
        rewardAmount: 300,
        isActive: true,
        requirements: { requiresProof: true },
      },
      {
        title: 'Daily Login',
        description: 'Log in daily to earn rewards',
        type: 'login',
        rewardAmount: 50,
        isActive: true,
        requirements: {},
      },
    ];

    // Insert missions
    for (const mission of missions) {
      const existing = await db.select().from(schema.missions)
        .where(eq(schema.missions.title, mission.title))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(schema.missions).values(mission);
        console.log(`Created mission: ${mission.title}`);
      } else {
        console.log(`Mission already exists: ${mission.title}`);
      }
    }

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

import { eq } from 'drizzle-orm';

seed();

