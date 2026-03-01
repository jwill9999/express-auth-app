import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterUser } from '../../../src/application/auth/use-cases/RegisterUser.js';
import { User } from '../../../src/domain/auth/User.js';
import { UserAlreadyExistsError, ValidationError } from '../../../src/domain/auth/errors.js';
import type { UserRepository } from '../../../src/application/auth/ports/UserRepository.js';
import type { PasswordHasher } from '../../../src/application/auth/ports/PasswordHasher.js';
import type { TokenProvider } from '../../../src/application/auth/ports/TokenProvider.js';

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
    const result = await registerUser.execute({
      email: 'test@example.com',
      password: 'Password1!',
      name: 'Test User',
    });

    expect(result.token).toBe('jwt-token-123');
    expect(result.user.id).toBe('generated-id');
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.name).toBe('Test User');
    expect(passwordHasher.hash).toHaveBeenCalledWith('Password1!');
    expect(userRepo.save).toHaveBeenCalled();
    expect(tokenProvider.generate).toHaveBeenCalledWith('generated-id', 'test@example.com');
  });

  it('should throw ValidationError when email is missing', async () => {
    await expect(registerUser.execute({ email: '', password: 'Password1!' })).rejects.toThrow(
      ValidationError,
    );
  });

  it('should throw ValidationError when password is missing', async () => {
    await expect(registerUser.execute({ email: 'test@example.com', password: '' })).rejects.toThrow(
      ValidationError,
    );
  });

  it('should throw ValidationError for invalid email format', async () => {
    await expect(
      registerUser.execute({ email: 'not-an-email', password: 'Password1!' }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError for weak password (no uppercase)', async () => {
    await expect(
      registerUser.execute({ email: 'test@example.com', password: 'password1!' }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError for weak password (no lowercase)', async () => {
    await expect(
      registerUser.execute({ email: 'test@example.com', password: 'PASSWORD1!' }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError for weak password (no number)', async () => {
    await expect(
      registerUser.execute({ email: 'test@example.com', password: 'Password!' }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError for weak password (no special char)', async () => {
    await expect(
      registerUser.execute({ email: 'test@example.com', password: 'Password1' }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError for password shorter than 8 characters', async () => {
    await expect(
      registerUser.execute({ email: 'test@example.com', password: 'Aa1!' }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw UserAlreadyExistsError when email is taken', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(
      new User('existing-id', 'test@example.com', 'hash'),
    );

    await expect(
      registerUser.execute({ email: 'test@example.com', password: 'Password1!' }),
    ).rejects.toThrow(UserAlreadyExistsError);
  });
});
