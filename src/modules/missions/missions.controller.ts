import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { sendSuccess, sendError } from '../../utils/response';
import { validateRequest, startMissionSchema, updateProgressSchema, completeMissionSchema } from '../../utils/validation';
import { db } from '../../database';
import { missions, missionProgress, proofs } from '../../database/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { issueReward } from '../rewards/rewards.controller';

export const listMissions = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Fetch active missions
    const allMissions = await db.select().from(missions)
      .where(eq(missions.isActive, true))
      .orderBy(desc(missions.createdAt))
      .limit(limit)
      .offset(skip);

    const totalResult = await db.select({ count: sql<number>`count(*)` })
      .from(missions)
      .where(eq(missions.isActive, true));
    const total = Number(totalResult[0]?.count || 0);

    // Fetch user progress for these missions
    const missionIds = allMissions.map(m => m.id);
    const userProgresses = missionIds.length > 0 
      ? await db.select().from(missionProgress)
          .where(and(
            eq(missionProgress.userId, req.userId),
            inArray(missionProgress.missionId, missionIds)
          ))
      : [];

    // Map progress to missions
    const missionsWithProgress = allMissions.map(mission => {
      const progress = userProgresses.find(p => p.missionId === mission.id) || null;
      return {
        id: mission.id,
        title: mission.title,
        description: mission.description,
        type: mission.type,
        rewardAmount: mission.rewardAmount,
        requirements: mission.requirements,
        progress: progress ? {
          id: progress.id,
          status: progress.status,
          progress: progress.progress,
          startedAt: progress.startedAt,
          completedAt: progress.completedAt,
        } : null,
      };
    });

    return sendSuccess(res, {
      missions: missionsWithProgress,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to fetch missions', 500);
  }
};

export const startMission = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const missionId = req.params.missionId;

    // Check if mission exists and is active
    const missionResults = await db.select().from(missions).where(eq(missions.id, missionId)).limit(1);

    if (missionResults.length === 0) {
      return sendError(res, 'Mission not found', 404);
    }

    const mission = missionResults[0];

    if (!mission.isActive) {
      return sendError(res, 'Mission is not active', 400);
    }

    // Check if progress exists, if not create it, else update it
    const existingProgress = await db.select().from(missionProgress)
      .where(and(
        eq(missionProgress.userId, req.userId),
        eq(missionProgress.missionId, missionId)
      ))
      .limit(1);

    let progressResult;
    if (existingProgress.length === 0) {
      // Create new progress
      [progressResult] = await db.insert(missionProgress).values({
        userId: req.userId,
        missionId,
        status: 'IN_PROGRESS',
        progress: 0,
        startedAt: new Date(),
      }).returning();
    } else {
      // Update existing progress
      [progressResult] = await db.update(missionProgress).set({
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(missionProgress.id, existingProgress[0].id))
      .returning();
    }

    return sendSuccess(res, {
      id: progressResult.id,
      missionId: progressResult.missionId,
      status: progressResult.status,
      progress: progressResult.progress,
      startedAt: progressResult.startedAt,
      mission: {
        id: mission.id,
        title: mission.title,
        description: mission.description,
        type: mission.type,
        rewardAmount: mission.rewardAmount,
      },
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to start mission', 500);
  }
};

export const updateProgress = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const missionId = req.params.missionId;
    const validation = validateRequest(updateProgressSchema, { missionId, ...req.body });
    if (!validation.success) {
      return sendError(res, validation.error, 400);
    }

    const { progress } = validation.data;

    // Find MissionProgress record
    const progressResults = await db.select().from(missionProgress)
      .where(and(
        eq(missionProgress.userId, req.userId),
        eq(missionProgress.missionId, missionId)
      ))
      .limit(1);

    if (progressResults.length === 0) {
      return sendError(res, 'Mission progress not found. Start the mission first.', 404);
    }

    const existingProgress = progressResults[0];

    if (existingProgress.status === 'COMPLETED') {
      return sendError(res, 'Mission already completed', 400);
    }

    // Update progress percentage
    const [updatedProgress] = await db.update(missionProgress).set({
      progress,
      status: progress === 100 ? 'PENDING_REVIEW' : 'IN_PROGRESS',
      updatedAt: new Date(),
    })
    .where(eq(missionProgress.id, existingProgress.id))
    .returning();

    // Get mission details
    const missionResults = await db.select({
      id: missions.id,
      title: missions.title,
      description: missions.description,
      type: missions.type,
      rewardAmount: missions.rewardAmount,
    }).from(missions).where(eq(missions.id, missionId)).limit(1);

    const mission = missionResults[0];

    return sendSuccess(res, {
      id: updatedProgress.id,
      missionId: updatedProgress.missionId,
      status: updatedProgress.status,
      progress: updatedProgress.progress,
      mission: mission,
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to update progress', 500);
  }
};

export const completeMission = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const missionId = req.params.missionId;

    // Find MissionProgress record
    const progressResults = await db.select().from(missionProgress)
      .where(and(
        eq(missionProgress.userId, req.userId),
        eq(missionProgress.missionId, missionId)
      ))
      .limit(1);

    if (progressResults.length === 0) {
      return sendError(res, 'Mission progress not found', 404);
    }

    const existingProgress = progressResults[0];

    if (existingProgress.status === 'COMPLETED') {
      return sendError(res, 'Mission already completed', 400);
    }

    // Check if mission progress is at least started
    if (existingProgress.status === 'NOT_STARTED') {
      return sendError(res, 'Mission must be started before completion', 400);
    }

    // Get mission details
    const missionResults = await db.select().from(missions).where(eq(missions.id, missionId)).limit(1);
    if (missionResults.length === 0) {
      return sendError(res, 'Mission not found', 404);
    }
    const mission = missionResults[0];

    // Note: For in-game missions, proof is optional
    // If proof is required in future, check proofs table

    // Update status to COMPLETED
    const [completedProgress] = await db.update(missionProgress).set({
      status: 'COMPLETED',
      progress: 100,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(missionProgress.id, existingProgress.id))
    .returning();

    // Issue rewards
    try {
      await issueReward(
        req.userId,
        completedProgress.id,
        mission.rewardAmount,
        'coins'
      );
    } catch (error) {
      // Log error but don't fail the completion
      console.error('Failed to issue reward:', error);
    }

    return sendSuccess(res, {
      id: completedProgress.id,
      missionId: completedProgress.missionId,
      status: completedProgress.status,
      progress: completedProgress.progress,
      completedAt: completedProgress.completedAt,
      mission: {
        id: mission.id,
        title: mission.title,
        rewardAmount: mission.rewardAmount,
      },
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to complete mission', 500);
  }
};

