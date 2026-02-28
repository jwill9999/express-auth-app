import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminRevokeSessions } from '../../../src/application/auth/use-cases/AdminRevokeSessions.js';
import { ValidationError } from '../../../src/domain/auth/errors.js';
import type { RefreshSessionRepository } from '../../../src/application/auth/ports/RefreshSessionRepository.js';

describe('AdminRevokeSessions Use Case', () => {
  let useCase: AdminRevokeSessions;
  let sessionRepo: RefreshSessionRepository;

  beforeEach(() => {
    sessionRepo = {
      save: vi.fn(),
      findByTokenHash: vi.fn(),
      revokeById: vi.fn(),
      revokeByFamily: vi.fn(),
      revokeAllByUserId: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new AdminRevokeSessions(sessionRepo);
  });

  it('should revoke all sessions for the target user', async () => {
    await useCase.execute({ userId: 'target-user' });
    expect(sessionRepo.revokeAllByUserId).toHaveBeenCalledWith('target-user');
  });

  it('should throw ValidationError when userId is empty', async () => {
    await expect(useCase.execute({ userId: '' })).rejects.toThrow(ValidationError);
  });
});
