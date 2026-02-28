import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RefreshSessionUseCase } from '../../../src/application/auth/use-cases/RefreshSession.js';
import { RefreshSession } from '../../../src/domain/auth/RefreshSession.js';
import { User } from '../../../src/domain/auth/User.js';
import {
  SessionNotFoundError,
  SessionExpiredError,
  TokenReuseDetectedError,
  ValidationError,
} from '../../../src/domain/auth/errors.js';
import type { RefreshSessionRepository } from '../../../src/application/auth/ports/RefreshSessionRepository.js';
import type { RefreshTokenProvider } from '../../../src/application/auth/ports/RefreshTokenProvider.js';
import type { TokenProvider } from '../../../src/application/auth/ports/TokenProvider.js';
import type { UserRepository } from '../../../src/application/auth/ports/UserRepository.js';

describe('RefreshSession Use Case', () => {
  let useCase: RefreshSessionUseCase;
  let sessionRepo: RefreshSessionRepository;
  let refreshTokenProvider: RefreshTokenProvider;
  let tokenProvider: TokenProvider;
  let userRepo: UserRepository;

  const futureDate = new Date(Date.now() + 60_000);
  const existingSession = new RefreshSession(
    'sess-1',
    'user-1',
    'family-1',
    'hash-of-old-token',
    futureDate,
    new Date(),
    false,
  );
  const existingUser = new User('user-1', 'test@example.com', 'hashed-pw', 'Test User');

  beforeEach(() => {
    sessionRepo = {
      save: vi
        .fn()
        .mockImplementation((s: RefreshSession) =>
          Promise.resolve(
            new RefreshSession(
              'sess-2',
              s.userId,
              s.tokenFamily,
              s.tokenHash,
              s.expiresAt,
              s.createdAt,
            ),
          ),
        ),
      findByTokenHash: vi.fn().mockResolvedValue(existingSession),
      revokeById: vi.fn().mockResolvedValue(true),
      revokeByFamily: vi.fn().mockResolvedValue(undefined),
      revokeAllByUserId: vi.fn().mockResolvedValue(undefined),
    };

    refreshTokenProvider = {
      generateRefreshToken: vi.fn().mockReturnValue('new-refresh-token'),
      verifyRefreshToken: vi.fn().mockReturnValue({ userId: 'user-1', family: 'family-1' }),
      hashToken: vi.fn().mockReturnValue('hash-of-old-token'),
    };

    tokenProvider = {
      generate: vi.fn().mockReturnValue('new-access-token'),
      verify: vi.fn(),
    };

    userRepo = {
      findById: vi.fn().mockResolvedValue(existingUser),
      findByEmail: vi.fn(),
      findByGoogleId: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
    };

    useCase = new RefreshSessionUseCase(
      sessionRepo,
      refreshTokenProvider,
      tokenProvider,
      userRepo,
      7 * 24 * 60 * 60 * 1000,
    );
  });

  it('should rotate tokens successfully', async () => {
    const result = await useCase.execute({ refreshToken: 'old-refresh-token' });

    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBe('new-refresh-token');
    expect(result.user.id).toBe('user-1');
    expect(sessionRepo.revokeById).toHaveBeenCalledWith('sess-1');
    expect(sessionRepo.save).toHaveBeenCalled();
  });

  it('should throw ValidationError when refresh token is empty', async () => {
    await expect(useCase.execute({ refreshToken: '' })).rejects.toThrow(ValidationError);
  });

  it('should throw SessionNotFoundError when token is invalid JWT', async () => {
    vi.mocked(refreshTokenProvider.verifyRefreshToken).mockReturnValue(null);
    await expect(useCase.execute({ refreshToken: 'invalid' })).rejects.toThrow(
      SessionNotFoundError,
    );
  });

  it('should detect reuse when token not in DB and revoke family', async () => {
    vi.mocked(sessionRepo.findByTokenHash).mockResolvedValue(null);

    await expect(useCase.execute({ refreshToken: 'old-refresh-token' })).rejects.toThrow(
      TokenReuseDetectedError,
    );
    expect(sessionRepo.revokeByFamily).toHaveBeenCalledWith('family-1');
  });

  it('should detect reuse when session is already revoked and revoke entire family', async () => {
    const revokedSession = new RefreshSession(
      'sess-1',
      'user-1',
      'family-1',
      'hash-of-old-token',
      futureDate,
      new Date(),
      true,
    );
    vi.mocked(sessionRepo.findByTokenHash).mockResolvedValue(revokedSession);

    await expect(useCase.execute({ refreshToken: 'old-refresh-token' })).rejects.toThrow(
      TokenReuseDetectedError,
    );
    expect(sessionRepo.revokeByFamily).toHaveBeenCalledWith('family-1');
  });

  it('should throw SessionExpiredError when session is expired', async () => {
    const expiredSession = new RefreshSession(
      'sess-1',
      'user-1',
      'family-1',
      'hash',
      new Date(Date.now() - 60_000),
      new Date(),
      false,
    );
    vi.mocked(sessionRepo.findByTokenHash).mockResolvedValue(expiredSession);

    await expect(useCase.execute({ refreshToken: 'old-refresh-token' })).rejects.toThrow(
      SessionExpiredError,
    );
  });

  it('should throw SessionNotFoundError when user not found', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null);

    await expect(useCase.execute({ refreshToken: 'old-refresh-token' })).rejects.toThrow(
      SessionNotFoundError,
    );
  });

  it('should throw SessionNotFoundError (not TokenReuseDetectedError) when a concurrent request already rotated the token', async () => {
    // Simulate revokeById returning false — another request already consumed this token
    vi.mocked(sessionRepo.revokeById).mockResolvedValue(false);

    await expect(useCase.execute({ refreshToken: 'old-refresh-token' })).rejects.toThrow(
      SessionNotFoundError,
    );
    // The family must NOT be revoked — this is a concurrent rotation, not malicious reuse
    expect(sessionRepo.revokeByFamily).not.toHaveBeenCalled();
  });
});

