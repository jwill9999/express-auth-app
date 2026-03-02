import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import type { RegisterUser } from '../../../application/auth/use-cases/RegisterUser.js';
import type { LoginUser } from '../../../application/auth/use-cases/LoginUser.js';
import type { RefreshSessionUseCase } from '../../../application/auth/use-cases/RefreshSession.js';
import type { LogoutCurrentSession } from '../../../application/auth/use-cases/LogoutCurrentSession.js';
import type { LogoutAllSessions } from '../../../application/auth/use-cases/LogoutAllSessions.js';
import type { AdminRevokeSessions } from '../../../application/auth/use-cases/AdminRevokeSessions.js';
import type { TokenProvider } from '../../../application/auth/ports/TokenProvider.js';
import type { GoogleOAuthLogin } from '../../../application/auth/use-cases/GoogleOAuthLogin.js';
import { User } from '../../../domain/auth/User.js';
import {
  InvalidCredentialsError,
  UserAlreadyExistsError,
  ValidationError,
  SessionNotFoundError,
  SessionExpiredError,
  SessionRevokedError,
  TokenReuseDetectedError,
} from '../../../domain/auth/errors.js';
import { validate } from '../validation/validate.js';
import { registerSchema, loginSchema, adminRevokeSchema } from '../validation/schemas.js';

const adminRevokeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 admin revoke requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  maxAge: number;
}

export class AuthController {
  private readonly router: Router;

  constructor(
    private readonly registerUser: RegisterUser,
    private readonly loginUser: LoginUser,
    private readonly tokenProvider: TokenProvider,
    private readonly refreshSessionUseCase?: RefreshSessionUseCase,
    private readonly logoutCurrentSession?: LogoutCurrentSession,
    private readonly logoutAllSessions?: LogoutAllSessions,
    private readonly adminRevokeSessions?: AdminRevokeSessions,
    private readonly googleOAuthLogin?: GoogleOAuthLogin,
    private readonly adminUserIds?: string[],
    private readonly cookieOptions?: CookieOptions,
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  getRouter(): Router {
    return this.router;
  }

  private getRefreshCookieOptions(): CookieOptions {
    return (
      this.cookieOptions ?? {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        path: '/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }
    );
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    const opts = this.getRefreshCookieOptions();
    res.cookie('refreshToken', refreshToken, opts);
  }

  private clearRefreshTokenCookie(res: Response): void {
    const opts = this.getRefreshCookieOptions();
    res.clearCookie('refreshToken', {
      httpOnly: opts.httpOnly,
      secure: opts.secure,
      sameSite: opts.sameSite,
      path: opts.path,
    });
  }

  private setupRoutes(): void {
    /**
     * @swagger
     * /auth/register:
     *   post:
     *     summary: Register a new user
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/RegisterRequest'
     *     responses:
     *       201:
     *         description: User registered successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AuthResponse'
     *       400:
     *         description: Validation error or user already exists
     *       429:
     *         description: Too many requests (5 per 15 minutes)
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/RateLimitError'
     *       500:
     *         description: Server error
     */
    this.router.post('/register', validate(registerSchema), this.register.bind(this));

    /**
     * @swagger
     * /auth/login:
     *   post:
     *     summary: Login with email and password
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/LoginRequest'
     *     responses:
     *       200:
     *         description: Login successful
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AuthResponse'
     *       401:
     *         description: Invalid credentials
     *       429:
     *         description: Too many requests (5 per 15 minutes)
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/RateLimitError'
     *       500:
     *         description: Server error
     */
    this.router.post('/login', validate(loginSchema), this.login.bind(this));

    /**
     * @swagger
     * /auth/refresh:
     *   post:
     *     summary: Refresh access token
     *     description: >
     *       Issues a new access token and rotates the refresh token. The refresh token is
     *       read from the `refreshToken` cookie (preferred) or the request body. A new
     *       `refreshToken` HttpOnly cookie is set in the response.
     *     tags: [Authentication]
     *     parameters:
     *       - in: cookie
     *         name: refreshToken
     *         schema:
     *           type: string
     *         description: Refresh token cookie (takes precedence over request body).
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               refreshToken:
     *                 type: string
     *                 description: Refresh token (used when cookie is not present).
     *     responses:
     *       200:
     *         description: Tokens refreshed successfully. A new `refreshToken` cookie is set.
     *         headers:
     *           Set-Cookie:
     *             description: New HttpOnly refresh token cookie.
     *             schema:
     *               type: string
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AuthResponse'
     *       401:
     *         description: Invalid, expired, or revoked refresh token.
     *       500:
     *         description: Server error.
     */
    this.router.post('/refresh', this.refresh.bind(this));

    /**
     * @swagger
     * /auth/logout:
     *   post:
     *     summary: Logout current session
     *     description: >
     *       Logs out the current session. Accepts an optional refresh token provided either
     *       in the request body or as a cookie. If no token is provided, the endpoint
     *       still responds with success to allow idempotent logout behavior.
     *     tags: [Authentication]
     *     parameters:
     *       - in: cookie
     *         name: refreshToken
     *         required: false
     *         schema:
     *           type: string
     *         description: Optional refresh token cookie for the current session.
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               refreshToken:
     *                 type: string
     *                 description: Optional refresh token to revoke from the request body.
     *     responses:
     *       200:
     *         description: Logged out successfully (even if no refresh token was provided)
     */
    this.router.post('/logout', this.logout.bind(this));

    /**
     * @swagger
     * /auth/logout-all:
     *   post:
     *     summary: Logout all sessions for the authenticated user
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: All sessions revoked
     *       401:
     *         description: Unauthorized
     */
    this.router.post('/logout-all', this.logoutAll.bind(this));

    /**
     * @swagger
     * /auth/admin/revoke:
     *   post:
     *     summary: Admin revoke all sessions for a user
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [userId]
     *             properties:
     *               userId:
     *                 type: string
     *     responses:
     *       200:
     *         description: User sessions revoked
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized – missing or invalid token
     *       403:
     *         description: Forbidden – caller is not an admin
     */
    this.router.post(
      '/admin/revoke',
      validate(adminRevokeSchema),
      adminRevokeLimiter,
      this.adminRevoke.bind(this),
    );

    /**
     * @swagger
     * /auth/google:
     *   get:
     *     summary: Initiate Google OAuth login
     *     tags: [Authentication]
     *     responses:
     *       302:
     *         description: Redirect to Google OAuth
     */
    this.router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

    /**
     * @swagger
     * /auth/google/callback:
     *   get:
     *     summary: Google OAuth callback
     *     tags: [Authentication]
     *     responses:
     *       200:
     *         description: Google login successful
     */
    this.router.get(
      '/google/callback',
      passport.authenticate('google', {
        failureRedirect: '/auth/google/failure',
        session: false,
      }),
      this.googleCallback.bind(this),
    );

    this.router.get('/google/failure', (_req: Request, res: Response): void => {
      res.status(401).json({ success: false, message: 'Google authentication failed' });
    });
  }

  private async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.registerUser.execute(req.body);
      if (result.refreshToken) {
        this.setRefreshTokenCookie(res, result.refreshToken);
      }
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  private async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.loginUser.execute(req.body);
      if (result.refreshToken) {
        this.setRefreshTokenCookie(res, result.refreshToken);
      }
      res.json({
        success: true,
        message: 'Login successful',
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  private async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!this.refreshSessionUseCase) {
        res.status(501).json({ success: false, message: 'Refresh not configured' });
        return;
      }

      const refreshToken =
        (req.cookies as Record<string, string> | undefined)?.refreshToken ||
        (req.body as { refreshToken?: string })?.refreshToken ||
        '';

      const result = await this.refreshSessionUseCase.execute({ refreshToken });
      this.setRefreshTokenCookie(res, result.refreshToken);
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        token: result.accessToken,
        user: result.user,
      });
    } catch (error) {
      this.clearRefreshTokenCookie(res);
      this.handleError(error, res, next);
    }
  }

  private async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!this.logoutCurrentSession) {
        this.clearRefreshTokenCookie(res);
        res.json({ success: true, message: 'Logged out successfully' });
        return;
      }

      const refreshToken =
        (req.cookies as Record<string, string> | undefined)?.refreshToken ||
        (req.body as { refreshToken?: string })?.refreshToken;

      if (refreshToken) {
        try {
          await this.logoutCurrentSession.execute({ refreshToken });
        } catch {
          // Swallow errors — user is logging out regardless
        }
      }

      this.clearRefreshTokenCookie(res);
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      this.clearRefreshTokenCookie(res);
      this.handleError(error, res, next);
    }
  }

  private async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!this.logoutAllSessions) {
        res.status(501).json({ success: false, message: 'Logout-all not configured' });
        return;
      }

      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      if (!accessToken) {
        res.status(401).json({ success: false, message: 'No token provided' });
        return;
      }

      const decoded = this.tokenProvider.verify(accessToken);
      if (!decoded) {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
        return;
      }

      await this.logoutAllSessions.execute(decoded.id);
      this.clearRefreshTokenCookie(res);
      res.json({ success: true, message: 'All sessions revoked' });
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  private async adminRevoke(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!this.adminRevokeSessions) {
        res.status(501).json({ success: false, message: 'Admin revoke not configured' });
        return;
      }

      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      if (!accessToken) {
        res.status(401).json({ success: false, message: 'No token provided' });
        return;
      }

      const decoded = this.tokenProvider.verify(accessToken);
      if (!decoded) {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
        return;
      }

      if (!this.adminUserIds?.includes(decoded.id)) {
        res.status(403).json({ success: false, message: 'Forbidden: admin access required' });
        return;
      }

      await this.adminRevokeSessions.execute(req.body);
      res.json({ success: true, message: 'User sessions revoked' });
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  private async googleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!this.googleOAuthLogin) {
        res.status(501).json({ success: false, message: 'Google OAuth not configured' });
        return;
      }

      const user = req.user as User;
      const result = await this.googleOAuthLogin.execute(user);

      if (result.refreshToken) {
        this.setRefreshTokenCookie(res, result.refreshToken);
      }

      res.json({
        success: true,
        message: 'Google login successful',
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  private handleError(error: unknown, res: Response, next: NextFunction): void {
    if (error instanceof ValidationError) {
      res.status(400).json({ success: false, message: error.message });
    } else if (error instanceof UserAlreadyExistsError) {
      res.status(400).json({ success: false, message: error.message });
    } else if (error instanceof InvalidCredentialsError) {
      res.status(401).json({ success: false, message: error.message });
    } else if (error instanceof SessionNotFoundError) {
      res.status(401).json({ success: false, message: error.message });
    } else if (error instanceof SessionExpiredError) {
      res.status(401).json({ success: false, message: error.message });
    } else if (error instanceof SessionRevokedError) {
      res.status(401).json({ success: false, message: error.message });
    } else if (error instanceof TokenReuseDetectedError) {
      res.status(401).json({ success: false, message: error.message });
    } else {
      next(error);
    }
  }
}
