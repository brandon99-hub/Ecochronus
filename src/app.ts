import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { replayProtectionMiddleware } from './utils/replayProtection';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import missionsRoutes from './modules/missions/missions.routes';
import proofsRoutes from './modules/proofs/proofs.routes';
import rewardsRoutes from './modules/rewards/rewards.routes';
import godsRoutes from './modules/gods/gods.routes';
import learningRoutes from './modules/learning/learning.routes';
import mapRoutes from './modules/map/map.routes';
import badgesRoutes from './modules/badges/badges.routes';

const createApp = (): Express => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use('/api/', limiter);

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Replay protection middleware
  app.use(replayProtectionMiddleware);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ success: true, data: { status: 'ok' } });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/missions', missionsRoutes);
  app.use('/api/proofs', proofsRoutes);
  app.use('/api/rewards', rewardsRoutes);
  app.use('/api/gods', godsRoutes);
  app.use('/api/learning', learningRoutes);
  app.use('/api/map', mapRoutes);
  app.use('/api/badges', badgesRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;

