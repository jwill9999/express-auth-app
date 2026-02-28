import { InvalidCredentialsError, ValidationError } from '../../../domain/auth/errors.js';
import type { UserRepository } from '../ports/UserRepository.js';
import type { PasswordHasher } from '../ports/PasswordHasher.js';
import type { TokenProvider } from '../ports/TokenProvider.js';
import type { LoginDTO } from '../dtos/LoginDTO.js';
import type { CreateRefreshSession } from './CreateRefreshSession.js';

export class LoginUser {
  constructor(
    private userRepo: UserRepository,
    private passwordHasher: PasswordHasher,
    private tokenProvider: TokenProvider,
    private createRefreshSession?: CreateRefreshSession,
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
    if (this.createRefreshSession) {
      refreshToken = await this.createRefreshSession.execute(user.id);
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
