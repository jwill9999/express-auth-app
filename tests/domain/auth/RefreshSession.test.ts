import { describe, it, expect } from 'vitest';
import { RefreshSession } from '../../../src/domain/auth/RefreshSession.js';

describe('RefreshSession Entity', () => {
  const futureDate = new Date(Date.now() + 60_000);
  const pastDate = new Date(Date.now() - 60_000);
  const now = new Date();

  it('should create a refresh session with all fields', () => {
    const session = new RefreshSession('s1', 'u1', 'fam1', 'hash1', futureDate, now, false);

    expect(session.id).toBe('s1');
    expect(session.userId).toBe('u1');
    expect(session.tokenFamily).toBe('fam1');
    expect(session.tokenHash).toBe('hash1');
    expect(session.expiresAt).toBe(futureDate);
    expect(session.createdAt).toBe(now);
    expect(session.revoked).toBe(false);
  });

  it('should default revoked to false', () => {
    const session = new RefreshSession('s1', 'u1', 'fam1', 'hash1', futureDate, now);
    expect(session.revoked).toBe(false);
  });

  it('should report not expired when expiresAt is in the future', () => {
    const session = new RefreshSession('s1', 'u1', 'fam1', 'hash1', futureDate, now);
    expect(session.isExpired()).toBe(false);
  });

  it('should report expired when expiresAt is in the past', () => {
    const session = new RefreshSession('s1', 'u1', 'fam1', 'hash1', pastDate, now);
    expect(session.isExpired()).toBe(true);
  });

  it('should be valid when not revoked and not expired', () => {
    const session = new RefreshSession('s1', 'u1', 'fam1', 'hash1', futureDate, now, false);
    expect(session.isValid()).toBe(true);
  });

  it('should be invalid when revoked', () => {
    const session = new RefreshSession('s1', 'u1', 'fam1', 'hash1', futureDate, now, true);
    expect(session.isValid()).toBe(false);
  });

  it('should be invalid when expired', () => {
    const session = new RefreshSession('s1', 'u1', 'fam1', 'hash1', pastDate, now, false);
    expect(session.isValid()).toBe(false);
  });
});
