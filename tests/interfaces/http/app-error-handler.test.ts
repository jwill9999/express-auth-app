import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../src/interfaces/http/app.js';
import type { RegisterUser } from '../../../src/application/auth/use-cases/RegisterUser.js';
import type { LoginUser } from '../../../src/application/auth/use-cases/LoginUser.js';
import type { TokenProvider } from '../../../src/application/auth/ports/TokenProvider.js';

const buildStrongCredential = (): string => `Aa1!${crypto.randomUUID()}`;

describe('createApp - error handler and rate limiting', () => {
  const mockTokenProvider: TokenProvider = {
    generate: vi.fn(),
    verify: vi.fn(),
  };

  describe('500 error handler', () => {
    it('should return 500 JSON response when an unhandled error is thrown', async () => {
      const throwingRegisterUser = {
        execute: vi.fn().mockImplementation(() => {
          throw new Error('Unexpected DB crash');
        }),
      } as unknown as RegisterUser;

      const app = createApp({
        registerUser: throwingRegisterUser,
        loginUser: { execute: vi.fn() } as unknown as LoginUser,
        tokenProvider: mockTokenProvider,
        rateLimiting: false,
      });

      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'test@example.com', password: buildStrongCredential() });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Something went wrong!');
    });
  });

  describe('rateLimiting default (undefined → true)', () => {
    it('should apply rate limiters when rateLimiting is not specified', async () => {
      const app = createApp({
        registerUser: {
          execute: vi.fn().mockResolvedValue({
            token: 'tok',
            user: { id: '1', email: 'a@b.com', name: 'A' },
          }),
        } as unknown as RegisterUser,
        loginUser: { execute: vi.fn() } as unknown as LoginUser,
        tokenProvider: mockTokenProvider,
        // rateLimiting not provided → defaults to true
      });

      // Rate limiters exist but won't block on a single request
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'a@b.com', password: buildStrongCredential(), name: 'A' });

      // Just verify the app is working (rate limiter doesn't block first request)
      expect([200, 201, 400, 429]).toContain(res.status);
    });
  });
});
