import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginUser } from '../../../src/application/auth/use-cases/LoginUser.js';
import { User } from '../../../src/domain/auth/User.js';
import { InvalidCredentialsError, ValidationError } from '../../../src/domain/auth/errors.js';
import type { UserRepository } from '../../../src/application/auth/ports/UserRepository.js';
import type { PasswordHasher } from '../../../src/application/auth/ports/PasswordHasher.js';
import type { TokenProvider } from '../../../src/application/auth/ports/TokenProvider.js';

const buildStrongCredential = (): string => `Aa1!${crypto.randomUUID()}`;
const invalidEmailCases = ['bad-email', 'foo@@bar.com', 'foobar.com', 'foo@bar', 'foo@bar.'];

describe('LoginUser Use Case', () => {
  let loginUser: LoginUser;
  let userRepo: UserRepository;
  let passwordHasher: PasswordHasher;
  let tokenProvider: TokenProvider;

  const existingUser = new User('user-1', 'test@example.com', 'hashed-pw', 'Test User');

  beforeEach(() => {
    userRepo = {
      findById: vi.fn(),
      findByEmail: vi.fn().mockResolvedValue(existingUser),
      findByGoogleId: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
    };

    passwordHasher = {
      hash: vi.fn(),
      compare: vi.fn().mockResolvedValue(true),
    };

    tokenProvider = {
      generate: vi.fn().mockReturnValue('jwt-token-123'),
      verify: vi.fn(),
    };

    loginUser = new LoginUser(userRepo, passwordHasher, tokenProvider);
  });

  it('should login successfully with valid credentials', async () => {
    const credential = buildStrongCredential();
    const result = await loginUser.execute({
      email: 'test@example.com',
      password: credential,
    });

    expect(result.token).toBe('jwt-token-123');
    expect(result.user.id).toBe('user-1');
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.name).toBe('Test User');
    expect(passwordHasher.compare).toHaveBeenCalledWith(credential, 'hashed-pw');
    expect(tokenProvider.generate).toHaveBeenCalledWith('user-1', 'test@example.com');
  });

  it('should throw ValidationError when email is missing', async () => {
    await expect(
      loginUser.execute({ email: '', password: buildStrongCredential() }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError when password is missing', async () => {
    await expect(loginUser.execute({ email: 'test@example.com', password: '' })).rejects.toThrow(
      ValidationError,
    );
  });

  it('should throw ValidationError for invalid email format', async () => {
    await expect(
      loginUser.execute({ email: 'bad-email', password: buildStrongCredential() }),
    ).rejects.toThrow(ValidationError);
  });

  it.each(invalidEmailCases)(
    'should throw ValidationError for invalid email: %s',
    async (email) => {
      await expect(loginUser.execute({ email, password: buildStrongCredential() })).rejects.toThrow(
        ValidationError,
      );
    },
  );

  it('should accept minimal valid domain pattern in email', async () => {
    await expect(
      loginUser.execute({ email: 'foo@x.y', password: buildStrongCredential() }),
    ).resolves.toMatchObject({ user: { email: 'test@example.com' } });
  });

  it('should throw InvalidCredentialsError when user not found', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null);

    await expect(
      loginUser.execute({ email: 'unknown@example.com', password: buildStrongCredential() }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('should throw InvalidCredentialsError when password is wrong', async () => {
    vi.mocked(passwordHasher.compare).mockResolvedValue(false);
    const wrongCredential = buildStrongCredential();

    await expect(
      loginUser.execute({ email: 'test@example.com', password: wrongCredential }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  describe('with createRefreshSession', () => {
    it('should include refreshToken in result when createRefreshSession is provided', async () => {
      const mockCreateRefreshSession = { execute: vi.fn().mockResolvedValue('refresh-token-abc') };
      const loginUserWithRefresh = new LoginUser(
        userRepo,
        passwordHasher,
        tokenProvider,
        mockCreateRefreshSession,
      );

      const result = await loginUserWithRefresh.execute({
        email: 'test@example.com',
        password: buildStrongCredential(),
      });

      expect(result.refreshToken).toBe('refresh-token-abc');
      expect(mockCreateRefreshSession.execute).toHaveBeenCalledWith('user-1');
    });

    it('should not include refreshToken when createRefreshSession is not provided', async () => {
      const result = await loginUser.execute({
        email: 'test@example.com',
        password: buildStrongCredential(),
      });

      expect(result.refreshToken).toBeUndefined();
    });
  });
});
