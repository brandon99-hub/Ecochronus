import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { sendSuccess, sendError } from '../../utils/response';
import { db } from '../../database';
import { badges, userBadges, users, missionProgress } from '../../database/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { issueReward } from '../rewards/rewards.controller';

export const checkAndAwardBadges = async (userId: string): Promise<void> => {
  const userResults = await db.select({
    xp: users.xp,
    level: users.level,
    totalEcoKarma: users.totalEcoKarma,
    corruptionCleared: users.corruptionCleared,
  }).from(users).where(eq(users.id, userId)).limit(1);

  if (userResults.length === 0) {
    return;
  }

  const user = userResults[0];

  const completedMissions = await db.select({ count: sql<number>`count(*)` })
    .from(missionProgress)
    .where(and(
      eq(missionProgress.userId, userId),
      eq(missionProgress.status, 'COMPLETED')
    ));

  const missionsCompleted = Number(completedMissions[0]?.count || 0);

  const allBadges = await db.select().from(badges)
    .where(eq(badges.isActive, true));

  const userBadgeResults = await db.select({ badgeId: userBadges.badgeId })
    .from(userBadges)
    .where(eq(userBadges.userId, userId));

  const earnedBadgeIds = new Set(userBadgeResults.map(ub => ub.badgeId));

  for (const badge of allBadges) {
    if (earnedBadgeIds.has(badge.id)) {
      continue;
    }

    let shouldAward = false;

    switch (badge.requirementType) {
      case 'xp_reached':
        shouldAward = user.xp >= badge.requirementValue;
        break;
      case 'level_reached':
        shouldAward = user.level >= badge.requirementValue;
        break;
      case 'mission_complete':
        shouldAward = missionsCompleted >= badge.requirementValue;
        break;
      case 'corruption_cleared':
        shouldAward = user.corruptionCleared >= badge.requirementValue;
        break;
      case 'eco_karma':
        shouldAward = user.totalEcoKarma >= badge.requirementValue;
        break;
    }

    if (shouldAward) {
      await db.insert(userBadges).values({
        userId,
        badgeId: badge.id,
      });

      if (badge.rewardAmount > 0) {
        try {
          await issueReward(
            userId,
            badge.id,
            badge.rewardAmount,
            'badge_reward',
            { badgeId: badge.id, badgeCode: badge.code }
          );
        } catch (error) {
          console.error(`Failed to issue badge reward for badge ${badge.id}:`, error);
        }
      }
    }
  }
};

export const listBadges = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const allBadges = await db.select().from(badges)
      .where(eq(badges.isActive, true))
      .orderBy(desc(badges.createdAt));

    return sendSuccess(res, { badges: allBadges });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to fetch badges', 500);
  }
};

export const getUserBadges = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const userBadgeResults = await db.select({
      badge: badges,
      earnedAt: userBadges.earnedAt,
    })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, req.userId))
      .orderBy(desc(userBadges.earnedAt));

    return sendSuccess(res, {
      badges: userBadgeResults.map(ub => ({
        ...ub.badge,
        earnedAt: ub.earnedAt,
      })),
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to fetch user badges', 500);
  }
};

export const claimBadge = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const { badgeId } = req.params;

    const badgeResults = await db.select().from(badges)
      .where(and(eq(badges.id, badgeId), eq(badges.isActive, true)))
      .limit(1);

    if (badgeResults.length === 0) {
      return sendError(res, 'Badge not found', 404);
    }

    const badge = badgeResults[0];

    const existingBadge = await db.select().from(userBadges)
      .where(and(
        eq(userBadges.userId, req.userId),
        eq(userBadges.badgeId, badgeId)
      ))
      .limit(1);

    if (existingBadge.length > 0) {
      return sendError(res, 'Badge already earned', 400);
    }

    await db.insert(userBadges).values({
      userId: req.userId,
      badgeId,
    });

    if (badge.rewardAmount > 0) {
      await issueReward(
        req.userId,
        badgeId,
        badge.rewardAmount,
        'badge_reward',
        { badgeId, badgeCode: badge.code }
      );
    }

    return sendSuccess(res, {
      badge: {
        ...badge,
        earnedAt: new Date(),
      },
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to claim badge', 500);
  }
};

