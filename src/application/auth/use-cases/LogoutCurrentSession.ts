import { SessionNotFoundError, ValidationError } from '../../../domain/auth/errors.js';
import type { RefreshSessionRepository } from '../ports/RefreshSessionRepository.js';
import type { RefreshTokenProvider } from '../ports/RefreshTokenProvider.js';
import type { LogoutDTO } from '../dtos/LogoutDTO.js';

export class LogoutCurrentSession {
  constructor(
    private sessionRepo: RefreshSessionRepository,
    private refreshTokenProvider: RefreshTokenProvider,
  ) {}

  async execute(input: LogoutDTO): Promise<void> {
    if (!input.refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    const decoded = this.refreshTokenProvider.verifyRefreshToken(input.refreshToken);
    if (!decoded) {
      throw new SessionNotFoundError();
    }

    const tokenHash = this.refreshTokenProvider.hashToken(input.refreshToken);
    const session = await this.sessionRepo.findByTokenHash(tokenHash);

    if (!session) {
      throw new SessionNotFoundError();
    }

    await this.sessionRepo.revokeById(session.id);
  }
}
