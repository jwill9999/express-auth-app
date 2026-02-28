import { RefreshSession } from '../../../domain/auth/RefreshSession.js';
import { InvalidCredentialsError, ValidationError } from '../../../domain/auth/errors.js';
import type { UserRepository } from '../ports/UserRepository.js';
import type { PasswordHasher } from '../ports/PasswordHasher.js';
import type { TokenProvider } from '../ports/TokenProvider.js';
import type { RefreshSessionRepository } from '../ports/RefreshSessionRepository.js';
import type { RefreshTokenProvider } from '../ports/RefreshTokenProvider.js';
import type { LoginDTO } from '../dtos/LoginDTO.js';

export class LoginUser {
  constructor(
    private userRepo: UserRepository,
    private passwordHasher: PasswordHasher,
    private tokenProvider: TokenProvider,
    private sessionRepo?: RefreshSessionRepository,
    private refreshTokenProvider?: RefreshTokenProvider,
    private refreshTokenTtlMs?: number,
  ) {}

  async execute(input: LoginDTO) {
    if (!input.email || !input.password) {
      throw new ValidationError('Email and password are required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      throw new ValidationError('Invalid email format');
    }

    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const valid = await this.passwordHasher.compare(input.password, user.getPasswordHash());
    if (!valid) {
      throw new InvalidCredentialsError();
    }

    const token = this.tokenProvider.generate(user.id, user.email);

    let refreshToken: string | undefined;
    if (this.sessionRepo && this.refreshTokenProvider && this.refreshTokenTtlMs) {
      const tokenFamily = crypto.randomUUID();
      refreshToken = this.refreshTokenProvider.generateRefreshToken(user.id, tokenFamily);
      const tokenHash = this.refreshTokenProvider.hashToken(refreshToken);
      const session = new RefreshSession(
        '',
        user.id,
        tokenFamily,
        tokenHash,
        new Date(Date.now() + this.refreshTokenTtlMs),
        new Date(),
      );
      await this.sessionRepo.save(session);
    }

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}
