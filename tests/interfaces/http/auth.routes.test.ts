import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../src/interfaces/http/app.js';
import {
  InvalidCredentialsError,
  UserAlreadyExistsError,
  ValidationError,
} from '../../../src/domain/auth/errors.js';
import type { RegisterUser } from '../../../src/application/auth/use-cases/RegisterUser.js';
import type { LoginUser } from '../../../src/application/auth/use-cases/LoginUser.js';
import type { TokenProvider } from '../../../src/application/auth/ports/TokenProvider.js';
import type { Application } from 'express';

const buildStrongCredential = (): string => `Aa1!${crypto.randomUUID()}`;

describe('Auth Routes', () => {
  let app: Application;
  let mockRegisterUser: RegisterUser;
  let mockLoginUser: LoginUser;
  let mockTokenProvider: TokenProvider;

  beforeEach(() => {
    mockRegisterUser = {
      execute: vi.fn().mockResolvedValue({
        token: 'jwt-token-123',
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      }),
    } as unknown as RegisterUser;

    mockLoginUser = {
      execute: vi.fn().mockResolvedValue({
        token: 'jwt-token-123',
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      }),
    } as unknown as LoginUser;

    mockTokenProvider = {
      generate: vi.fn().mockReturnValue('jwt-token-123'),
      verify: vi.fn().mockReturnValue({ id: '1', email: 'test@example.com' }),
    };

    app = createApp({
      registerUser: mockRegisterUser,
      loginUser: mockLoginUser,
      tokenProvider: mockTokenProvider,
      rateLimiting: false,
    });
  });

  describe('POST /auth/register', () => {
    it('should return 201 on successful registration', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'test@example.com', password: buildStrongCredential(), name: 'Test User' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBe('jwt-token-123');
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should return 400 on validation error', async () => {
      vi.mocked(mockRegisterUser.execute).mockRejectedValue(
        new ValidationError('Email and password are required'),
      );

      const res = await request(app).post('/auth/register').send({ email: '', password: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when user already exists', async () => {
      vi.mocked(mockRegisterUser.execute).mockRejectedValue(new UserAlreadyExistsError());

      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'existing@example.com', password: buildStrongCredential() });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User already exists');
    });
  });

  describe('POST /auth/login', () => {
    it('should return 200 on successful login', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: buildStrongCredential() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBe('jwt-token-123');
      expect(res.body.message).toBe('Login successful');
    });

    it('should return 401 on invalid credentials', async () => {
      vi.mocked(mockLoginUser.execute).mockRejectedValue(new InvalidCredentialsError());

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: buildStrongCredential() });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should return 400 on validation error', async () => {
      vi.mocked(mockLoginUser.execute).mockRejectedValue(
        new ValidationError('Invalid email format'),
      );

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'bad-email', password: buildStrongCredential() });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
