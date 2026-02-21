import { User } from '../../../domain/auth/User.js';
import { RefreshSession } from '../../../domain/auth/RefreshSession.js';
import { UserAlreadyExistsError, ValidationError } from '../../../domain/auth/errors.js';
import type { UserRepository } from '../ports/UserRepository.js';
import type { PasswordHasher } from '../ports/PasswordHasher.js';
import type { TokenProvider } from '../ports/TokenProvider.js';
import type { RefreshSessionRepository } from '../ports/RefreshSessionRepository.js';
import type { RefreshTokenProvider } from '../ports/RefreshTokenProvider.js';
import type { RegisterDTO } from '../dtos/RegisterDTO.js';

export class RegisterUser {
  constructor(
    private userRepo: UserRepository,
    private passwordHasher: PasswordHasher,
    private tokenProvider: TokenProvider,
    private sessionRepo?: RefreshSessionRepository,
    private refreshTokenProvider?: RefreshTokenProvider,
    private refreshTokenTtlMs?: number,
  ) {}

  async execute(input: RegisterDTO) {
    if (!input.email || !input.password) {
      throw new ValidationError('Email and password are required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      throw new ValidationError('Invalid email format');
    }

    const hasUppercase = /[A-Z]/.test(input.password);
    const hasLowercase = /[a-z]/.test(input.password);
    const hasNumber = /\d/.test(input.password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(input.password);
    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
      throw new ValidationError(
        'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
      );
    }

    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new UserAlreadyExistsError();
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = new User('', input.email, passwordHash, input.name);
    const savedUser = await this.userRepo.save(user);

    const token = this.tokenProvider.generate(savedUser.id, savedUser.email);

    let refreshToken: string | undefined;
    if (this.sessionRepo && this.refreshTokenProvider && this.refreshTokenTtlMs) {
      const tokenFamily = crypto.randomUUID();
      refreshToken = this.refreshTokenProvider.generateRefreshToken(savedUser.id, '', tokenFamily);
      const tokenHash = this.refreshTokenProvider.hashToken(refreshToken);
      const session = new RefreshSession(
        '',
        savedUser.id,
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
        id: savedUser.id,
        email: savedUser.email,
        name: savedUser.name,
      },
    };
  }
}
