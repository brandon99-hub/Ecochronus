// Helper functions for common Drizzle operations
import { db } from './index';
import {
  users,
  refreshTokens,
  missions,
  missionProgress,
  proofs,
  rewards,
  progressStatusEnum,
  proofStatusEnum,
} from './schema';
import { eq, and, or, desc, sql } from 'drizzle-orm';

type ProgressStatus = (typeof progressStatusEnum.enumValues)[number];
type ProofStatus = (typeof proofStatusEnum.enumValues)[number];

// User queries
export const userQueries = {
  findById: (id: string) => db.select().from(users).where(eq(users.id, id)).limit(1),
  
  findByEmail: (email: string) => db.select().from(users).where(eq(users.email, email)).limit(1),
  
  findByUsername: (username: string) => db.select().from(users).where(eq(users.username, username)).limit(1),
  
  findByEmailOrUsername: (email: string, username: string) =>
    db.select().from(users).where(or(eq(users.email, email), eq(users.username, username))).limit(1),
  
  create: (data: { email: string; username: string; passwordHash: string; deviceId?: string | null; deviceInfo?: string | null }) =>
    db.insert(users).values(data).returning(),
  
  update: (id: string, data: Partial<{ email: string; username: string; deviceId: string | null; deviceInfo: string | null }>) =>
    db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id)).returning(),
};

// RefreshToken queries
export const refreshTokenQueries = {
  findByToken: (token: string) => db.select().from(refreshTokens).where(eq(refreshTokens.token, token)).limit(1),
  
  create: (data: { token: string; userId: string; expiresAt: Date }) =>
    db.insert(refreshTokens).values(data).returning(),
  
  delete: (token: string, userId: string) =>
    db.delete(refreshTokens).where(and(eq(refreshTokens.token, token), eq(refreshTokens.userId, userId))),
};

// Mission queries
export const missionQueries = {
  findById: (id: string) => db.select().from(missions).where(eq(missions.id, id)).limit(1),
  
  findActive: (page: number = 1, limit: number = 20) => {
    const skip = (page - 1) * limit;
    return db.select().from(missions)
      .where(eq(missions.isActive, true))
      .orderBy(desc(missions.createdAt))
      .limit(limit)
      .offset(skip);
  },
  
  countActive: () => db.select({ count: sql<number>`count(*)` }).from(missions).where(eq(missions.isActive, true)),
};

// MissionProgress queries
export const missionProgressQueries = {
  findByUserIdAndMissionId: (userId: string, missionId: string) =>
    db.select().from(missionProgress)
      .where(and(eq(missionProgress.userId, userId), eq(missionProgress.missionId, missionId)))
      .limit(1),
  
  findByUserId: (userId: string) =>
    db.select().from(missionProgress).where(eq(missionProgress.userId, userId)),
  
  create: (data: {
    userId: string;
    missionId: string;
    status?: ProgressStatus;
    progress?: number;
    startedAt?: Date | null;
  }) =>
    db.insert(missionProgress).values(data).returning(),
  
  update: (
    id: string,
    data: Partial<{
      status: ProgressStatus;
      progress: number;
      startedAt: Date | null;
      completedAt: Date | null;
    }>
  ) =>
    db.update(missionProgress).set({ ...data, updatedAt: new Date() }).where(eq(missionProgress.id, id)).returning(),
  
  upsert: async (
    userId: string,
    missionId: string,
    data: { status: ProgressStatus; progress: number; startedAt: Date | null }
  ) => {
    const existing = await missionProgressQueries.findByUserIdAndMissionId(userId, missionId);
    if (existing.length > 0) {
      return missionProgressQueries.update(existing[0].id, data);
    } else {
      return missionProgressQueries.create({ userId, missionId, ...data });
    }
  },
};

// Proof queries
export const proofQueries = {
  findById: (id: string) => db.select().from(proofs).where(eq(proofs.id, id)).limit(1),
  
  findByMissionProgressId: (missionProgressId: string) =>
    db.select().from(proofs).where(eq(proofs.missionProgressId, missionProgressId)),
  
  findByMissionProgressIdAndStatus: (missionProgressId: string, status: ProofStatus) =>
    db.select().from(proofs)
      .where(and(eq(proofs.missionProgressId, missionProgressId), eq(proofs.status, status)))
      .orderBy(desc(proofs.createdAt))
      .limit(1),
  
  create: (data: {
    userId: string;
    missionProgressId: string;
    type: string;
    storageUrl: string;
    storageKey: string;
    status?: ProofStatus;
  }) =>
    db.insert(proofs).values(data).returning(),
  
  update: (
    id: string,
    data: Partial<{ status: ProofStatus; antiCheatScore: number | null; verifiedAt: Date | null }>
  ) =>
    db.update(proofs).set({ ...data, updatedAt: new Date() }).where(eq(proofs.id, id)).returning(),
};

// Reward queries
export const rewardQueries = {
  findByUserIdAndMissionProgressId: (userId: string, missionProgressId: string) =>
    db.select().from(rewards)
      .where(and(eq(rewards.userId, userId), eq(rewards.missionProgressId, missionProgressId)))
      .limit(1),
  
  findByUserId: (userId: string, filters?: { type?: string; page?: number; limit?: number }) => {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const whereClause = filters?.type
      ? and(eq(rewards.userId, userId), eq(rewards.type, filters.type))
      : eq(rewards.userId, userId);

    return db
      .select()
      .from(rewards)
      .where(whereClause)
      .orderBy(desc(rewards.issuedAt))
      .limit(limit)
      .offset(skip);
  },
  
  count: (userId: string, filters?: { type?: string }) => {
    if (filters?.type) {
      return db.select({ count: sql<number>`count(*)` })
        .from(rewards)
        .where(and(eq(rewards.userId, userId), eq(rewards.type, filters.type)));
    }
    return db.select({ count: sql<number>`count(*)` }).from(rewards).where(eq(rewards.userId, userId));
  },
  
  create: (data: { userId: string; missionProgressId: string; amount: number; type: string; metadata?: any }) =>
    db.insert(rewards).values(data).returning(),
};

