import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { sendSuccess, sendError } from '../../utils/response';
import { validateRequest, completeLessonSchema, submitQuizSchema } from '../../utils/validation';
import { db } from '../../database';
import { lessons, quizQuestions, learningProgress } from '../../database/schema';
import { eq, and, asc, sql, inArray } from 'drizzle-orm';
import { calculateLevelFromXP, getXPProgress } from '../../utils/xp';
import { issueReward } from '../rewards/rewards.controller';

export const listLessons = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const allLessons = await db.select().from(lessons)
      .where(eq(lessons.isActive, true))
      .orderBy(asc(lessons.order));

    const lessonIds = allLessons.map(l => l.id);
    const userProgress = lessonIds.length > 0
      ? await db.select().from(learningProgress)
          .where(and(
            eq(learningProgress.userId, req.userId),
            inArray(learningProgress.lessonId, lessonIds)
          ))
      : [];

    const lessonsWithProgress = allLessons.map(lesson => {
      const progress = userProgress.find(p => p.lessonId === lesson.id) || null;
      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        god: lesson.god,
        order: lesson.order,
        unlocked: true,
        completed: progress?.completed || false,
        quizScore: progress?.quizScore || null,
        quizAttempts: progress?.quizAttempts || 0,
      };
    });

    return sendSuccess(res, { lessons: lessonsWithProgress });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to fetch lessons', 500);
  }
};

export const getLesson = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const { lessonId } = req.params;

    const lessonResults = await db.select().from(lessons)
      .where(and(eq(lessons.id, lessonId), eq(lessons.isActive, true)))
      .limit(1);

    if (lessonResults.length === 0) {
      return sendError(res, 'Lesson not found', 404);
    }

    const lesson = lessonResults[0];

    const progressResults = await db.select().from(learningProgress)
      .where(and(
        eq(learningProgress.userId, req.userId),
        eq(learningProgress.lessonId, lessonId)
      ))
      .limit(1);

    const progress = progressResults[0] || null;

    return sendSuccess(res, {
      lesson: {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        content: lesson.content,
        god: lesson.god,
        order: lesson.order,
        progress: progress ? {
          completed: progress.completed,
          quizScore: progress.quizScore,
          quizAttempts: progress.quizAttempts,
        } : null,
      },
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to fetch lesson', 500);
  }
};

export const completeLesson = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const validation = validateRequest(completeLessonSchema, { lessonId: req.params.lessonId });
    if (!validation.success) {
      return sendError(res, validation.error, 400);
    }

    const { lessonId } = validation.data;

    const lessonResults = await db.select().from(lessons)
      .where(and(eq(lessons.id, lessonId), eq(lessons.isActive, true)))
      .limit(1);

    if (lessonResults.length === 0) {
      return sendError(res, 'Lesson not found', 404);
    }

    const existingProgress = await db.select().from(learningProgress)
      .where(and(
        eq(learningProgress.userId, req.userId),
        eq(learningProgress.lessonId, lessonId)
      ))
      .limit(1);

    if (existingProgress.length > 0 && existingProgress[0].completed) {
      return sendError(res, 'Lesson already completed', 400);
    }

    if (existingProgress.length > 0) {
      await db.update(learningProgress)
        .set({
          completed: true,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(
          eq(learningProgress.userId, req.userId),
          eq(learningProgress.lessonId, lessonId)
        ));
    } else {
      await db.insert(learningProgress).values({
        userId: req.userId,
        lessonId,
        completed: true,
        completedAt: new Date(),
      });
    }

    return sendSuccess(res, { message: 'Lesson completed successfully' });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to complete lesson', 500);
  }
};

export const getQuiz = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const { quizId } = req.params;

    const questions = await db.select().from(quizQuestions)
      .where(eq(quizQuestions.lessonId, quizId))
      .orderBy(asc(quizQuestions.order));

    if (questions.length === 0) {
      return sendError(res, 'Quiz not found', 404);
    }

    return sendSuccess(res, {
      quiz: {
        lessonId: quizId,
        questions: questions.map(q => ({
          id: q.id,
          question: q.question,
          options: q.options,
          order: q.order,
        })),
      },
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to fetch quiz', 500);
  }
};

export const submitQuiz = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const validation = validateRequest(submitQuizSchema, {
      quizId: req.params.quizId,
      answers: req.body.answers,
    });
    if (!validation.success) {
      return sendError(res, validation.error, 400);
    }

    const { quizId, answers } = validation.data;

    const questions = await db.select().from(quizQuestions)
      .where(eq(quizQuestions.lessonId, quizId))
      .orderBy(asc(quizQuestions.order));

    if (questions.length === 0) {
      return sendError(res, 'Quiz not found', 404);
    }

    if (answers.length !== questions.length) {
      return sendError(res, 'Number of answers must match number of questions', 400);
    }

    let correctCount = 0;
    const results = questions.map((q, index) => {
      const isCorrect = answers[index] === q.correctAnswer;
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        isCorrect,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      };
    });

    const score = Math.round((correctCount / questions.length) * 100);

    const existingProgress = await db.select().from(learningProgress)
      .where(and(
        eq(learningProgress.userId, req.userId),
        eq(learningProgress.lessonId, quizId)
      ))
      .limit(1);

    if (existingProgress.length > 0) {
      await db.update(learningProgress)
        .set({
          quizScore: score,
          quizAttempts: sql`${learningProgress.quizAttempts} + 1`,
          completed: score >= 70,
          completedAt: score >= 70 ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(and(
          eq(learningProgress.userId, req.userId),
          eq(learningProgress.lessonId, quizId)
        ));
    } else {
      await db.insert(learningProgress).values({
        userId: req.userId,
        lessonId: quizId,
        quizScore: score,
        quizAttempts: 1,
        completed: score >= 70,
        completedAt: score >= 70 ? new Date() : null,
      });
    }

    return sendSuccess(res, {
      score,
      passed: score >= 70,
      results,
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to submit quiz', 500);
  }
};

export const getProgress = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const userProgress = await db.select().from(learningProgress)
      .where(eq(learningProgress.userId, req.userId));

    const totalLessons = await db.select({ count: sql<number>`count(*)` })
      .from(lessons)
      .where(eq(lessons.isActive, true));

    const completedLessons = userProgress.filter(p => p.completed).length;
    const totalLessonsCount = Number(totalLessons[0]?.count || 0);

    return sendSuccess(res, {
      progress: {
        completedLessons,
        totalLessons: totalLessonsCount,
        completionPercent: totalLessonsCount > 0 
          ? Math.round((completedLessons / totalLessonsCount) * 100)
          : 0,
        averageQuizScore: userProgress.length > 0
          ? Math.round(userProgress.reduce((sum, p) => sum + (p.quizScore || 0), 0) / userProgress.length)
          : 0,
      },
    });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'Failed to fetch progress', 500);
  }
};

