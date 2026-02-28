import { describe, it, expect } from 'vitest';
import { JwtRefreshTokenProvider } from '../../../src/infrastructure/auth/providers/JwtRefreshTokenProvider.js';

describe('JwtRefreshTokenProvider', () => {
  const secret = 'test-refresh-secret';
  const provider = new JwtRefreshTokenProvider(secret, '1h');

  it('should generate a refresh token as a JWT string', () => {
    const token = provider.generateRefreshToken('user-1', 'family-1');
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('should verify a valid refresh token and return payload', () => {
    const token = provider.generateRefreshToken('user-1', 'family-1');
    const result = provider.verifyRefreshToken(token);

    expect(result).not.toBeNull();
    expect(result!.userId).toBe('user-1');
    expect(result!.family).toBe('family-1');
  });

  it('should return null for an invalid token', () => {
    const result = provider.verifyRefreshToken('invalid.token.value');
    expect(result).toBeNull();
  });

  it('should return null for a token signed with different secret', () => {
    const otherProvider = new JwtRefreshTokenProvider('other-secret');
    const token = otherProvider.generateRefreshToken('user-1', 'family-1');
    const result = provider.verifyRefreshToken(token);
    expect(result).toBeNull();
  });

  it('should produce a consistent hash for the same token', () => {
    const token = 'some-token-value';
    const hash1 = provider.hashToken(token);
    const hash2 = provider.hashToken(token);
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different tokens', () => {
    const hash1 = provider.hashToken('token-a');
    const hash2 = provider.hashToken('token-b');
    expect(hash1).not.toBe(hash2);
  });

  it('should generate different tokens each call (unique jti)', () => {
    const token1 = provider.generateRefreshToken('user-1', 'family-1');
    const token2 = provider.generateRefreshToken('user-1', 'family-1');
    expect(token1).not.toBe(token2);
  });
});
