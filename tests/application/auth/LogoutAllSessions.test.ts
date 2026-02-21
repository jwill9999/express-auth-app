import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogoutAllSessions } from '../../../src/application/auth/use-cases/LogoutAllSessions.js';
import type { RefreshSessionRepository } from '../../../src/application/auth/ports/RefreshSessionRepository.js';

describe('LogoutAllSessions Use Case', () => {
  let useCase: LogoutAllSessions;
  let sessionRepo: RefreshSessionRepository;

  beforeEach(() => {
    sessionRepo = {
      save: vi.fn(),
      findByTokenHash: vi.fn(),
      revokeById: vi.fn(),
      revokeByFamily: vi.fn(),
      revokeAllByUserId: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new LogoutAllSessions(sessionRepo);
  });

  it('should revoke all sessions for the user', async () => {
    await useCase.execute('user-1');
    expect(sessionRepo.revokeAllByUserId).toHaveBeenCalledWith('user-1');
  });
});
