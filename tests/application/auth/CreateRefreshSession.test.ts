import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateRefreshSession } from '../../../src/application/auth/use-cases/CreateRefreshSession.js';
import { RefreshSession } from '../../../src/domain/auth/RefreshSession.js';
import type { RefreshSessionRepository } from '../../../src/application/auth/ports/RefreshSessionRepository.js';
import type { RefreshTokenProvider } from '../../../src/application/auth/ports/RefreshTokenProvider.js';

describe('CreateRefreshSession Use Case', () => {
  let useCase: CreateRefreshSession;
  let sessionRepo: RefreshSessionRepository;
  let refreshTokenProvider: RefreshTokenProvider;
  const ttlMs = 7 * 24 * 60 * 60 * 1000;

  beforeEach(() => {
    sessionRepo = {
      save: vi.fn().mockImplementation((s: RefreshSession) =>
        Promise.resolve(
          new RefreshSession('saved-id', s.userId, s.tokenFamily, s.tokenHash, s.expiresAt, s.createdAt),
        ),
      ),
      findByTokenHash: vi.fn(),
      revokeById: vi.fn(),
      revokeByFamily: vi.fn(),
      revokeAllByUserId: vi.fn(),
    };

    refreshTokenProvider = {
      generateRefreshToken: vi.fn().mockReturnValue('raw-refresh-token'),
      verifyRefreshToken: vi.fn(),
      hashToken: vi.fn().mockReturnValue('hashed-refresh-token'),
    };

    useCase = new CreateRefreshSession(sessionRepo, refreshTokenProvider, ttlMs);
  });

  it('should return the raw refresh token', async () => {
    const token = await useCase.execute('user-1');
    expect(token).toBe('raw-refresh-token');
  });

  it('should call hashToken with the generated refresh token', async () => {
    await useCase.execute('user-1');
    expect(refreshTokenProvider.hashToken).toHaveBeenCalledWith('raw-refresh-token');
  });

  it('should save the session with the hashed token', async () => {
    await useCase.execute('user-1');
    expect(sessionRepo.save).toHaveBeenCalledOnce();
    const savedSession = vi.mocked(sessionRepo.save).mock.calls[0][0];
    expect(savedSession.tokenHash).toBe('hashed-refresh-token');
    expect(savedSession.userId).toBe('user-1');
  });

  it('should set the correct expiry on the session', async () => {
    const before = Date.now();
    await useCase.execute('user-1');
    const after = Date.now();
    const savedSession = vi.mocked(sessionRepo.save).mock.calls[0][0];
    const expiresAtMs = savedSession.expiresAt.getTime();
    expect(expiresAtMs).toBeGreaterThanOrEqual(before + ttlMs);
    expect(expiresAtMs).toBeLessThanOrEqual(after + ttlMs);
  });

  it('should pass a token family to generateRefreshToken', async () => {
    await useCase.execute('user-1');
    const [userId, tokenFamily] = vi.mocked(refreshTokenProvider.generateRefreshToken).mock.calls[0];
    expect(userId).toBe('user-1');
    expect(typeof tokenFamily).toBe('string');
    expect(tokenFamily.length).toBeGreaterThan(0);
  });

  it('should store the same tokenFamily in the session', async () => {
    await useCase.execute('user-1');
    const [, tokenFamily] = vi.mocked(refreshTokenProvider.generateRefreshToken).mock.calls[0];
    const savedSession = vi.mocked(sessionRepo.save).mock.calls[0][0];
    expect(savedSession.tokenFamily).toBe(tokenFamily);
  });
});
