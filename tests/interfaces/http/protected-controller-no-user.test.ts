import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express, { RequestHandler } from 'express';
import { ProtectedController } from '../../../src/interfaces/http/controllers/ProtectedController.js';

/**
 * Tests for the ProtectedController's defensive !user branches.
 * These fire when a middleware calls next() without setting req.user —
 * a defensive guard that should never fire in normal operation.
 */
describe('ProtectedController - missing user guard branches', () => {
  const makeApp = (authMiddleware: RequestHandler) => {
    const controller = new ProtectedController(authMiddleware);
    const app = express();
    app.use(express.json());
    app.use('/api', controller.getRouter());
    return app;
  };

  // Middleware that calls next() without setting req.user
  const noUserMiddleware: RequestHandler = (_req, _res, next) => next();

  const createSetUserMiddleware = (): RequestHandler => {
    return (req, _res, next) => {
      (req as express.Request & { user?: { id: string; email: string } }).user = {
        id: 'user-42',
        email: 'user@example.com',
      };
      next();
    };
  };

  describe('missing user responses', () => {
    const protectedRoutes = ['/api/data', '/api/profile'];

    for (const route of protectedRoutes) {
      it(`should return 401 when req.user is not set for ${route}`, async () => {
        const app = makeApp(noUserMiddleware);
        const res = await request(app).get(route);

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('User not authenticated');
      });
    }
  });

  describe('GET /api/data - with user set', () => {
    it('should return 200 with data when req.user is set', async () => {
      const app = makeApp(createSetUserMiddleware());
      const res = await request(app).get('/api/data');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.id).toBe('user-42');
      expect(res.body.data.items).toHaveLength(3);
    });
  });

  describe('GET /api/profile - with user set', () => {
    it('should return 200 with profile when req.user is set', async () => {
      const app = makeApp(createSetUserMiddleware());
      const res = await request(app).get('/api/profile');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profile.id).toBe('user-42');
      expect(res.body.profile.email).toBe('user@example.com');
    });
  });
});
