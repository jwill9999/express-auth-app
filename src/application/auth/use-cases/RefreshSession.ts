import { RefreshSession } from '../../../domain/auth/RefreshSession.js';
import {
  SessionNotFoundError,
  SessionExpiredError,
  TokenReuseDetectedError,
  ValidationError,
} from '../../../domain/auth/errors.js';
import type { RefreshSessionRepository } from '../ports/RefreshSessionRepository.js';
import type { RefreshTokenProvider } from '../ports/RefreshTokenProvider.js';
import type { TokenProvider } from '../ports/TokenProvider.js';
import type { UserRepository } from '../ports/UserRepository.js';
import type { RefreshSessionDTO } from '../dtos/RefreshSessionDTO.js';

export class RefreshSessionUseCase {
  constructor(
    private readonly sessionRepo: RefreshSessionRepository,
    private readonly refreshTokenProvider: RefreshTokenProvider,
    private readonly tokenProvider: TokenProvider,
    private readonly userRepo: UserRepository,
    private readonly refreshTokenTtlMs: number,
  ) {}

  async execute(input: RefreshSessionDTO) {
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
      // Token was valid JWT but not in DB — possible reuse of a rotated token
      // Revoke entire family as a precaution
      await this.sessionRepo.revokeByFamily(decoded.family);
      throw new TokenReuseDetectedError();
    }

    if (session.revoked) {
      // Revoked token presented — reuse detected, revoke entire family
      await this.sessionRepo.revokeByFamily(session.tokenFamily);
      throw new TokenReuseDetectedError();
    }

    if (session.isExpired()) {
      throw new SessionExpiredError();
    }

    const user = await this.userRepo.findById(session.userId);
    if (!user) {
      throw new SessionNotFoundError();
    }

    // Atomically revoke the old session — returns false if a concurrent request
    // already rotated this token (not malicious reuse, so do NOT revoke the family)
    const revoked = await this.sessionRepo.revokeById(session.id);
    if (!revoked) {
      throw new SessionNotFoundError();
    }

    // Issue new tokens in the same family
    const accessToken = this.tokenProvider.generate(user.id, user.email);
    const newRefreshToken = this.refreshTokenProvider.generateRefreshToken(
      user.id,
      session.tokenFamily,
    );
    const newTokenHash = this.refreshTokenProvider.hashToken(newRefreshToken);

    const newSession = new RefreshSession(
      '',
      user.id,
      session.tokenFamily,
      newTokenHash,
      new Date(Date.now() + this.refreshTokenTtlMs),
      new Date(),
    );
    await this.sessionRepo.save(newSession);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }
}
