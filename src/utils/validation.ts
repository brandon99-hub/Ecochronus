import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be at most 30 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const googleSignInSchema = z.object({
  idToken: z.string().min(1, 'Google ID token is required'),
});

export const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  email: z.string().email().optional(),
});

export const updateDeviceInfoSchema = z.object({
  deviceId: z.string().optional(),
  deviceInfo: z.record(z.any()).optional(),
});

export const startMissionSchema = z.object({
  missionId: z.string().uuid('Invalid mission ID'),
});

export const updateProgressSchema = z.object({
  missionId: z.string().uuid('Invalid mission ID'),
  progress: z.number().min(0).max(100, 'Progress must be between 0 and 100'),
});

export const completeMissionSchema = z.object({
  missionId: z.string().uuid('Invalid mission ID'),
});

export const getUploadUrlSchema = z.object({
  missionProgressId: z.string().uuid('Invalid mission progress ID'),
  type: z.enum(['photo', 'video'], { errorMap: () => ({ message: 'Type must be photo or video' }) }),
});

export const verifyUploadSchema = z.object({
  proofId: z.string().uuid('Invalid proof ID'),
});

export const validateRequest = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Validation failed' };
  }
};

