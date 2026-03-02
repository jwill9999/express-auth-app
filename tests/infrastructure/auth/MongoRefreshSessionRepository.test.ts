import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MongoRefreshSessionRepository,
  RefreshSessionModel,
} from '../../../src/infrastructure/auth/repositories/MongoRefreshSessionRepository.js';
import { RefreshSession } from '../../../src/domain/auth/RefreshSession.js';

const makeSessionDoc = (overrides = {}) => ({
  _id: { toString: () => 'session-id-1' },
  userId: 'user-id-1',
  tokenFamily: 'family-abc',
  tokenHash: 'hash-xyz',
  expiresAt: new Date(Date.now() + 60_000),
  createdAt: new Date(),
  revoked: false,
  ...overrides,
});

const makeSession = (overrides = {}) =>
  new RefreshSession(
    'session-id-1',
    'user-id-1',
    'family-abc',
    'hash-xyz',
    new Date(Date.now() + 60_000),
    new Date(),
    false,
    ...(Object.values(overrides) as []),
  );

describe('MongoRefreshSessionRepository', () => {
  let repo: MongoRefreshSessionRepository;

  beforeEach(() => {
    repo = new MongoRefreshSessionRepository();
    vi.restoreAllMocks();
  });

  describe('save', () => {
    it('should create a document and return a RefreshSession domain object', async () => {
      vi.spyOn(RefreshSessionModel, 'create').mockResolvedValue(makeSessionDoc() as never);

      const session = new RefreshSession(
        '',
        'user-id-1',
        'family-abc',
        'hash-xyz',
        new Date(Date.now() + 60_000),
        new Date(),
        false,
      );

      const result = await repo.save(session);

      expect(result).toBeInstanceOf(RefreshSession);
      expect(result.id).toBe('session-id-1');
      expect(result.userId).toBe('user-id-1');
      expect(result.tokenFamily).toBe('family-abc');
      expect(result.tokenHash).toBe('hash-xyz');
      expect(RefreshSessionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-id-1',
          tokenFamily: 'family-abc',
          tokenHash: 'hash-xyz',
        }),
      );
    });
  });

  describe('findByTokenHash', () => {
    it('should return null when no session with that token hash exists', async () => {
      vi.spyOn(RefreshSessionModel, 'findOne').mockResolvedValue(null as never);

      const result = await repo.findByTokenHash('unknown-hash');

      expect(result).toBeNull();
      expect(RefreshSessionModel.findOne).toHaveBeenCalledWith({ tokenHash: 'unknown-hash' });
    });

    it('should return a RefreshSession when found by token hash', async () => {
      vi.spyOn(RefreshSessionModel, 'findOne').mockResolvedValue(makeSessionDoc() as never);

      const result = await repo.findByTokenHash('hash-xyz');

      expect(result).toBeInstanceOf(RefreshSession);
      expect(result?.tokenHash).toBe('hash-xyz');
      expect(result?.revoked).toBe(false);
    });

    it('should map revoked=true from document', async () => {
      vi.spyOn(RefreshSessionModel, 'findOne').mockResolvedValue(
        makeSessionDoc({ revoked: true }) as never,
      );

      const result = await repo.findByTokenHash('hash-xyz');

      expect(result?.revoked).toBe(true);
    });
  });

  describe('revokeById', () => {
    it('should return true when session is found and revoked', async () => {
      vi.spyOn(RefreshSessionModel, 'findOneAndUpdate').mockResolvedValue(
        makeSessionDoc({ revoked: true }) as never,
      );

      const result = await repo.revokeById('session-id-1');

      expect(result).toBe(true);
      expect(RefreshSessionModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'session-id-1', revoked: false },
        { revoked: true },
      );
    });

    it('should return false when session is not found or already revoked', async () => {
      vi.spyOn(RefreshSessionModel, 'findOneAndUpdate').mockResolvedValue(null as never);

      const result = await repo.revokeById('nonexistent-id');

      expect(result).toBe(false);
    });
  });

  describe('revokeByFamily', () => {
    it('should call updateMany with the token family', async () => {
      vi.spyOn(RefreshSessionModel, 'updateMany').mockResolvedValue({ modifiedCount: 2 } as never);

      await repo.revokeByFamily('family-abc');

      expect(RefreshSessionModel.updateMany).toHaveBeenCalledWith(
        { tokenFamily: 'family-abc' },
        { revoked: true },
      );
    });
  });

  describe('revokeAllByUserId', () => {
    it('should call updateMany with the userId', async () => {
      vi.spyOn(RefreshSessionModel, 'updateMany').mockResolvedValue({ modifiedCount: 3 } as never);

      await repo.revokeAllByUserId('user-id-1');

      expect(RefreshSessionModel.updateMany).toHaveBeenCalledWith(
        { userId: 'user-id-1' },
        { revoked: true },
      );
    });
  });
});
