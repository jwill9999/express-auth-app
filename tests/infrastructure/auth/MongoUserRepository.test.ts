import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MongoUserRepository,
  UserModel,
} from '../../../src/infrastructure/auth/repositories/MongoUserRepository.js';
import { User } from '../../../src/domain/auth/User.js';

const DEFAULT_HASH = 'hash-value-123';
const buildHashValue = (): string => `hash-${crypto.randomUUID()}`;

// Helper to create a mock Mongoose document resembling a UserDocument
const makeUserDoc = (overrides = {}) => ({
  _id: { toString: () => 'user-id-1' },
  email: 'test@example.com',
  password: DEFAULT_HASH,
  name: 'Test User',
  googleId: undefined as string | undefined,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

describe('MongoUserRepository', () => {
  let repo: MongoUserRepository;

  beforeEach(() => {
    repo = new MongoUserRepository();
    vi.restoreAllMocks();
  });

  describe('findById', () => {
    it('should return null when document is not found', async () => {
      vi.spyOn(UserModel, 'findById').mockResolvedValue(null as never);

      const result = await repo.findById('nonexistent-id');

      expect(result).toBeNull();
      expect(UserModel.findById).toHaveBeenCalledWith('nonexistent-id');
    });

    it('should return a User domain object when document is found', async () => {
      vi.spyOn(UserModel, 'findById').mockResolvedValue(makeUserDoc() as never);

      const result = await repo.findById('user-id-1');

      expect(result).toBeInstanceOf(User);
      expect(result?.id).toBe('user-id-1');
      expect(result?.email).toBe('test@example.com');
      expect(result?.name).toBe('Test User');
      expect(result?.getPasswordHash()).toBe(DEFAULT_HASH);
    });

    it('should map googleId when present', async () => {
      vi.spyOn(UserModel, 'findById').mockResolvedValue(
        makeUserDoc({ googleId: 'google-123' }) as never,
      );

      const result = await repo.findById('user-id-1');

      expect(result?.googleId).toBe('google-123');
    });

    it('should use empty string for password when document has no password field', async () => {
      vi.spyOn(UserModel, 'findById').mockResolvedValue(
        makeUserDoc({ password: undefined }) as never,
      );

      const result = await repo.findById('user-id-1');

      expect(result?.getPasswordHash()).toBe('');
    });
  });

  describe('findByEmail', () => {
    it('should return null when no user with that email exists', async () => {
      vi.spyOn(UserModel, 'findOne').mockResolvedValue(null as never);

      const result = await repo.findByEmail('unknown@example.com');

      expect(result).toBeNull();
      expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'unknown@example.com' });
    });

    it('should return a User when found by email', async () => {
      vi.spyOn(UserModel, 'findOne').mockResolvedValue(makeUserDoc() as never);

      const result = await repo.findByEmail('test@example.com');

      expect(result).toBeInstanceOf(User);
      expect(result?.email).toBe('test@example.com');
    });
  });

  describe('findByGoogleId', () => {
    it('should return null when no user with that Google ID exists', async () => {
      vi.spyOn(UserModel, 'findOne').mockResolvedValue(null as never);

      const result = await repo.findByGoogleId('google-xyz');

      expect(result).toBeNull();
      expect(UserModel.findOne).toHaveBeenCalledWith({ googleId: 'google-xyz' });
    });

    it('should return a User when found by Google ID', async () => {
      vi.spyOn(UserModel, 'findOne').mockResolvedValue(
        makeUserDoc({ googleId: 'google-xyz' }) as never,
      );

      const result = await repo.findByGoogleId('google-xyz');

      expect(result).toBeInstanceOf(User);
      expect(result?.googleId).toBe('google-xyz');
    });
  });

  describe('save', () => {
    it('should create a document and return a User domain object', async () => {
      vi.spyOn(UserModel, 'create').mockResolvedValue(
        makeUserDoc({ _id: { toString: () => 'new-id' } }) as never,
      );

      const newUser = new User('', 'new@example.com', 'hashed', 'New User');
      const result = await repo.save(newUser);

      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe('new-id');
      expect(UserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@example.com' }),
      );
    });

    it('should pass googleId and name when saving a Google user', async () => {
      vi.spyOn(UserModel, 'create').mockResolvedValue(
        makeUserDoc({ googleId: 'g-id', name: 'Google User' }) as never,
      );

      const googleUser = new User('', 'g@example.com', '', 'Google User', 'g-id');
      await repo.save(googleUser);

      expect(UserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ googleId: 'g-id', name: 'Google User', password: undefined }),
      );
    });
  });

  describe('update', () => {
    it('should update a user document and return updated User', async () => {
      vi.spyOn(UserModel, 'findByIdAndUpdate').mockResolvedValue(makeUserDoc() as never);

      const user = new User('user-id-1', 'test@example.com', buildHashValue(), 'Test User');
      const result = await repo.update(user);

      expect(result).toBeInstanceOf(User);
      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user-id-1',
        expect.objectContaining({ email: 'test@example.com' }),
        { new: true },
      );
    });

    it('should include password in update when user has a password hash', async () => {
      vi.spyOn(UserModel, 'findByIdAndUpdate').mockResolvedValue(makeUserDoc() as never);

      const updatedHash = buildHashValue();
      const user = new User('user-id-1', 'test@example.com', updatedHash);
      await repo.update(user);

      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user-id-1',
        expect.objectContaining({ password: updatedHash }),
        { new: true },
      );
    });

    it('should not include password in update when user has no password hash', async () => {
      vi.spyOn(UserModel, 'findByIdAndUpdate').mockResolvedValue(makeUserDoc() as never);

      const user = new User('user-id-1', 'g@example.com', '', 'G User', 'g-id');
      await repo.update(user);

      const callArgs = vi.mocked(UserModel.findByIdAndUpdate).mock.calls[0];
      expect(callArgs?.[1]).not.toHaveProperty('password');
    });

    it('should throw when document is not found during update', async () => {
      vi.spyOn(UserModel, 'findByIdAndUpdate').mockResolvedValue(null as never);

      const user = new User('nonexistent', 'x@example.com', buildHashValue());
      await expect(repo.update(user)).rejects.toThrow('User not found');
    });
  });
});
