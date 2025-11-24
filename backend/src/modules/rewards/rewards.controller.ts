import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { sendSuccess, sendError } from '../../utils/response';
import { db } from '../../database';
import { rewards, users } from '../../database/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';

// Issue reward with duplicate prevention by missionProgressId
export const issueReward = async (
  userId: string,
  missionProgressId: string,
  amount: number,
  type: string,
  metadata?: any
): Promise<void> => {
  // Check if reward already issued for this mission progress (duplicate prevention)
  const existingRewards = await db.select().from(rewards)
    .where(and(
      eq(rewards.userId, userId),
      eq(rewards.missionProgressId, missionProgressId)
    ))
    .limit(1);

  if (existingRewards.length > 0) {
    throw new Error('Reward already issued for this mission');
  }

  // Create Reward record
  await db.insert(rewards).values({
    userId,
    missionProgressId,
    amount,
    type,
    metadata: metadata || null,
  });

  // Log reward issuance (console for MVP, can be enhanced with proper logging service)
  console.log(`Reward issued: User ${userId}, MissionProgress ${missionProgressId}, Amount ${amount}, Type ${type}`);
};

// List user's rewards with pagination
export const listRewards = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const type = req.query.type as string | undefined;

    const conditions = [eq(rewards.userId, req.userId)];
    if (type) {
      conditions.push(eq(rewards.type, type));
    }
    const whereClause = and(...conditions);

    const [rewardsList, totalResult] = await Promise.all([
      db.select().from(rewards).where(whereClause).orderBy(desc(rewards.issuedAt)).limit(limit).offset(skip),
      db.select({ count: sql<number>`count(*)` }).from(rewards).where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    return sendSuccess(res, {
      rewards: rewardsList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to fetch rewards', 500);
  }
};

// Get reward history with filters
export const getRewardHistory = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const type = req.query.type as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const conditions: any[] = [eq(rewards.userId, req.userId)];
    
    if (type) {
      conditions.push(eq(rewards.type, type));
    }

    if (startDate) {
      conditions.push(gte(rewards.issuedAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(rewards.issuedAt, new Date(endDate)));
    }

    const whereClause = and(...conditions);

    const [rewardsList, totalResult] = await Promise.all([
      db.select({
        id: rewards.id,
        userId: rewards.userId,
        missionProgressId: rewards.missionProgressId,
        amount: rewards.amount,
        type: rewards.type,
        metadata: rewards.metadata,
        issuedAt: rewards.issuedAt,
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
        },
      })
      .from(rewards)
      .leftJoin(users, eq(rewards.userId, users.id))
      .where(whereClause)
      .orderBy(desc(rewards.issuedAt))
      .limit(limit)
      .offset(skip),
      db.select({ count: sql<number>`count(*)` }).from(rewards).where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    return sendSuccess(res, {
      rewards: rewardsList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to fetch reward history', 500);
  }
};

