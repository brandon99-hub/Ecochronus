import { Router } from 'express';
import { listLessons, getLesson, completeLesson, getQuiz, submitQuiz, getProgress } from './learning.controller';
import { authenticateToken } from '../../middlewares/auth';

const router = Router();

router.use(authenticateToken);

router.get('/lessons', listLessons);
router.get('/lessons/:lessonId', getLesson);
router.post('/lessons/:lessonId/complete', completeLesson);
router.get('/quizzes/:quizId', getQuiz);
router.post('/quizzes/:quizId/submit', submitQuiz);
router.get('/progress', getProgress);

export default router;

