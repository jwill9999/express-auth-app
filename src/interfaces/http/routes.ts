import { Router, RequestHandler, Request, Response } from 'express';
import type { AuthController } from './controllers/AuthController.js';
import type { ProtectedController } from './controllers/ProtectedController.js';
import { authRateLimiter, protectedRateLimiter } from './middleware/rateLimiter.js';

interface RateLimiters {
  authLimiter?: RequestHandler;
  protectedLimiter?: RequestHandler;
}

export function createRoutes(
  authController: AuthController,
  protectedController: ProtectedController,
  limiters?: RateLimiters,
): Router {
  const resolvedLimiters = limiters ?? {
    authLimiter: authRateLimiter,
    protectedLimiter: protectedRateLimiter,
  };
  const router = Router();
  const authMiddleware = resolvedLimiters.authLimiter ? [resolvedLimiters.authLimiter] : [];
  const protectedMiddleware = resolvedLimiters.protectedLimiter
    ? [resolvedLimiters.protectedLimiter]
    : [];

  router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  router.use('/auth', ...authMiddleware, authController.getRouter());
  router.use('/api', ...protectedMiddleware, protectedController.getRouter());
  return router;
}
