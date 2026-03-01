import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../src/interfaces/http/app.js';
import type { RegisterUser } from '../../../src/application/auth/use-cases/RegisterUser.js';
import type { LoginUser } from '../../../src/application/auth/use-cases/LoginUser.js';
import type { TokenProvider } from '../../../src/application/auth/ports/TokenProvider.js';

describe('Rate Limiting', () => {
  let mockRegisterUser: RegisterUser;
  let mockLoginUser: LoginUser;
  let mockTokenProvider: TokenProvider;

  beforeEach(() => {
    mockRegisterUser = {
      execute: vi.fn().mockResolvedValue({ token: 'tok', user: { id: '1', email: 'a@b.com', name: 'A' } }),
    } as unknown as RegisterUser;

    mockLoginUser = {
      execute: vi.fn().mockResolvedValue({ token: 'tok', user: { id: '1', email: 'a@b.com', name: 'A' } }),
    } as unknown as LoginUser;

    mockTokenProvider = {
      generate: vi.fn().mockReturnValue('tok'),
      verify: vi.fn().mockReturnValue({ id: '1', email: 'a@b.com' }),
    };
  });

  it('should return 429 after exceeding auth rate limit (5 req / 15 min)', async () => {
    // Each createApp instance gets a fresh in-memory store
    const app = createApp({
      registerUser: mockRegisterUser,
      loginUser: mockLoginUser,
      tokenProvider: mockTokenProvider,
      rateLimiting: true,
    });

    const payload = { email: 'a@b.com', password: 'Password1!', name: 'A' };

    // First 5 should succeed (or fail for domain reasons, not rate limiting)
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/auth/register').send(payload);
      expect(res.status).not.toBe(429);
    }

    // 6th request should be rate limited
    const res = await request(app).post('/auth/register').send(payload);
    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
  });

  it('should include RateLimit headers on auth responses', async () => {
    const app = createApp({
      registerUser: mockRegisterUser,
      loginUser: mockLoginUser,
      tokenProvider: mockTokenProvider,
      rateLimiting: true,
    });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'a@b.com', password: 'Password1!' });

    expect(res.headers['ratelimit-limit']).toBeDefined();
    expect(res.headers['ratelimit-remaining']).toBeDefined();
  });
});
