import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and } from 'drizzle-orm';
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
    console.log('Seeding EcoChronos database...');

    // Create EcoChronos missions
    const missions = [
      {
        title: 'Awakening: Choose Your God',
        description: 'Zeus summons you to Mount Olympus. Choose your divine patron to begin your quest.',
        type: 'story',
        category: 'intro',
        god: 'zeus',
        rewardAmount: 100,
        corruptionLevel: 0,
        isCorruptionMission: false,
        requiresCorruptionCleared: false,
        isActive: true,
        requirements: {},
      },
      {
        title: 'Forest Restoration: First Steps',
        description: 'The ancient forest is corrupted by waste. Clear the corruption and restore Gaia\'s domain.',
        type: 'corruption',
        category: 'forest',
        god: 'artemis',
        region: 'forest_restoration',
        rewardAmount: 200,
        corruptionLevel: 20,
        isCorruptionMission: true,
        requiresCorruptionCleared: false,
        isActive: true,
        requirements: {},
      },
      {
        title: 'River Cleanup: Poseidon\'s Call',
        description: 'Polluted rivers choke the land. Purify the waters under Poseidon\'s guidance.',
        type: 'corruption',
        category: 'river',
        god: 'persephone',
        region: 'river_cleanup',
        rewardAmount: 250,
        corruptionLevel: 25,
        isCorruptionMission: true,
        requiresCorruptionCleared: false,
        isActive: true,
        requirements: {},
      },
      {
        title: 'Urban Pollution: City of Waste',
        description: 'Cities drown in waste. Reclaim the urban areas and restore balance.',
        type: 'corruption',
        category: 'urban',
        god: 'athena',
        region: 'urban_pollution',
        rewardAmount: 300,
        corruptionLevel: 30,
        isCorruptionMission: true,
        requiresCorruptionCleared: false,
        isActive: true,
        requirements: {},
      },
      {
        title: 'Quiz Battle: Eco Knowledge',
        description: 'Test your knowledge about environmental protection in a quiz battle.',
        type: 'quiz',
        category: 'quiz',
        rewardAmount: 150,
        corruptionLevel: 0,
        isCorruptionMission: false,
        requiresCorruptionCleared: false,
        isActive: true,
        requirements: {},
      },
    ];

    console.log('Creating missions...');
    for (const mission of missions) {
      const existing = await db.select().from(schema.missions)
        .where(eq(schema.missions.title, mission.title))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(schema.missions).values(mission);
        console.log(`Created mission: ${mission.title}`);
      }
    }

    // Create lessons
    const lessons = [
      {
        title: 'Introduction to Environmental Protection',
        description: 'Learn the basics of protecting our planet and the role of the gods in maintaining balance.',
        content: {
          slides: [
            { type: 'text', content: 'Welcome to EcoChronos! The gods need your help.' },
            { type: 'text', content: 'Earth is in turmoil - forests burned, oceans choked, cities polluted.' },
            { type: 'text', content: 'Zeus has chosen you as the Earth\'s Avatar to restore balance.' },
          ],
        },
        god: 'zeus',
        order: 1,
        isActive: true,
      },
      {
        title: 'Understanding Forest Conservation',
        description: 'Discover how forests maintain ecological balance and why they need protection.',
        content: {
          slides: [
            { type: 'text', content: 'Forests are the lungs of our planet.' },
            { type: 'text', content: 'They absorb CO2 and produce oxygen.' },
            { type: 'text', content: 'Deforestation leads to climate change and loss of biodiversity.' },
          ],
        },
        god: 'artemis',
        order: 2,
        isActive: true,
      },
      {
        title: 'Water Conservation and Purification',
        description: 'Learn about the importance of clean water and how to protect our water sources.',
        content: {
          slides: [
            { type: 'text', content: 'Water is essential for all life.' },
            { type: 'text', content: 'Pollution threatens our water sources.' },
            { type: 'text', content: 'We must act to protect and conserve water.' },
          ],
        },
        god: 'persephone',
        order: 3,
        isActive: true,
      },
      {
        title: 'Urban Sustainability',
        description: 'Explore how cities can become sustainable and reduce their environmental impact.',
        content: {
          slides: [
            { type: 'text', content: 'Cities consume 75% of global resources.' },
            { type: 'text', content: 'Sustainable urban planning can reduce this impact.' },
            { type: 'text', content: 'Green spaces, recycling, and clean energy are key.' },
          ],
        },
        god: 'athena',
        order: 4,
        isActive: true,
      },
    ];

    console.log('Creating lessons...');
    const lessonIds: string[] = [];
    for (const lesson of lessons) {
      const existing = await db.select().from(schema.lessons)
        .where(eq(schema.lessons.title, lesson.title))
        .limit(1);

      if (existing.length === 0) {
        const [inserted] = await db.insert(schema.lessons).values(lesson).returning({ id: schema.lessons.id });
        if (inserted) lessonIds.push(inserted.id);
        console.log(`Created lesson: ${lesson.title}`);
      } else {
        lessonIds.push(existing[0].id);
      }
    }

    // Create quiz questions for each lesson
    const quizQuestions = [
      // Lesson 1 quiz
      {
        lessonId: lessonIds[0],
        question: 'Who has summoned you to restore balance on Earth?',
        options: ['Poseidon', 'Zeus', 'Artemis', 'Athena'],
        correctAnswer: 1,
        explanation: 'Zeus, the king of gods, has chosen you as Earth\'s Avatar.',
        order: 1,
      },
      {
        lessonId: lessonIds[0],
        question: 'What is the main threat to Earth in EcoChronos?',
        options: ['Aliens', 'Pollution and Destruction', 'Wars', 'Natural Disasters'],
        correctAnswer: 1,
        explanation: 'Pollution and environmental destruction threaten Earth.',
        order: 2,
      },
      // Lesson 2 quiz
      {
        lessonId: lessonIds[1],
        question: 'What do forests primarily absorb from the atmosphere?',
        options: ['Oxygen', 'Nitrogen', 'CO2 (Carbon Dioxide)', 'Helium'],
        correctAnswer: 2,
        explanation: 'Forests absorb CO2 and produce oxygen through photosynthesis.',
        order: 1,
      },
      {
        lessonId: lessonIds[1],
        question: 'What goddess protects forests in EcoChronos?',
        options: ['Athena', 'Artemis', 'Persephone', 'Hera'],
        correctAnswer: 1,
        explanation: 'Artemis is the goddess of nature and forests.',
        order: 2,
      },
      // Lesson 3 quiz
      {
        lessonId: lessonIds[2],
        question: 'Why is clean water essential?',
        options: ['It tastes better', 'It\'s essential for all life', 'It\'s cheaper', 'It looks clearer'],
        correctAnswer: 1,
        explanation: 'Clean water is essential for all forms of life on Earth.',
        order: 1,
      },
      // Lesson 4 quiz
      {
        lessonId: lessonIds[3],
        question: 'What percentage of global resources do cities consume?',
        options: ['50%', '75%', '25%', '90%'],
        correctAnswer: 1,
        explanation: 'Cities consume approximately 75% of global resources.',
        order: 1,
      },
    ];

    console.log('Creating quiz questions...');
    for (const question of quizQuestions) {
      if (!question.lessonId) continue;

      const existing = await db.select().from(schema.quizQuestions)
        .where(
          and(
            eq(schema.quizQuestions.lessonId, question.lessonId),
            eq(schema.quizQuestions.question, question.question)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(schema.quizQuestions).values({
          ...question,
          options: question.options as any,
        });
        console.log(`Created quiz question: ${question.question.substring(0, 50)}...`);
      }
    }

    // Create badges
    const badges = [
      {
        code: 'first_steps',
        name: 'First Steps',
        description: 'Complete your first mission',
        icon: 'first_steps',
        requirementType: 'mission_complete',
        requirementValue: 1,
        rewardAmount: 50,
        isActive: true,
      },
      {
        code: 'forest_guardian',
        name: 'Forest Guardian',
        description: 'Complete 3 forest missions',
        icon: 'forest_guardian',
        requirementType: 'mission_complete',
        requirementValue: 3,
        rewardAmount: 100,
        isActive: true,
      },
      {
        code: 'level_5',
        name: 'Rising Hero',
        description: 'Reach level 5',
        icon: 'level_5',
        requirementType: 'level_reached',
        requirementValue: 5,
        rewardAmount: 200,
        isActive: true,
      },
      {
        code: 'corruption_buster',
        name: 'Corruption Buster',
        description: 'Clear 100 points of corruption',
        icon: 'corruption_buster',
        requirementType: 'corruption_cleared',
        requirementValue: 100,
        rewardAmount: 250,
        isActive: true,
      },
      {
        code: 'eco_warrior',
        name: 'Eco Warrior',
        description: 'Earn 500 eco-karma points',
        icon: 'eco_warrior',
        requirementType: 'eco_karma',
        requirementValue: 500,
        rewardAmount: 300,
        isActive: true,
      },
      {
        code: 'knowledge_seeker',
        name: 'Knowledge Seeker',
        description: 'Complete all lessons',
        icon: 'knowledge_seeker',
        requirementType: 'mission_complete',
        requirementValue: 10,
        rewardAmount: 150,
        isActive: true,
      },
    ];

    console.log('Creating badges...');
    for (const badge of badges) {
      const existing = await db.select().from(schema.badges)
        .where(eq(schema.badges.code, badge.code))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(schema.badges).values(badge);
        console.log(`Created badge: ${badge.name}`);
      }
    }

    console.log('EcoChronos seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
