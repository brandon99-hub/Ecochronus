import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { sendSuccess, sendError } from '../../utils/response';
import { validateRequest, getUploadUrlSchema, verifyUploadSchema } from '../../utils/validation';
import { getSignedUploadUrl, verifyFileExists, getFileMetadata } from '../../utils/storage';
import { storageConfig } from '../../config/storage';
import { db } from '../../database';
import { missionProgress, proofs, missions } from '../../database/schema';
import { eq, and, desc } from 'drizzle-orm';
import { runAntiCheatChecks } from '../../utils/antiCheat';

// Get signed upload URL for proof upload
export const getUploadUrl = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const validation = validateRequest(getUploadUrlSchema, req.body);
    if (!validation.success) {
      return sendError(res, validation.error, 400);
    }

    const { missionProgressId, type } = validation.data;

    // Verify mission progress exists and belongs to user
    const progressResults = await db.select().from(missionProgress)
      .where(eq(missionProgress.id, missionProgressId))
      .limit(1);

    if (progressResults.length === 0) {
      return sendError(res, 'Mission progress not found', 404);
    }

    const progress = progressResults[0];

    if (progress.userId !== req.userId) {
      return sendError(res, 'Unauthorized access to mission progress', 403);
    }

    // Generate storage key and get signed URL
    const fileName = `${type}-${Date.now()}.${type === 'photo' ? 'jpg' : 'mp4'}`;
    const contentType = type === 'photo' ? 'image/jpeg' : 'video/mp4';

    const { uploadUrl, storageKey, expiresAt } = await getSignedUploadUrl({
      fileName,
      contentType,
      expiresIn: 3600, // 1 hour
    });

    // Create Proof record with PENDING status
    const [proof] = await db.insert(proofs).values({
      userId: req.userId,
      missionProgressId,
      type,
      storageUrl: `gs://${storageConfig.google.bucketName}/${storageKey}`, // Placeholder URL
      storageKey,
      status: 'PENDING',
    }).returning();

    return sendSuccess(res, {
      proofId: proof.id,
      uploadUrl,
      expiresAt,
      storageKey,
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to get upload URL', 500);
  }
};

// Verify uploaded proof and run anti-cheat checks
export const verifyUpload = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const proofId = req.params.proofId;
    const validation = validateRequest(verifyUploadSchema, { proofId });
    if (!validation.success) {
      return sendError(res, validation.error, 400);
    }

    // Fetch proof record
    const proofResults = await db.select().from(proofs)
      .where(eq(proofs.id, proofId))
      .limit(1);

    if (proofResults.length === 0) {
      return sendError(res, 'Proof not found', 404);
    }

    const proof = proofResults[0];

    if (proof.userId !== req.userId) {
      return sendError(res, 'Unauthorized access to proof', 403);
    }

    // Check if file exists in storage
    const fileExists = await verifyFileExists(proof.storageKey);
    if (!fileExists) {
      return sendError(res, 'Uploaded file not found in storage', 404);
    }

    // Get file metadata for anti-cheat checks
    const fileMetadata = await getFileMetadata(proof.storageKey);

    // Run anti-cheat checks (basic checks for MVP)
    const antiCheatResult = await runAntiCheatChecks({
      proofId: proof.id,
      type: proof.type,
      storageKey: proof.storageKey,
      metadata: fileMetadata,
    });

    // Update proof status based on anti-cheat score
    // Score closer to 1.0 = more legitimate, closer to 0.0 = more suspicious
    let newStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';
    if (antiCheatResult.score >= 0.7) {
      newStatus = 'APPROVED';
    } else if (antiCheatResult.score < 0.3) {
      newStatus = 'REJECTED';
    }

    const [updatedProof] = await db.update(proofs).set({
      status: newStatus,
      antiCheatScore: antiCheatResult.score,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(proofs.id, proofId))
    .returning();

    // Update MissionProgress status to PENDING_REVIEW if proof is approved
    if (newStatus === 'APPROVED') {
      await db.update(missionProgress).set({
        status: 'PENDING_REVIEW',
        updatedAt: new Date(),
      })
      .where(eq(missionProgress.id, proof.missionProgressId));
    }

    return sendSuccess(res, {
      proofId: updatedProof.id,
      status: updatedProof.status,
      antiCheatScore: updatedProof.antiCheatScore,
      verifiedAt: updatedProof.verifiedAt,
      checks: antiCheatResult.checks,
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to verify upload', 500);
  }
};

// Get proof status
export const getProofStatus = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const proofId = req.params.proofId;

    // Fetch proof from database
    const proofResults = await db.select().from(proofs)
      .where(eq(proofs.id, proofId))
      .limit(1);

    if (proofResults.length === 0) {
      return sendError(res, 'Proof not found', 404);
    }

    const proof = proofResults[0];

    if (proof.userId !== req.userId) {
      return sendError(res, 'Unauthorized access to proof', 403);
    }

    // Get mission progress and mission
    const progressResults = await db.select().from(missionProgress)
      .where(eq(missionProgress.id, proof.missionProgressId))
      .limit(1);
    
    const progress = progressResults[0];
    
    const missionResults = await db.select({
      id: missions.id,
      title: missions.title,
      type: missions.type,
    }).from(missions).where(eq(missions.id, progress.missionId)).limit(1);
    
    const mission = missionResults[0];

    return sendSuccess(res, {
      id: proof.id,
      type: proof.type,
      status: proof.status,
      antiCheatScore: proof.antiCheatScore,
      verifiedAt: proof.verifiedAt,
      createdAt: proof.createdAt,
      missionProgress: {
        id: progress.id,
        status: progress.status,
        mission: mission,
      },
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to fetch proof status', 500);
  }
};

