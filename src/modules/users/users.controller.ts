import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { sendSuccess, sendError } from '../../utils/response';
import { validateRequest, updateProfileSchema, updateDeviceInfoSchema } from '../../utils/validation';
import { db } from '../../database';
import { users } from '../../database/schema';
import { eq, and, or, ne } from 'drizzle-orm';

export const getProfile = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const userResults = await db.select({
      id: users.id,
      email: users.email,
      username: users.username,
      deviceId: users.deviceId,
      deviceInfo: users.deviceInfo,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).where(eq(users.id, req.userId)).limit(1);

    if (userResults.length === 0) {
      return sendError(res, 'User not found', 404);
    }

    const user = userResults[0];
    return sendSuccess(res, {
      ...user,
      deviceInfo: user.deviceInfo ? JSON.parse(user.deviceInfo) : null,
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to fetch profile', 500);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const validation = validateRequest(updateProfileSchema, req.body);
    if (!validation.success) {
      return sendError(res, validation.error, 400);
    }

    const { username, email } = validation.data;

    // Check if username or email already exists (if updating)
    if (username || email) {
      const conditions = [];
      if (username) conditions.push(eq(users.username, username));
      if (email) conditions.push(eq(users.email, email));
      
      if (conditions.length > 0) {
        const existingUsers = await db.select().from(users)
          .where(and(ne(users.id, req.userId), or(...conditions)))
          .limit(1);

        if (existingUsers.length > 0) {
          return sendError(res, 'Username or email already taken', 400);
        }
      }
    }

    const updateData: any = { updatedAt: new Date() };
    if (username) updateData.username = username;
    if (email) updateData.email = email;

    const [user] = await db.update(users).set(updateData)
      .where(eq(users.id, req.userId))
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        deviceId: users.deviceId,
        deviceInfo: users.deviceInfo,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return sendSuccess(res, {
      ...user,
      deviceInfo: user.deviceInfo ? JSON.parse(user.deviceInfo) : null,
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to update profile', 500);
  }
};

export const updateDeviceInfo = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const validation = validateRequest(updateDeviceInfoSchema, req.body);
    if (!validation.success) {
      return sendError(res, validation.error, 400);
    }

    const { deviceId, deviceInfo } = validation.data;

    const updateData: any = { updatedAt: new Date() };
    if (deviceId !== undefined) updateData.deviceId = deviceId || null;
    if (deviceInfo !== undefined) {
      updateData.deviceInfo = deviceInfo ? JSON.stringify(deviceInfo) : null;
    }

    const [user] = await db.update(users).set(updateData)
      .where(eq(users.id, req.userId))
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        deviceId: users.deviceId,
        deviceInfo: users.deviceInfo,
        updatedAt: users.updatedAt,
      });

    return sendSuccess(res, {
      ...user,
      deviceInfo: user.deviceInfo ? JSON.parse(user.deviceInfo) : null,
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to update device info', 500);
  }
};

