import express, { Request, Response, NextFunction, Application } from 'express';
import cookieParser from 'cookie-parser';
import type { RegisterUser } from '../../application/auth/use-cases/RegisterUser.js';
import type { LoginUser } from '../../application/auth/use-cases/LoginUser.js';
import type { RefreshSessionUseCase } from '../../application/auth/use-cases/RefreshSession.js';
import type { LogoutCurrentSession } from '../../application/auth/use-cases/LogoutCurrentSession.js';
import type { LogoutAllSessions } from '../../application/auth/use-cases/LogoutAllSessions.js';
import type { AdminRevokeSessions } from '../../application/auth/use-cases/AdminRevokeSessions.js';
import type { TokenProvider } from '../../application/auth/ports/TokenProvider.js';
import type { RefreshTokenProvider } from '../../application/auth/ports/RefreshTokenProvider.js';
import type { RefreshSessionRepository } from '../../application/auth/ports/RefreshSessionRepository.js';
import { AuthController } from './controllers/AuthController.js';
import { ProtectedController } from './controllers/ProtectedController.js';
import { createAuthMiddleware } from './middleware/AuthMiddleware.js';
import { createRoutes } from './routes.js';

export interface AppDependencies {
  registerUser: RegisterUser;
  loginUser: LoginUser;
  tokenProvider: TokenProvider;
  refreshSessionUseCase?: RefreshSessionUseCase;
  logoutCurrentSession?: LogoutCurrentSession;
  logoutAllSessions?: LogoutAllSessions;
  adminRevokeSessions?: AdminRevokeSessions;
  refreshTokenProvider?: RefreshTokenProvider;
  sessionRepo?: RefreshSessionRepository;
  refreshTokenTtlMs?: number;
}

export function createApp(deps: AppDependencies): Application {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  const authMiddleware = createAuthMiddleware(deps.tokenProvider);
  const authController = new AuthController(
    deps.registerUser,
    deps.loginUser,
    deps.tokenProvider,
    deps.refreshSessionUseCase,
    deps.logoutCurrentSession,
    deps.logoutAllSessions,
    deps.adminRevokeSessions,
    deps.refreshTokenProvider,
    deps.sessionRepo,
    deps.refreshTokenTtlMs,
  );
  const protectedController = new ProtectedController(authMiddleware);

  app.use(createRoutes(authController, protectedController));

  // Error handling middleware
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  });

  return app;
}
