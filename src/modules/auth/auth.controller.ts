import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { sendSuccess, sendError } from '../../utils/response';
import { validateRequest, signupSchema, loginSchema, refreshTokenSchema, logoutSchema, googleSignInSchema } from '../../utils/validation';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, TokenPayload } from '../../utils/jwt';
import { verifyGoogleToken } from '../../utils/googleAuth';
import { db } from '../../database';
import { users, refreshTokens } from '../../database/schema';
import { eq, or } from 'drizzle-orm';

export const signup = async (req: Request, res: Response): Promise<Response> => {
  try {
    const validation = validateRequest(signupSchema, req.body);
    if (!validation.success) {
      return sendError(res, validation.error, 400);
    }

    const { email, username, password } = validation.data;

    // Check if user exists
    const existingUsers = await db.select().from(users).where(or(eq(users.email, email), eq(users.username, username))).limit(1);

    if (existingUsers.length > 0) {
      return sendError(res, 'User with this email or username already exists', 400);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const [user] = await db.insert(users).values({
      email,
      username,
      passwordHash,
    }).returning();

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await db.insert(refreshTokens).values({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    return sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      accessToken,
      refreshToken,
    }, 201);
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Signup failed', 500);
  }
};

export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const validation = validateRequest(loginSchema, req.body);
    if (!validation.success) {
      return sendError(res, validation.error, 400);
    }

    const { email, password } = validation.data;
    const { deviceId, deviceInfo } = req.body;

    // Find user by email
    const userResults = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (userResults.length === 0) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const user = userResults[0];

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Update device info if provided
    if (deviceId || deviceInfo) {
      await db.update(users).set({
        deviceId: deviceId || user.deviceId || null,
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : user.deviceInfo,
        updatedAt: new Date(),
      }).where(eq(users.id, user.id));
    }

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await db.insert(refreshTokens).values({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    return sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Login failed', 500);
  }
};

export const googleSignIn = async (req: Request, res: Response): Promise<Response> => {
  try {
    const validation = validateRequest(googleSignInSchema, req.body);
    if (!validation.success) {
      return sendError(res, validation.error, 400);
    }

    const { idToken } = validation.data;
    const { deviceId, deviceInfo } = req.body;

    // Verify Google token
    const googleUser = await verifyGoogleToken(idToken);

    // Find or create user
    let userResults = await db.select().from(users).where(eq(users.email, googleUser.email)).limit(1);
    let user: typeof userResults[0];

    if (userResults.length === 0) {
      // Create new user from Google account
      const username = googleUser.email.split('@')[0] + '_' + googleUser.sub.substring(0, 8);
      
      // Ensure username is unique
      let uniqueUsername = username;
      let counter = 1;
      while ((await db.select().from(users).where(eq(users.username, uniqueUsername)).limit(1)).length > 0) {
        uniqueUsername = `${username}_${counter}`;
        counter++;
      }

      // Create user without password (Google auth only)
      const [newUser] = await db.insert(users).values({
        email: googleUser.email,
        username: uniqueUsername,
        passwordHash: '', // No password for Google sign-in users
        deviceId: deviceId || null,
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
      }).returning();
      user = newUser;
    } else {
      user = userResults[0];
      // Update device info if provided
      if (deviceId || deviceInfo) {
        const [updatedUser] = await db.update(users).set({
          deviceId: deviceId || user.deviceId || null,
          deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : user.deviceInfo,
          updatedAt: new Date(),
        }).where(eq(users.id, user.id)).returning();
        user = updatedUser;
      }
    }

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(refreshTokens).values({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    return sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Google sign-in failed', 500);
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<Response> => {
  try {
    const validation = validateRequest(refreshTokenSchema, req.body);
    if (!validation.success) {
      return sendError(res, validation.error, 400);
    }

    const { refreshToken: token } = validation.data;

    // Verify refresh token
    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(token);
    } catch (error) {
      return sendError(res, 'Invalid or expired refresh token', 401);
    }

    // Check if token exists in database
    const tokenResults = await db.select().from(refreshTokens).where(eq(refreshTokens.token, token)).limit(1);

    if (tokenResults.length === 0 || tokenResults[0].expiresAt < new Date()) {
      return sendError(res, 'Invalid or expired refresh token', 401);
    }

    const refreshTokenRecord = tokenResults[0];

    // Get user to ensure they still exist
    const userResults = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);

    if (userResults.length === 0) {
      return sendError(res, 'User not found', 404);
    }

    const user = userResults[0];

    // Generate new access token
    const newTokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken = generateAccessToken(newTokenPayload);

    return sendSuccess(res, {
      accessToken,
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Token refresh failed', 500);
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const validation = validateRequest(logoutSchema, req.body);
    if (!validation.success) {
      return sendError(res, validation.error, 400);
    }

    const { refreshToken: token } = validation.data;

    // Delete refresh token
    await db.delete(refreshTokens).where(eq(refreshTokens.token, token));

    return sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Logout failed', 500);
  }
};

