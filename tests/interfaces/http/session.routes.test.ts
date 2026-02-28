import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../src/interfaces/http/app.js';
import {
  SessionNotFoundError,
  SessionExpiredError,
  TokenReuseDetectedError,
  ValidationError,
} from '../../../src/domain/auth/errors.js';
import type { RegisterUser } from '../../../src/application/auth/use-cases/RegisterUser.js';
import type { LoginUser } from '../../../src/application/auth/use-cases/LoginUser.js';
import type { RefreshSessionUseCase } from '../../../src/application/auth/use-cases/RefreshSession.js';
import type { LogoutCurrentSession } from '../../../src/application/auth/use-cases/LogoutCurrentSession.js';
import type { LogoutAllSessions } from '../../../src/application/auth/use-cases/LogoutAllSessions.js';
import type { AdminRevokeSessions } from '../../../src/application/auth/use-cases/AdminRevokeSessions.js';
import type { TokenProvider } from '../../../src/application/auth/ports/TokenProvider.js';
import type { Application } from 'express';

describe('Session Lifecycle Routes', () => {
  let app: Application;
  let mockTokenProvider: TokenProvider;
  let mockRefreshSession: RefreshSessionUseCase;
  let mockLogoutCurrent: LogoutCurrentSession;
  let mockLogoutAll: LogoutAllSessions;
  let mockAdminRevoke: AdminRevokeSessions;

  beforeEach(() => {
    const mockRegisterUser = {
      execute: vi.fn().mockResolvedValue({
        token: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      }),
    } as unknown as RegisterUser;

    const mockLoginUser = {
      execute: vi.fn().mockResolvedValue({
        token: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      }),
    } as unknown as LoginUser;

    mockTokenProvider = {
      generate: vi.fn().mockReturnValue('access-token'),
      verify: vi.fn().mockReturnValue({ id: '1', email: 'test@example.com' }),
    };

    mockRefreshSession = {
      execute: vi.fn().mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      }),
    } as unknown as RefreshSessionUseCase;

    mockLogoutCurrent = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as LogoutCurrentSession;

    mockLogoutAll = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as LogoutAllSessions;

    mockAdminRevoke = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as AdminRevokeSessions;

    app = createApp({
      registerUser: mockRegisterUser,
      loginUser: mockLoginUser,
      tokenProvider: mockTokenProvider,
      refreshSessionUseCase: mockRefreshSession,
      logoutCurrentSession: mockLogoutCurrent,
      logoutAllSessions: mockLogoutAll,
      adminRevokeSessions: mockAdminRevoke,
      adminUserIds: ['1'],
    });
  });

  describe('POST /auth/register', () => {
    it('should set refresh token cookie on registration', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'test@example.com', password: 'Password1!', name: 'Test User' });

      expect(res.status).toBe(201);
      expect(res.body.token).toBe('access-token');
      // refreshToken should be in Set-Cookie header, not in body
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
      expect(cookieStr).toContain('refreshToken=');
    });
  });

  describe('POST /auth/login', () => {
    it('should set refresh token cookie on login', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'Password1!' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBe('access-token');
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
      expect(cookieStr).toContain('refreshToken=');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens when given valid refresh token in body', async () => {
      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'old-refresh-token' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBe('new-access-token');
    });

    it('should return 401 on invalid refresh token', async () => {
      vi.mocked(mockRefreshSession.execute).mockRejectedValue(new SessionNotFoundError());

      const res = await request(app).post('/auth/refresh').send({ refreshToken: 'invalid-token' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 on expired refresh token', async () => {
      vi.mocked(mockRefreshSession.execute).mockRejectedValue(new SessionExpiredError());

      const res = await request(app).post('/auth/refresh').send({ refreshToken: 'expired-token' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 on token reuse detection', async () => {
      vi.mocked(mockRefreshSession.execute).mockRejectedValue(new TokenReuseDetectedError());

      const res = await request(app).post('/auth/refresh').send({ refreshToken: 'reused-token' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('reuse detected');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout current session and clear cookie', async () => {
      const res = await request(app)
        .post('/auth/logout')
        .send({ refreshToken: 'my-refresh-token' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');
    });

    it('should still succeed even without a refresh token', async () => {
      const res = await request(app).post('/auth/logout').send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /auth/logout-all', () => {
    it('should revoke all sessions for authenticated user', async () => {
      const res = await request(app)
        .post('/auth/logout-all')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('All sessions revoked');
      expect(mockLogoutAll.execute).toHaveBeenCalledWith('1');
    });

    it('should return 401 when no token provided', async () => {
      const res = await request(app).post('/auth/logout-all');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 when token is invalid', async () => {
      vi.mocked(mockTokenProvider.verify).mockReturnValue(null);

      const res = await request(app)
        .post('/auth/logout-all')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /auth/admin/revoke', () => {
    it('should revoke all sessions for target user when authenticated as admin', async () => {
      const res = await request(app)
        .post('/auth/admin/revoke')
        .set('Authorization', 'Bearer access-token')
        .send({ userId: 'target-user-id' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User sessions revoked');
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).post('/auth/admin/revoke').send({ userId: 'target-user-id' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 when authenticated user is not an admin', async () => {
      vi.mocked(mockTokenProvider.verify).mockReturnValueOnce({ id: 'non-admin-id', email: 'other@example.com' });

      const res = await request(app)
        .post('/auth/admin/revoke')
        .set('Authorization', 'Bearer access-token')
        .send({ userId: 'target-user-id' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 on validation error', async () => {
      vi.mocked(mockAdminRevoke.execute).mockRejectedValue(
        new ValidationError('User ID is required'),
      );

      const res = await request(app)
        .post('/auth/admin/revoke')
        .set('Authorization', 'Bearer access-token')
        .send({ userId: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
