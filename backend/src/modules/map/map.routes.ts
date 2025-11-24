import { Router } from 'express';
import { listRegions, getMapState, clearCorruption } from './map.controller';
import { authenticateToken } from '../../middlewares/auth';

const router = Router();

router.use(authenticateToken);

router.get('/regions', listRegions);
router.get('/state', getMapState);
router.post('/regions/:region/clear-corruption', clearCorruption);

export default router;

