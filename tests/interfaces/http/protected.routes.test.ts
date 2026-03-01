import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../src/interfaces/http/app.js';
import type { RegisterUser } from '../../../src/application/auth/use-cases/RegisterUser.js';
import type { LoginUser } from '../../../src/application/auth/use-cases/LoginUser.js';
import type { TokenProvider } from '../../../src/application/auth/ports/TokenProvider.js';
import type { Application } from 'express';

describe('Protected Routes', () => {
  let app: Application;
  let mockTokenProvider: TokenProvider;

  beforeEach(() => {
    const mockRegisterUser = { execute: vi.fn() } as unknown as RegisterUser;
    const mockLoginUser = { execute: vi.fn() } as unknown as LoginUser;

    mockTokenProvider = {
      generate: vi.fn().mockReturnValue('jwt-token-123'),
      verify: vi.fn().mockReturnValue({ id: 'user-1', email: 'test@example.com' }),
    };

    app = createApp({
      registerUser: mockRegisterUser,
      loginUser: mockLoginUser,
      tokenProvider: mockTokenProvider,
      rateLimiting: false,
    });
  });

  describe('GET /api/data', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/data');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('No token provided');
    });

    it('should return 401 when token is invalid', async () => {
      vi.mocked(mockTokenProvider.verify).mockReturnValue(null);

      const res = await request(app).get('/api/data').set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 200 with data when token is valid', async () => {
      const res = await request(app).get('/api/data').set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.id).toBe('user-1');
      expect(res.body.data.items).toHaveLength(3);
      expect(res.body.data.statistics.totalItems).toBe(3);
    });
  });

  describe('GET /api/profile', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/profile');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 200 with profile when token is valid', async () => {
      const res = await request(app).get('/api/profile').set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profile.id).toBe('user-1');
      expect(res.body.profile.email).toBe('test@example.com');
      expect(res.body.profile.lastAccessed).toBeDefined();
    });
  });
});
