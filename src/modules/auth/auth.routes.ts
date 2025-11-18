import { Router } from 'express';
import { signup, login, googleSignIn, refreshToken, logout } from './auth.controller';
import { authenticateToken } from '../../middlewares/auth';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleSignIn);
router.post('/refresh', refreshToken);
router.post('/logout', authenticateToken, logout);

export default router;

