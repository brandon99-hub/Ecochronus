import { Router } from 'express';
import { listRewards, getRewardHistory } from './rewards.controller';
import { authenticateToken } from '../../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', listRewards);
router.get('/history', getRewardHistory);

export default router;

