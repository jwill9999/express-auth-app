import express, { Request, Response, NextFunction, Application } from 'express';
import type { RegisterUser } from '../../application/auth/use-cases/RegisterUser.js';
import type { LoginUser } from '../../application/auth/use-cases/LoginUser.js';
import type { TokenProvider } from '../../application/auth/ports/TokenProvider.js';
import { AuthController } from './controllers/AuthController.js';
import { ProtectedController } from './controllers/ProtectedController.js';
import { createAuthMiddleware } from './middleware/AuthMiddleware.js';
import { createRoutes } from './routes.js';

export interface AppDependencies {
  registerUser: RegisterUser;
  loginUser: LoginUser;
  tokenProvider: TokenProvider;
}

export function createApp(deps: AppDependencies): Application {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const authMiddleware = createAuthMiddleware(deps.tokenProvider);
  const authController = new AuthController(deps.registerUser, deps.loginUser, deps.tokenProvider);
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
