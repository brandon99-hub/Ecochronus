import { pgTable, uuid, varchar, text, integer, boolean, jsonb, timestamp, pgEnum, real, unique } from 'drizzle-orm/pg-core';

// Enums
export const progressStatusEnum = pgEnum('progress_status', ['NOT_STARTED', 'IN_PROGRESS', 'PENDING_REVIEW', 'COMPLETED', 'FAILED']);
export const proofStatusEnum = pgEnum('proof_status', ['PENDING', 'APPROVED', 'REJECTED']);

// Tables
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  deviceId: varchar('device_id', { length: 255 }),
  deviceInfo: text('device_info'), // JSON string
  selectedGod: varchar('selected_god', { length: 50 }), // zeus, athena, artemis, persephone
  xp: integer('xp').default(0).notNull(),
  level: integer('level').default(1).notNull(),
  totalEcoKarma: integer('total_eco_karma').default(0).notNull(),
  corruptionCleared: integer('corruption_cleared').default(0).notNull(), // Total corruption cleared
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  token: varchar('token', { length: 500 }).notNull().unique(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const missions = pgTable('missions', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // e.g., "photo", "video", "location", "action", "quiz", "corruption"
  category: varchar('category', { length: 50 }), // "forest", "river", "urban", "quiz", "corruption"
  god: varchar('god', { length: 50 }), // Associated god: "zeus", "athena", "artemis", "persephone"
  region: varchar('region', { length: 50 }), // "forest_restoration", "river_cleanup", "urban_pollution"
  rewardAmount: integer('reward_amount').notNull(),
  corruptionLevel: integer('corruption_level').default(0).notNull(), // How much corruption this clears (0-100)
  isCorruptionMission: boolean('is_corruption_mission').default(false).notNull(),
  requiresCorruptionCleared: boolean('requires_corruption_cleared').default(false).notNull(),
  unlocksAfterMissionId: uuid('unlocks_after_mission_id'), // Mission that unlocks this
  lessonId: uuid('lesson_id'), // Associated lesson in learning hub
  isActive: boolean('is_active').default(true).notNull(),
  requirements: jsonb('requirements'), // JSON for mission-specific requirements
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const missionProgress = pgTable('mission_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  missionId: uuid('mission_id').notNull().references(() => missions.id, { onDelete: 'cascade' }),
  status: progressStatusEnum('status').default('NOT_STARTED').notNull(),
  progress: integer('progress').default(0).notNull(), // 0-100
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueUserMission: unique().on(table.userId, table.missionId),
}));

export const proofs = pgTable('proofs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  missionProgressId: uuid('mission_progress_id').notNull().references(() => missionProgress.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // "photo" or "video"
  storageUrl: text('storage_url').notNull(),
  storageKey: text('storage_key').notNull(),
  status: proofStatusEnum('status').default('PENDING').notNull(),
  antiCheatScore: real('anti_cheat_score'), // 0.0 - 1.0, lower is more suspicious
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const rewards = pgTable('rewards', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  missionProgressId: varchar('mission_progress_id', { length: 255 }).notNull(),
  amount: integer('amount').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // "coins", "points", "item", etc.
  metadata: jsonb('metadata'), // Additional reward data
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
});

export const vouchers = pgTable('vouchers', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  type: varchar('type', { length: 50 }).notNull(),
  value: integer('value').notNull(),
  expiresAt: timestamp('expires_at'),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Learning Hub Tables
export const lessons = pgTable('lessons', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  content: jsonb('content'), // Lesson slides/images/content
  god: varchar('god', { length: 50 }), // Associated god
  order: integer('order').notNull(),
  unlocksMissionId: uuid('unlocks_mission_id'), // Mission unlocked after completion
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const quizQuestions = pgTable('quiz_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  options: jsonb('options').notNull(), // Array of answer options
  correctAnswer: integer('correct_answer').notNull(), // Index of correct answer
  explanation: text('explanation'),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const learningProgress = pgTable('learning_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  completed: boolean('completed').default(false).notNull(),
  quizScore: integer('quiz_score'), // 0-100
  quizAttempts: integer('quiz_attempts').default(0).notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueUserLesson: unique().on(table.userId, table.lessonId),
}));

// Badges System Tables
export const badges = pgTable('badges', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  icon: varchar('icon', { length: 100 }), // Icon identifier
  requirementType: varchar('requirement_type', { length: 50 }).notNull(), // "mission_complete", "xp_reached", "corruption_cleared", etc.
  requirementValue: integer('requirement_value').notNull(),
  rewardAmount: integer('reward_amount').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userBadges = pgTable('user_badges', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  badgeId: uuid('badge_id').notNull().references(() => badges.id, { onDelete: 'cascade' }),
  earnedAt: timestamp('earned_at').defaultNow().notNull(),
}, (table) => ({
  uniqueUserBadge: unique().on(table.userId, table.badgeId),
}));

// Map State Table
export const mapRegions = pgTable('map_regions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  region: varchar('region', { length: 50 }).notNull(), // "forest_restoration", "river_cleanup", "urban_pollution"
  corruptionLevel: integer('corruption_level').default(100).notNull(), // 0-100
  isUnlocked: boolean('is_unlocked').default(false).notNull(),
  missionsCompleted: integer('missions_completed').default(0).notNull(),
  totalMissions: integer('total_missions').default(0).notNull(),
  lastCleared: timestamp('last_cleared'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueUserRegion: unique().on(table.userId, table.region),
}));

