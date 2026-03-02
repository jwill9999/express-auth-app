import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import {
  MongoUserRepository,
  UserModel,
} from '../../src/infrastructure/auth/repositories/MongoUserRepository.js';
import { User } from '../../src/domain/auth/User.js';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await UserModel.syncIndexes();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await UserModel.deleteMany({});
});

describe('MongoUserRepository (integration)', () => {
  const repo = new MongoUserRepository();

  const makeUser = (email = 'test@example.com') =>
    new User('', email, 'hashed-password', 'Test User', undefined, new Date());

  describe('save', () => {
    it('persists a user and returns it with an assigned id', async () => {
      const user = makeUser();
      const saved = await repo.save(user);

      expect(saved.id).toBeTruthy();
      expect(saved.email).toBe('test@example.com');
    });

    it('lowercases the email on save', async () => {
      const user = makeUser('UPPER@Example.COM');
      const saved = await repo.save(user);

      expect(saved.email).toBe('upper@example.com');
    });

    it('enforces unique email constraint', async () => {
      await repo.save(makeUser());
      await expect(repo.save(makeUser())).rejects.toThrow();
    });
  });

  describe('findByEmail', () => {
    it('returns the user when found', async () => {
      await repo.save(makeUser());
      const found = await repo.findByEmail('test@example.com');

      expect(found).not.toBeNull();
      expect(found?.email).toBe('test@example.com');
    });

    it('returns null when not found', async () => {
      const found = await repo.findByEmail('nobody@example.com');
      expect(found).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns the user when found', async () => {
      const saved = await repo.save(makeUser());
      const found = await repo.findById(saved.id);

      expect(found?.id).toBe(saved.id);
    });

    it('returns null for unknown id', async () => {
      const found = await repo.findById(new mongoose.Types.ObjectId().toString());
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('updates name and persists the change', async () => {
      const saved = await repo.save(makeUser());
      const updated = new User(saved.id, saved.email, 'hashed-password', 'New Name');
      const result = await repo.update(updated);

      expect(result.name).toBe('New Name');
    });
  });
});
