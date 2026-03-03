import { describe, it, expect, vi, beforeEach } from 'vitest';
import passport from 'passport';
import { User } from '../../../src/domain/auth/User.js';
import type { UserRepository } from '../../../src/application/auth/ports/UserRepository.js';
import type { Profile } from 'passport-google-oauth20';

// Capture the verify callback when GoogleStrategy is constructed
let capturedVerify: ((...args: unknown[]) => Promise<void>) | null = null;

vi.mock('passport-google-oauth20', () => ({
  Strategy: vi.fn().mockImplementation(function (
    this: { name: string; authenticate: ReturnType<typeof vi.fn> },
    _opts: unknown,
    verify: (...args: unknown[]) => Promise<void>,
  ) {
    capturedVerify = verify;
    this.name = 'google';
    this.authenticate = vi.fn();
  }),
}));

// Import AFTER mocking so the mock takes effect
const { configurePassport } =
  await import('../../../src/infrastructure/auth/providers/passport.js');

const makeProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: 'google-profile-id',
  displayName: 'New Google User',
  emails: [{ value: 'new@google.com', verified: 'true' }],
  photos: [],
  provider: 'google',
  _raw: '',
  _json: {} as Profile['_json'],
  ...overrides,
});

describe('configurePassport', () => {
  let userRepo: UserRepository;

  const existingUser = new User('user-1', 'test@example.com', 'hashed', 'Test User', 'google-123');

  beforeEach(() => {
    // Reset passport state to prevent cross-test contamination
    (passport as unknown as Record<string, unknown>)._strategies = {};
    (passport as unknown as Record<string, unknown>)._serializers = [];
    (passport as unknown as Record<string, unknown>)._deserializers = [];
    capturedVerify = null;

    userRepo = {
      findById: vi.fn().mockResolvedValue(existingUser),
      findByEmail: vi.fn().mockResolvedValue(null),
      findByGoogleId: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(existingUser),
      update: vi.fn().mockResolvedValue(existingUser),
    };
  });

  describe('serializeUser', () => {
    it('should serialize user to their id', () => {
      configurePassport({ clientId: '', clientSecret: '', callbackUrl: '' }, userRepo);

      const done = vi.fn();
      passport.serializeUser(existingUser, done);

      expect(done).toHaveBeenCalledWith(null, 'user-1');
    });
  });

  describe('deserializeUser', () => {
    it('should deserialize user by id lookup', async () => {
      configurePassport({ clientId: '', clientSecret: '', callbackUrl: '' }, userRepo);

      const done = vi.fn();
      await new Promise<void>((resolve) => {
        passport.deserializeUser('user-1', (err, user) => {
          done(err, user);
          resolve();
        });
      });

      expect(userRepo.findById).toHaveBeenCalledWith('user-1');
      expect(done).toHaveBeenCalledWith(null, existingUser);
    });

    it('should call done with error when findById throws', async () => {
      vi.mocked(userRepo.findById).mockRejectedValue(new Error('DB error'));
      configurePassport({ clientId: '', clientSecret: '', callbackUrl: '' }, userRepo);

      const done = vi.fn();
      await new Promise<void>((resolve) => {
        passport.deserializeUser('user-1', (err, user) => {
          done(err, user);
          resolve();
        });
      });

      expect(done).toHaveBeenCalledWith(expect.any(Error), null);
    });
  });

  describe('GoogleStrategy - not configured when credentials are empty', () => {
    it('should not invoke GoogleStrategy constructor when clientId is empty', async () => {
      const { Strategy } = vi.mocked(await import('passport-google-oauth20'));
      const callsBefore = Strategy.mock.calls.length;

      configurePassport({ clientId: '', clientSecret: '', callbackUrl: '' }, userRepo);

      expect(Strategy.mock.calls.length).toBe(callsBefore);
    });
  });

  describe('GoogleStrategy verify callback', () => {
    beforeEach(() => {
      configurePassport(
        { clientId: 'client-id', clientSecret: 'client-secret', callbackUrl: 'https://cb' },
        userRepo,
      );
    });

    const runExistingEmailLinkFlow = async (name: string, expectedName: string) => {
      vi.mocked(userRepo.findByGoogleId).mockResolvedValue(null);
      const emailUser = new User('email-user', 'new@google.com', 'hashed', name);
      vi.mocked(userRepo.findByEmail).mockResolvedValue(emailUser);
      const updatedUser = new User(
        'email-user',
        'new@google.com',
        'hashed',
        expectedName,
        'google-profile-id',
      );
      vi.mocked(userRepo.update).mockResolvedValue(updatedUser);

      const done = vi.fn();
      await capturedVerify?.('_access', '_refresh', makeProfile(), done);

      return { done, updatedUser };
    };

    it('should return existing user when found by googleId', async () => {
      vi.mocked(userRepo.findByGoogleId).mockResolvedValue(existingUser);

      const done = vi.fn();
      await capturedVerify?.('_access', '_refresh', makeProfile(), done);

      expect(done).toHaveBeenCalledWith(null, existingUser);
    });

    it('should link Google account to existing email user and return updated user', async () => {
      const { done, updatedUser } = await runExistingEmailLinkFlow(
        'Existing Name',
        'Existing Name',
      );

      expect(userRepo.update).toHaveBeenCalled();
      expect(done).toHaveBeenCalledWith(null, updatedUser);
    });

    it('should use profile displayName when existing email user has no name', async () => {
      const { done, updatedUser } = await runExistingEmailLinkFlow('', 'New Google User');

      expect(userRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Google User' }),
      );
      expect(done).toHaveBeenCalledWith(null, updatedUser);
    });

    it('should create a new user when neither googleId nor email is found', async () => {
      vi.mocked(userRepo.findByGoogleId).mockResolvedValue(null);
      vi.mocked(userRepo.findByEmail).mockResolvedValue(null);
      const savedUser = new User(
        'new-id',
        'new@google.com',
        '',
        'New Google User',
        'google-profile-id',
      );
      vi.mocked(userRepo.save).mockResolvedValue(savedUser);

      const done = vi.fn();
      await capturedVerify?.('_access', '_refresh', makeProfile(), done);

      expect(userRepo.save).toHaveBeenCalled();
      expect(done).toHaveBeenCalledWith(null, savedUser);
    });

    it('should call done with error when profile has no emails array', async () => {
      const done = vi.fn();
      await capturedVerify?.('_access', '_refresh', makeProfile({ emails: [] }), done);

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'No email found in Google profile' }),
        undefined,
      );
    });

    it('should call done with error when profile email value is empty string', async () => {
      const done = vi.fn();
      await capturedVerify?.(
        '_access',
        '_refresh',
        makeProfile({ emails: [{ value: '', verified: 'true' }] }),
        done,
      );

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Invalid email in Google profile' }),
        undefined,
      );
    });

    it('should call done with error when userRepo.findByGoogleId throws', async () => {
      vi.mocked(userRepo.findByGoogleId).mockRejectedValue(new Error('DB failure'));

      const done = vi.fn();
      await capturedVerify?.('_access', '_refresh', makeProfile(), done);

      expect(done).toHaveBeenCalledWith(expect.any(Error), undefined);
    });
  });
});
