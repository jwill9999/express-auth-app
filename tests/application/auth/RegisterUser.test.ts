import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterUser } from '../../../src/application/auth/use-cases/RegisterUser.js';
import { User } from '../../../src/domain/auth/User.js';
import { UserAlreadyExistsError, ValidationError } from '../../../src/domain/auth/errors.js';
import type { UserRepository } from '../../../src/application/auth/ports/UserRepository.js';
import type { PasswordHasher } from '../../../src/application/auth/ports/PasswordHasher.js';
import type { TokenProvider } from '../../../src/application/auth/ports/TokenProvider.js';

const buildStrongCredential = (): string => `Aa1!${crypto.randomUUID()}`;
const buildNoUppercaseCredential = (): string => `aa1!${crypto.randomUUID()}`;
const buildNoLowercaseCredential = (): string => ['AA1!', 'ABCDEFGH'].join('');
const buildNoNumberCredential = (): string => ['Aa', '!', 'abcdefgh'].join('');
const buildNoSpecialCredential = (): string => ['Aa1', 'abcdefgh'].join('');
const invalidEmailCases = ['not-an-email', 'foo@@bar.com', 'foobar.com', 'foo@bar', 'foo@bar.'];

describe('RegisterUser Use Case', () => {
  let registerUser: RegisterUser;
  let userRepo: UserRepository;
  let passwordHasher: PasswordHasher;
  let tokenProvider: TokenProvider;

  beforeEach(() => {
    userRepo = {
      findById: vi.fn(),
      findByEmail: vi.fn().mockResolvedValue(null),
      findByGoogleId: vi.fn(),
      save: vi
        .fn()
        .mockImplementation((user: User) =>
          Promise.resolve(new User('generated-id', user.email, user.getPasswordHash(), user.name)),
        ),
      update: vi.fn(),
    };

    passwordHasher = {
      hash: vi.fn().mockResolvedValue('hashed-password'),
      compare: vi.fn(),
    };

    tokenProvider = {
      generate: vi.fn().mockReturnValue('jwt-token-123'),
      verify: vi.fn(),
    };

    registerUser = new RegisterUser(userRepo, passwordHasher, tokenProvider);
  });

  it('should register a new user successfully', async () => {
    const credential = buildStrongCredential();
    const result = await registerUser.execute({
      email: 'test@example.com',
      password: credential,
      name: 'Test User',
    });

    expect(result.token).toBe('jwt-token-123');
    expect(result.user.id).toBe('generated-id');
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.name).toBe('Test User');
    expect(passwordHasher.hash).toHaveBeenCalledWith(credential);
    expect(userRepo.save).toHaveBeenCalled();
    expect(tokenProvider.generate).toHaveBeenCalledWith('generated-id', 'test@example.com');
  });

  it('should throw ValidationError when email is missing', async () => {
    await expect(
      registerUser.execute({ email: '', password: buildStrongCredential() }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError when password is missing', async () => {
    await expect(registerUser.execute({ email: 'test@example.com', password: '' })).rejects.toThrow(
      ValidationError,
    );
  });

  it('should throw ValidationError for invalid email format', async () => {
    await expect(
      registerUser.execute({ email: 'not-an-email', password: buildStrongCredential() }),
    ).rejects.toThrow(ValidationError);
  });

  it.each(invalidEmailCases)(
    'should throw ValidationError for invalid email: %s',
    async (email) => {
      await expect(
        registerUser.execute({ email, password: buildStrongCredential() }),
      ).rejects.toThrow(ValidationError);
    },
  );

  it('should accept minimal valid domain pattern in email', async () => {
    await expect(
      registerUser.execute({ email: 'foo@x.y', password: buildStrongCredential() }),
    ).resolves.toMatchObject({ user: { email: 'foo@x.y' } });
  });

  it('should accept longer valid domain pattern in email', async () => {
    await expect(
      registerUser.execute({ email: 'foo@xy.z', password: buildStrongCredential() }),
    ).resolves.toMatchObject({ user: { email: 'foo@xy.z' } });
  });

  it('should throw ValidationError for weak password (no uppercase)', async () => {
    await expect(
      registerUser.execute({ email: 'test@example.com', password: buildNoUppercaseCredential() }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError for weak password (no lowercase)', async () => {
    await expect(
      registerUser.execute({ email: 'test@example.com', password: buildNoLowercaseCredential() }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError for weak password (no number)', async () => {
    await expect(
      registerUser.execute({ email: 'test@example.com', password: buildNoNumberCredential() }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError for weak password (no special char)', async () => {
    await expect(
      registerUser.execute({ email: 'test@example.com', password: buildNoSpecialCredential() }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError for password shorter than 8 characters', async () => {
    await expect(
      registerUser.execute({
        email: 'test@example.com',
        password: buildStrongCredential().slice(0, 4),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw UserAlreadyExistsError when email is taken', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(
      new User('existing-id', 'test@example.com', 'hash'),
    );

    await expect(
      registerUser.execute({ email: 'test@example.com', password: buildStrongCredential() }),
    ).rejects.toThrow(UserAlreadyExistsError);
  });

  describe('with createRefreshSession', () => {
    it('should include refreshToken in result when createRefreshSession is provided', async () => {
      const mockCreateRefreshSession = {
        execute: vi.fn().mockResolvedValue('refresh-token-xyz'),
      };
      const registerUserWithRefresh = new RegisterUser(
        userRepo,
        passwordHasher,
        tokenProvider,
        mockCreateRefreshSession,
      );

      const result = await registerUserWithRefresh.execute({
        email: 'test@example.com',
        password: buildStrongCredential(),
        name: 'Test User',
      });

      expect(result.refreshToken).toBe('refresh-token-xyz');
      expect(mockCreateRefreshSession.execute).toHaveBeenCalledWith('generated-id');
    });

    it('should not include refreshToken when createRefreshSession is not provided', async () => {
      const result = await registerUser.execute({
        email: 'test@example.com',
        password: buildStrongCredential(),
      });

      expect(result.refreshToken).toBeUndefined();
    });
  });
});
