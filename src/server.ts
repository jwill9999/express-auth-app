import express, { Request, Response, NextFunction, Application } from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

// Config
import { config } from './config/env.js';

// Infrastructure
import { connectDB } from './infrastructure/auth/database/mongo.js';
import { MongoUserRepository } from './infrastructure/auth/repositories/MongoUserRepository.js';
import { MongoRefreshSessionRepository } from './infrastructure/auth/repositories/MongoRefreshSessionRepository.js';
import { JwtTokenProvider } from './infrastructure/auth/providers/JwtTokenProvider.js';
import { JwtRefreshTokenProvider } from './infrastructure/auth/providers/JwtRefreshTokenProvider.js';
import { BcryptPasswordHasher } from './infrastructure/auth/providers/BcryptPasswordHasher.js';
import { configurePassport } from './infrastructure/auth/providers/passport.js';
import passport from 'passport';

// Application
import { RegisterUser } from './application/auth/use-cases/RegisterUser.js';
import { LoginUser } from './application/auth/use-cases/LoginUser.js';
import { CreateRefreshSession } from './application/auth/use-cases/CreateRefreshSession.js';
import { GoogleOAuthLogin } from './application/auth/use-cases/GoogleOAuthLogin.js';
import { RefreshSessionUseCase } from './application/auth/use-cases/RefreshSession.js';
import { LogoutCurrentSession } from './application/auth/use-cases/LogoutCurrentSession.js';
import { LogoutAllSessions } from './application/auth/use-cases/LogoutAllSessions.js';
import { AdminRevokeSessions } from './application/auth/use-cases/AdminRevokeSessions.js';

// Interface
import { AuthController } from './interfaces/http/controllers/AuthController.js';
import { ProtectedController } from './interfaces/http/controllers/ProtectedController.js';
import { createAuthMiddleware } from './interfaces/http/middleware/AuthMiddleware.js';
import { createRoutes } from './interfaces/http/routes.js';
import { authRateLimiter, protectedRateLimiter } from './interfaces/http/middleware/rateLimiter.js';
import { swaggerSpec } from './interfaces/http/swagger.js';
import logger from './interfaces/http/middleware/logger.js';

// --- Composition Root ---

const app: Application = express();

// Infrastructure instances
const userRepo = new MongoUserRepository();
const sessionRepo = new MongoRefreshSessionRepository();
const tokenProvider = new JwtTokenProvider(config.jwtSecret, config.jwtExpiresIn);
const refreshTokenProvider = new JwtRefreshTokenProvider(
  config.refreshTokenSecret,
  config.refreshTokenExpiresIn,
);
const passwordHasher = new BcryptPasswordHasher();

// Passport (Google OAuth)
configurePassport(config.google, userRepo);

// Use cases
const createRefreshSession = new CreateRefreshSession(
  sessionRepo,
  refreshTokenProvider,
  config.refreshTokenTtlMs,
);
const registerUser = new RegisterUser(
  userRepo,
  passwordHasher,
  tokenProvider,
  createRefreshSession,
);
const loginUser = new LoginUser(userRepo, passwordHasher, tokenProvider, createRefreshSession);
const refreshSessionUseCase = new RefreshSessionUseCase(
  sessionRepo,
  refreshTokenProvider,
  tokenProvider,
  userRepo,
  config.refreshTokenTtlMs,
);
const logoutCurrentSession = new LogoutCurrentSession(sessionRepo, refreshTokenProvider);
const logoutAllSessions = new LogoutAllSessions(sessionRepo);
const adminRevokeSessions = new AdminRevokeSessions(sessionRepo);
const googleOAuthLogin = new GoogleOAuthLogin(tokenProvider, createRefreshSession);

// Middleware
const authMiddleware = createAuthMiddleware(tokenProvider);

// Controllers
const authController = new AuthController(
  registerUser,
  loginUser,
  tokenProvider,
  refreshSessionUseCase,
  logoutCurrentSession,
  logoutAllSessions,
  adminRevokeSessions,
  googleOAuthLogin,
  config.adminUserIds,
  {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    path: '/auth',
    maxAge: config.refreshTokenTtlMs,
  },
);
const protectedController = new ProtectedController(authMiddleware);

// --- Express Setup ---

logger.combined(app);

app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

// Swagger documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Auth API Documentation',
  }),
);

// Routes
app.use(
  createRoutes(authController, protectedController, {
    authLimiter: config.rateLimitEnabled ? authRateLimiter : undefined,
    protectedLimiter: config.rateLimitEnabled ? protectedRateLimiter : undefined,
  }),
);

/**
 * @swagger
 * /:
 *   get:
 *     summary: API health check
 *     tags: [Health]
 *     description: Returns API status and available endpoints
 *     responses:
 *       200:
 *         description: API is running
 */
app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Auth API is running',
    documentation: `http://localhost:${config.port}/api-docs`,
    endpoints: {
      auth: {
        register: 'POST /auth/register',
        login: 'POST /auth/login',
        refresh: 'POST /auth/refresh',
        logout: 'POST /auth/logout',
        logoutAll: 'POST /auth/logout-all',
        adminRevoke: 'POST /auth/admin/revoke',
        googleLogin: 'GET /auth/google',
        googleCallback: 'GET /auth/google/callback',
      },
      protected: {
        data: 'GET /api/data (requires JWT)',
        profile: 'GET /api/profile (requires JWT)',
      },
    },
  });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (config.nodeEnv === 'development') {
    console.error(err.stack);
  } else {
    console.error(err.message);
  }
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: config.nodeEnv === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

try {
  await connectDB(config.mongoUri);
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    console.log(`Visit http://localhost:${config.port} for API info`);
  });
} catch (err) {
  console.error('Failed to start server:', err);
  process.exit(1);
}
