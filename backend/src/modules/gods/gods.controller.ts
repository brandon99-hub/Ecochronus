import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { sendSuccess, sendError } from '../../utils/response';
import { validateRequest, selectGodSchema } from '../../utils/validation';
import { db } from '../../database';
import { users } from '../../database/schema';
import { eq } from 'drizzle-orm';

const GODS = {
  zeus: {
    name: 'Zeus',
    description: 'God of Sky and Thunder. Commands lightning and storms.',
    power: 'Thunder Strike',
    color: '#FFD700',
  },
  athena: {
    name: 'Athena',
    description: 'Goddess of Wisdom and Strategy. Master of tactical thinking.',
    power: 'Wisdom Shield',
    color: '#4169E1',
  },
  artemis: {
    name: 'Artemis',
    description: 'Goddess of Nature and Hunting. Protector of forests and wildlife.',
    power: 'Nature\'s Blessing',
    color: '#228B22',
  },
  persephone: {
    name: 'Persephone',
    description: 'Goddess of Spring and Renewal. Brings life back to corrupted lands.',
    power: 'Spring Renewal',
    color: '#FF69B4',
  },
};

export const listGods = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    return sendSuccess(res, {
      gods: Object.entries(GODS).map(([key, value]) => ({
        id: key,
        ...value,
      })),
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to fetch gods', 500);
  }
};

export const getSelectedGod = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const userResults = await db.select({
      selectedGod: users.selectedGod,
    }).from(users).where(eq(users.id, req.userId)).limit(1);

    if (userResults.length === 0) {
      return sendError(res, 'User not found', 404);
    }

    const user = userResults[0];

    if (!user.selectedGod) {
      return sendSuccess(res, { selectedGod: null });
    }

    const godData = GODS[user.selectedGod as keyof typeof GODS];
    if (!godData) {
      return sendSuccess(res, { selectedGod: null });
    }

    return sendSuccess(res, {
      selectedGod: {
        id: user.selectedGod,
        ...godData,
      },
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to fetch selected god', 500);
  }
};

export const selectGod = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const validation = validateRequest(selectGodSchema, req.body);
    if (!validation.success) {
      return sendError(res, validation.error, 400);
    }

    const { god, force } = validation.data;

    const userResults = await db.select({
      selectedGod: users.selectedGod,
    }).from(users).where(eq(users.id, req.userId)).limit(1);

    if (userResults.length === 0) {
      return sendError(res, 'User not found', 404);
    }

    const user = userResults[0];

    if (user.selectedGod === god) {
      return sendError(res, 'You are already aligned with this god', 400);
    }

    if (user.selectedGod && !force) {
      return sendError(res, 'God already selected. Pass force=true to change alignment.', 400);
    }

    const [updatedUser] = await db.update(users)
      .set({ selectedGod: god, updatedAt: new Date() })
      .where(eq(users.id, req.userId))
      .returning({
        id: users.id,
        selectedGod: users.selectedGod,
      });

    const godData = GODS[god as keyof typeof GODS];

    return sendSuccess(res, {
      selectedGod: {
        id: updatedUser.selectedGod,
        ...godData,
      },
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to select god', 500);
  }
};

