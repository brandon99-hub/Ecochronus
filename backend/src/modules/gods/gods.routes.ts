import { Router } from 'express';
import { listGods, getSelectedGod, selectGod } from './gods.controller';
import { authenticateToken } from '../../middlewares/auth';

const router = Router();

router.get('/list', listGods);
router.get('/selected', authenticateToken, getSelectedGod);
router.post('/select', authenticateToken, selectGod);

export default router;

