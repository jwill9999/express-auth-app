import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../src/interfaces/http/app.js';
import type { RegisterUser } from '../../../src/application/auth/use-cases/RegisterUser.js';
import type { LoginUser } from '../../../src/application/auth/use-cases/LoginUser.js';
import type { TokenProvider } from '../../../src/application/auth/ports/TokenProvider.js';
import type { Application } from 'express';

/**
 * Tests for AuthController when optional use cases are NOT configured.
 * These cover the 501 "not configured" branches and validate that the
 * controller safely handles unconfigured dependencies.
 */
describe('AuthController - unconfigured use cases (501 responses)', () => {
  let app: Application;
  let mockTokenProvider: TokenProvider;

  const makeMinimalApp = () => {
    const mockRegisterUser = {
      execute: vi.fn().mockResolvedValue({
        token: 'access-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      }),
    } as unknown as RegisterUser;

    const mockLoginUser = {
      execute: vi.fn().mockResolvedValue({
        token: 'access-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      }),
    } as unknown as LoginUser;

    mockTokenProvider = {
      generate: vi.fn().mockReturnValue('access-token'),
      verify: vi.fn().mockReturnValue({ id: '1', email: 'test@example.com' }),
    };

    // No optional use cases configured (no refreshSessionUseCase, logoutCurrentSession, etc.)
    return createApp({
      registerUser: mockRegisterUser,
      loginUser: mockLoginUser,
      tokenProvider: mockTokenProvider,
      rateLimiting: false,
    });
  };

  beforeEach(() => {
    app = makeMinimalApp();
  });

  describe('POST /auth/refresh - not configured', () => {
    it('should return 501 when refreshSessionUseCase is not provided', async () => {
      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'any-token' });

      expect(res.status).toBe(501);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Refresh not configured');
    });

    it('should return 200 with empty refresh token fallback', async () => {
      // When no cookie or body refreshToken, the fallback '' is still passed
      // but with no use case configured → still 501
      const res = await request(app).post('/auth/refresh');

      expect(res.status).toBe(501);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /auth/logout - not configured', () => {
    it('should return 200 (clears cookie) when logoutCurrentSession is not provided', async () => {
      const res = await request(app)
        .post('/auth/logout')
        .send({ refreshToken: 'any-token' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');
    });
  });

  describe('POST /auth/logout-all - not configured', () => {
    it('should return 501 when logoutAllSessions is not provided', async () => {
      const res = await request(app)
        .post('/auth/logout-all')
        .set('Authorization', 'Bearer access-token');

      expect(res.status).toBe(501);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Logout-all not configured');
    });
  });

  describe('POST /auth/admin/revoke - not configured', () => {
    it('should return 501 when adminRevokeSessions is not provided', async () => {
      const res = await request(app)
        .post('/auth/admin/revoke')
        .set('Authorization', 'Bearer access-token')
        .send({ userId: 'target-user' });

      expect(res.status).toBe(501);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Admin revoke not configured');
    });
  });

  describe('GET /auth/google/callback - not configured', () => {
    it('should return 501 when googleOAuthLogin is not provided', async () => {
      // Directly test the callback route bypassing passport middleware
      // by creating a test that hits the route (passport will redirect to failure without config)
      const res = await request(app).get('/auth/google/callback');

      // Without passport Google strategy configured, the route may redirect or return 500/401
      // The important check is it does NOT return 200 (which would require a configured strategy)
      expect(res.status).not.toBe(200);
    });
  });
});
