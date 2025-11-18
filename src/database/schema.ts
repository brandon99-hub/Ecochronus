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
  type: varchar('type', { length: 50 }).notNull(), // e.g., "photo", "video", "location", "action"
  rewardAmount: integer('reward_amount').notNull(),
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

