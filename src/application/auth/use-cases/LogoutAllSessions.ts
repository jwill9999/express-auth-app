import type { RefreshSessionRepository } from '../ports/RefreshSessionRepository.js';

export class LogoutAllSessions {
  constructor(private sessionRepo: RefreshSessionRepository) {}

  async execute(userId: string): Promise<void> {
    await this.sessionRepo.revokeAllByUserId(userId);
  }
}
