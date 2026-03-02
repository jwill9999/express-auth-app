import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { createAuthMiddleware } from '../../../src/interfaces/http/middleware/AuthMiddleware.js';
import type { TokenProvider } from '../../../src/application/auth/ports/TokenProvider.js';

describe('AuthMiddleware edge cases', () => {
  let mockTokenProvider: TokenProvider;

  const makeApp = () => {
    const middleware = createAuthMiddleware(mockTokenProvider);
    const app = express();
    app.use(express.json());
    app.get('/protected', middleware, (_req, res) => {
      res.json({ success: true });
    });
    return app;
  };

  beforeEach(() => {
    mockTokenProvider = {
      generate: vi.fn(),
      verify: vi.fn().mockReturnValue({ id: 'user-1', email: 'test@example.com' }),
    };
  });

  it('should return 401 when Authorization header is "Bearer " with no token', async () => {
    const app = makeApp();
    const res = await request(app).get('/protected').set('Authorization', 'Bearer ');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('No token provided');
  });

  it('should return 401 when tokenProvider.verify throws an error', async () => {
    vi.mocked(mockTokenProvider.verify).mockImplementation(() => {
      throw new Error('JWT malformed');
    });

    const app = makeApp();
    const res = await request(app).get('/protected').set('Authorization', 'Bearer bad-token');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid or expired token');
  });

  it('should return 401 when no Authorization header is provided', async () => {
    const app = makeApp();
    const res = await request(app).get('/protected');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('No token provided');
  });

  it('should return 401 when Authorization header does not start with Bearer', async () => {
    const app = makeApp();
    const res = await request(app).get('/protected').set('Authorization', 'Basic sometoken');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('No token provided');
  });

  it('should return 401 when tokenProvider.verify returns null', async () => {
    vi.mocked(mockTokenProvider.verify).mockReturnValue(null);

    const app = makeApp();
    const res = await request(app).get('/protected').set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid or expired token');
  });

  it('should call next and set req.user when token is valid', async () => {
    const app = makeApp();
    const res = await request(app).get('/protected').set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockTokenProvider.verify).toHaveBeenCalledWith('valid-token');
  });
});

describe('AuthMiddleware - direct unit tests (bypassing HTTP)', () => {
  let mockTokenProvider: TokenProvider;

  beforeEach(() => {
    mockTokenProvider = {
      generate: vi.fn(),
      verify: vi.fn().mockReturnValue({ id: 'user-1', email: 'test@example.com' }),
    };
  });

  const makeRes = () => {
    const res = {
      status: vi.fn(),
      json: vi.fn(),
    };
    res.status.mockReturnValue(res);
    return res as unknown as Response;
  };

  it('should return 401 when token is empty string after "Bearer "', () => {
    const middleware = createAuthMiddleware(mockTokenProvider);
    const req = { headers: { authorization: 'Bearer ' } } as Request;
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });
});
