import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogoutCurrentSession } from '../../../src/application/auth/use-cases/LogoutCurrentSession.js';
import { RefreshSession } from '../../../src/domain/auth/RefreshSession.js';
import { SessionNotFoundError, ValidationError } from '../../../src/domain/auth/errors.js';
import type { RefreshSessionRepository } from '../../../src/application/auth/ports/RefreshSessionRepository.js';
import type { RefreshTokenProvider } from '../../../src/application/auth/ports/RefreshTokenProvider.js';

describe('LogoutCurrentSession Use Case', () => {
  let useCase: LogoutCurrentSession;
  let sessionRepo: RefreshSessionRepository;
  let refreshTokenProvider: RefreshTokenProvider;

  const futureDate = new Date(Date.now() + 60_000);
  const existingSession = new RefreshSession(
    'sess-1',
    'user-1',
    'family-1',
    'hash123',
    futureDate,
    new Date(),
  );

  beforeEach(() => {
    sessionRepo = {
      save: vi.fn(),
      findByTokenHash: vi.fn().mockResolvedValue(existingSession),
      revokeById: vi.fn().mockResolvedValue(true),
      revokeByFamily: vi.fn(),
      revokeAllByUserId: vi.fn(),
    };

    refreshTokenProvider = {
      generateRefreshToken: vi.fn(),
      verifyRefreshToken: vi.fn().mockReturnValue({ userId: 'user-1', family: 'family-1' }),
      hashToken: vi.fn().mockReturnValue('hash123'),
    };

    useCase = new LogoutCurrentSession(sessionRepo, refreshTokenProvider);
  });

  it('should revoke the current session', async () => {
    await useCase.execute({ refreshToken: 'valid-refresh-token' });
    expect(sessionRepo.revokeById).toHaveBeenCalledWith('sess-1');
  });

  it('should throw ValidationError when refresh token is empty', async () => {
    await expect(useCase.execute({ refreshToken: '' })).rejects.toThrow(ValidationError);
  });

  it('should throw SessionNotFoundError when token JWT is invalid', async () => {
    vi.mocked(refreshTokenProvider.verifyRefreshToken).mockReturnValue(null);
    await expect(useCase.execute({ refreshToken: 'invalid' })).rejects.toThrow(
      SessionNotFoundError,
    );
  });

  it('should throw SessionNotFoundError when session not in DB', async () => {
    vi.mocked(sessionRepo.findByTokenHash).mockResolvedValue(null);
    await expect(useCase.execute({ refreshToken: 'valid-token' })).rejects.toThrow(
      SessionNotFoundError,
    );
  });
});
