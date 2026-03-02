import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import {
  MongoRefreshSessionRepository,
  RefreshSessionModel,
} from '../../src/infrastructure/auth/repositories/MongoRefreshSessionRepository.js';
import { RefreshSession } from '../../src/domain/auth/RefreshSession.js';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await RefreshSessionModel.syncIndexes();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await RefreshSessionModel.deleteMany({});
});

const makeSession = () => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return new RefreshSession('', 'user-1', 'family-abc', 'token-hash-xyz', expiresAt, new Date(), false);
};

describe('MongoRefreshSessionRepository (integration)', () => {
  const repo = new MongoRefreshSessionRepository();

  describe('save', () => {
    it('persists a session and returns it with an id', async () => {
      const session = makeSession();
      const saved = await repo.save(session);

      expect(saved.id).toBeTruthy();
      expect(saved.userId).toBe('user-1');
      expect(saved.tokenFamily).toBe('family-abc');
    });

    it('enforces unique tokenHash constraint', async () => {
      await repo.save(makeSession());
      await expect(repo.save(makeSession())).rejects.toThrow();
    });
  });

  describe('findByTokenHash', () => {
    it('returns the session for a known hash', async () => {
      await repo.save(makeSession());
      const found = await repo.findByTokenHash('token-hash-xyz');

      expect(found).not.toBeNull();
      expect(found?.tokenHash).toBe('token-hash-xyz');
    });

    it('returns null for an unknown hash', async () => {
      const found = await repo.findByTokenHash('no-such-hash');
      expect(found).toBeNull();
    });
  });

  describe('revokeByFamily', () => {
    it('marks all sessions in a family as revoked', async () => {
      const expiresAt = new Date(Date.now() + 86400000);
      await RefreshSessionModel.create([
        { userId: 'user-1', tokenFamily: 'family-abc', tokenHash: 'hash-1', expiresAt, revoked: false },
        { userId: 'user-1', tokenFamily: 'family-abc', tokenHash: 'hash-2', expiresAt, revoked: false },
        { userId: 'user-1', tokenFamily: 'family-xyz', tokenHash: 'hash-3', expiresAt, revoked: false },
      ]);

      await repo.revokeByFamily('family-abc');

      const revokedInFamily = await RefreshSessionModel.find({ tokenFamily: 'family-abc' });
      const otherFamily = await RefreshSessionModel.find({ tokenFamily: 'family-xyz' });

      expect(revokedInFamily.every((s) => s.revoked)).toBe(true);
      expect(otherFamily[0].revoked).toBe(false);
    });
  });

  describe('revokeAllByUserId', () => {
    it('revokes all sessions belonging to a user', async () => {
      const expiresAt = new Date(Date.now() + 86400000);
      await RefreshSessionModel.create([
        { userId: 'user-1', tokenFamily: 'fam-1', tokenHash: 'hash-a', expiresAt, revoked: false },
        { userId: 'user-1', tokenFamily: 'fam-2', tokenHash: 'hash-b', expiresAt, revoked: false },
        { userId: 'user-2', tokenFamily: 'fam-3', tokenHash: 'hash-c', expiresAt, revoked: false },
      ]);

      await repo.revokeAllByUserId('user-1');

      const user1Sessions = await RefreshSessionModel.find({ userId: 'user-1' });
      const user2Sessions = await RefreshSessionModel.find({ userId: 'user-2' });

      expect(user1Sessions.every((s) => s.revoked)).toBe(true);
      expect(user2Sessions[0].revoked).toBe(false);
    });
  });
});
