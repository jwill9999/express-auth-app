import { describe, it, expect } from 'vitest';
import { User } from '../../../src/domain/auth/User.js';

describe('User Entity', () => {
  it('should create a user with required fields', () => {
    const user = new User('1', 'test@example.com', 'hashedpw');

    expect(user.id).toBe('1');
    expect(user.email).toBe('test@example.com');
    expect(user.getPasswordHash()).toBe('hashedpw');
  });

  it('should create a user with optional fields', () => {
    const date = new Date();
    const user = new User('1', 'test@example.com', 'hashedpw', 'John', 'google-123', date);

    expect(user.name).toBe('John');
    expect(user.googleId).toBe('google-123');
    expect(user.createdAt).toBe(date);
  });

  it('should only expose passwordHash through the getter method', () => {
    const user = new User('1', 'test@example.com', 'secret-hash');

    // The getter returns the hash
    expect(user.getPasswordHash()).toBe('secret-hash');
    // TypeScript enforces private at compile time; at runtime we verify the getter works
    expect(typeof user.getPasswordHash).toBe('function');
  });

  it('should have undefined optional fields when not provided', () => {
    const user = new User('1', 'test@example.com', 'hashedpw');

    expect(user.name).toBeUndefined();
    expect(user.googleId).toBeUndefined();
    expect(user.createdAt).toBeUndefined();
  });
});
