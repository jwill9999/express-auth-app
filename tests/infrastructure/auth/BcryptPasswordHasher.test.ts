import { describe, it, expect } from 'vitest';
import { BcryptPasswordHasher } from '../../../src/infrastructure/auth/providers/BcryptPasswordHasher.js';

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher();

  it('should hash a password and return a different string', async () => {
    const hash = await hasher.hash('Password1!');

    expect(hash).toBeDefined();
    expect(hash).not.toBe('Password1!');
  });

  it('should produce different hashes for the same password', async () => {
    const hash1 = await hasher.hash('Password1!');
    const hash2 = await hasher.hash('Password1!');

    expect(hash1).not.toBe(hash2); // bcrypt salts are random
  });

  it('should compare correctly with a valid password', async () => {
    const hash = await hasher.hash('Password1!');
    const result = await hasher.compare('Password1!', hash);

    expect(result).toBe(true);
  });

  it('should return false for an incorrect password', async () => {
    const hash = await hasher.hash('Password1!');
    const result = await hasher.compare('WrongPassword1!', hash);

    expect(result).toBe(false);
  });
});
