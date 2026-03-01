import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import passport from 'passport';
import { createApp } from '../../../src/interfaces/http/app.js';
import { InvalidCredentialsError } from '../../../src/domain/auth/errors.js';
import type { RegisterUser } from '../../../src/application/auth/use-cases/RegisterUser.js';
import type { LoginUser } from '../../../src/application/auth/use-cases/LoginUser.js';
import type { TokenProvider } from '../../../src/application/auth/ports/TokenProvider.js';
import type { GoogleOAuthLogin } from '../../../src/application/auth/use-cases/GoogleOAuthLogin.js';
import type { Application } from 'express';

/** Minimal passport Strategy that immediately succeeds with the provided user. */
class MockGoogleStrategy extends passport.Strategy {
  constructor(private readonly user: object) {
    super();
    this.name = 'google';
  }
  authenticate() {
    this.success(this.user);
  }
}

describe('Google OAuth Routes', () => {
  let app: Application;
  let mockRegisterUser: RegisterUser;
  let mockLoginUser: LoginUser;
  let mockTokenProvider: TokenProvider;
  let mockGoogleOAuthLogin: GoogleOAuthLogin;

  beforeEach(() => {
    mockRegisterUser = { execute: vi.fn() } as unknown as RegisterUser;
    mockLoginUser = { execute: vi.fn() } as unknown as LoginUser;
    mockTokenProvider = {
      generate: vi.fn().mockReturnValue('access-token'),
      verify: vi.fn().mockReturnValue({ id: '1', email: 'test@example.com' }),
    };
    mockGoogleOAuthLogin = {
      execute: vi.fn().mockResolvedValue({
        token: 'google-access-token',
        refreshToken: 'google-refresh-token',
        user: { id: 'google-123', email: 'google@example.com', name: 'Google User' },
      }),
    } as unknown as GoogleOAuthLogin;

    app = createApp({
      registerUser: mockRegisterUser,
      loginUser: mockLoginUser,
      tokenProvider: mockTokenProvider,
      googleOAuthLogin: mockGoogleOAuthLogin,
    });
  });

  afterEach(() => {
    // Remove any registered 'google' strategy to avoid cross-test pollution
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (passport as any)._strategies = { ...((passport as any)._strategies ?? {}) };
    delete (passport as any)._strategies['google'];
  });

  describe('GET /auth/google/failure', () => {
    it('should return 401 with failure message', async () => {
      const res = await request(app).get('/auth/google/failure');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Google authentication failed');
    });
  });

  describe('GET /auth/google/callback', () => {
    it('should return 200 with tokens when Google authentication succeeds', async () => {
      passport.use(new MockGoogleStrategy({ id: 'google-123', email: 'google@example.com', name: 'Google User' }));

      const res = await request(app).get('/auth/google/callback');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Google login successful');
      expect(res.body.token).toBe('google-access-token');
    });

    it('should return 501 when googleOAuthLogin is not configured', async () => {
      passport.use(new MockGoogleStrategy({ id: 'google-123', email: 'google@example.com' }));

      const appWithoutOAuth = createApp({
        registerUser: mockRegisterUser,
        loginUser: mockLoginUser,
        tokenProvider: mockTokenProvider,
      });

      const res = await request(appWithoutOAuth).get('/auth/google/callback');
      expect(res.status).toBe(501);
      expect(res.body.success).toBe(false);
    });

    it('should handle errors from googleOAuthLogin and return appropriate response', async () => {
      passport.use(new MockGoogleStrategy({ id: 'google-123', email: 'google@example.com' }));
      vi.mocked(mockGoogleOAuthLogin.execute).mockRejectedValue(new InvalidCredentialsError());

      const res = await request(app).get('/auth/google/callback');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /auth/google', () => {
    it('should have the route registered (not 404)', async () => {
      // The /auth/google route redirects to Google OAuth in production.
      // Without a configured Google strategy the route returns non-404.
      const res = await request(app).get('/auth/google');
      expect(res.status).not.toBe(404);
    });
  });
});
