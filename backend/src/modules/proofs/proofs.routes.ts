import { Router } from 'express';
import { getUploadUrl, verifyUpload, getProofStatus } from './proofs.controller';
import { authenticateToken } from '../../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.post('/upload-url', getUploadUrl);
router.post('/:proofId/verify', verifyUpload);
router.get('/:proofId/status', getProofStatus);

export default router;

