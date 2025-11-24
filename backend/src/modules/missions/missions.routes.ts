import { Router } from 'express';
import { listMissions, startMission, updateProgress, completeMission } from './missions.controller';
import { authenticateToken } from '../../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', listMissions);
router.post('/:missionId/start', startMission);
router.patch('/:missionId/progress', updateProgress);
router.post('/:missionId/complete', completeMission);

export default router;

