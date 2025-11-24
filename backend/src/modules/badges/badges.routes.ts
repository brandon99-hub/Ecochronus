import { Router } from 'express';
import { listBadges, getUserBadges, claimBadge } from './badges.controller';
import { authenticateToken } from '../../middlewares/auth';

const router = Router();

router.get('/', listBadges);
router.get('/user', authenticateToken, getUserBadges);
router.post('/:badgeId/claim', authenticateToken, claimBadge);

export default router;

