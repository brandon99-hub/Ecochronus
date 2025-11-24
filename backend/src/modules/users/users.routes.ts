import { Router } from 'express';
import { getProfile, updateProfile, updateDeviceInfo, getStats } from './users.controller';
import { authenticateToken } from '../../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.post('/device', updateDeviceInfo);
router.get('/stats', getStats);

export default router;

