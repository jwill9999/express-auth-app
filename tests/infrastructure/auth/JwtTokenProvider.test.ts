import { describe, it, expect } from 'vitest';
import { JwtTokenProvider } from '../../../src/infrastructure/auth/providers/JwtTokenProvider.js';

describe('JwtTokenProvider', () => {
  const secret = 'test-secret-key-for-jwt';
  const provider = new JwtTokenProvider(secret, '1h');

  it('should generate a JWT token string', () => {
    const token = provider.generate('user-1', 'test@example.com');

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // header.payload.signature
  });

  it('should verify a valid token and return payload', () => {
    const token = provider.generate('user-1', 'test@example.com');
    const result = provider.verify(token);

    expect(result).not.toBeNull();
    expect(result!.id).toBe('user-1');
    expect(result!.email).toBe('test@example.com');
  });

  it('should return null for an invalid token', () => {
    const result = provider.verify('invalid.token.value');

    expect(result).toBeNull();
  });

  it('should return null for a token signed with a different secret', () => {
    const otherProvider = new JwtTokenProvider('different-secret');
    const token = otherProvider.generate('user-1', 'test@example.com');

    const result = provider.verify(token);
    expect(result).toBeNull();
  });
});
