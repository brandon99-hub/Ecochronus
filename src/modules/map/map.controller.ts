import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { sendSuccess, sendError } from '../../utils/response';
import { validateRequest, clearCorruptionSchema } from '../../utils/validation';
import { db } from '../../database';
import { mapRegions, missions } from '../../database/schema';
import { eq, and, sql } from 'drizzle-orm';

const REGIONS = [
  { id: 'forest_restoration', name: 'Forest Restoration', description: 'Ancient forests corrupted by waste' },
  { id: 'river_cleanup', name: 'River Cleanup', description: 'Polluted rivers need purification' },
  { id: 'urban_pollution', name: 'Urban Pollution', description: 'Cities drowning in waste' },
];

export const listRegions = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const userRegions = await db.select().from(mapRegions)
      .where(eq(mapRegions.userId, req.userId));

    const regionsWithState = REGIONS.map(region => {
      const userRegion = userRegions.find(ur => ur.region === region.id) || null;

      if (!userRegion) {
        return {
          ...region,
          corruptionLevel: 100,
          isUnlocked: false,
          missionsCompleted: 0,
          totalMissions: 0,
        };
      }

      return {
        ...region,
        corruptionLevel: userRegion.corruptionLevel,
        isUnlocked: userRegion.isUnlocked,
        missionsCompleted: userRegion.missionsCompleted,
        totalMissions: userRegion.totalMissions,
        lastCleared: userRegion.lastCleared,
      };
    });

    return sendSuccess(res, { regions: regionsWithState });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to fetch regions', 500);
  }
};

export const getMapState = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const userRegions = await db.select().from(mapRegions)
      .where(eq(mapRegions.userId, req.userId));

    const totalCorruption = userRegions.reduce((sum, r) => sum + r.corruptionLevel, 0);
    const totalRegions = REGIONS.length;
    const averageCorruption = totalRegions > 0 ? Math.round(totalCorruption / totalRegions) : 100;

    const regionsWithState = REGIONS.map(region => {
      const userRegion = userRegions.find(ur => ur.region === region.id) || null;

      return {
        ...region,
        corruptionLevel: userRegion?.corruptionLevel || 100,
        isUnlocked: userRegion?.isUnlocked || false,
        missionsCompleted: userRegion?.missionsCompleted || 0,
        totalMissions: userRegion?.totalMissions || 0,
        lastCleared: userRegion?.lastCleared || null,
      };
    });

    return sendSuccess(res, {
      mapState: {
        averageCorruption,
        totalRegions,
        regions: regionsWithState,
      },
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to fetch map state', 500);
  }
};

export const clearCorruption = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const validation = validateRequest(clearCorruptionSchema, {
      region: req.params.region,
      corruptionCleared: req.body.corruptionCleared,
    });
    if (!validation.success) {
      return sendError(res, validation.error, 400);
    }

    const { region, corruptionCleared } = validation.data;

    if (!REGIONS.find(r => r.id === region)) {
      return sendError(res, 'Invalid region', 400);
    }

    const existingRegion = await db.select().from(mapRegions)
      .where(and(
        eq(mapRegions.userId, req.userId),
        eq(mapRegions.region, region)
      ))
      .limit(1);

    const newCorruptionLevel = existingRegion.length > 0
      ? Math.max(0, existingRegion[0].corruptionLevel - corruptionCleared)
      : Math.max(0, 100 - corruptionCleared);

    if (existingRegion.length > 0) {
      await db.update(mapRegions)
        .set({
          corruptionLevel: newCorruptionLevel,
          lastCleared: new Date(),
          updatedAt: new Date(),
        })
        .where(and(
          eq(mapRegions.userId, req.userId),
          eq(mapRegions.region, region)
        ));
    } else {
      await db.insert(mapRegions).values({
        userId: req.userId,
        region,
        corruptionLevel: newCorruptionLevel,
        isUnlocked: true,
        lastCleared: new Date(),
      });
    }

    return sendSuccess(res, {
      region,
      corruptionLevel: newCorruptionLevel,
      cleared: corruptionCleared,
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to clear corruption', 500);
  }
};

