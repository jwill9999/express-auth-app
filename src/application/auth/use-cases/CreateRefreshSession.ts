import { RefreshSession } from '../../../domain/auth/RefreshSession.js';
import type { RefreshSessionRepository } from '../ports/RefreshSessionRepository.js';
import type { RefreshTokenProvider } from '../ports/RefreshTokenProvider.js';

export class CreateRefreshSession {
  constructor(
    private sessionRepo: RefreshSessionRepository,
    private refreshTokenProvider: RefreshTokenProvider,
    private refreshTokenTtlMs: number,
  ) {}

  async execute(userId: string): Promise<string> {
    const tokenFamily = crypto.randomUUID();
    const refreshToken = this.refreshTokenProvider.generateRefreshToken(userId, tokenFamily);
    const tokenHash = this.refreshTokenProvider.hashToken(refreshToken);
    const session = new RefreshSession(
      '',
      userId,
      tokenFamily,
      tokenHash,
      new Date(Date.now() + this.refreshTokenTtlMs),
      new Date(),
    );
    await this.sessionRepo.save(session);
    return refreshToken;
  }
}
