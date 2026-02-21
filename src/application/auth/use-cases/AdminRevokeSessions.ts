import { ValidationError } from '../../../domain/auth/errors.js';
import type { RefreshSessionRepository } from '../ports/RefreshSessionRepository.js';
import type { AdminRevokeDTO } from '../dtos/AdminRevokeDTO.js';

export class AdminRevokeSessions {
  constructor(private sessionRepo: RefreshSessionRepository) {}

  async execute(input: AdminRevokeDTO): Promise<void> {
    if (!input.userId) {
      throw new ValidationError('User ID is required');
    }

    await this.sessionRepo.revokeAllByUserId(input.userId);
  }
}
