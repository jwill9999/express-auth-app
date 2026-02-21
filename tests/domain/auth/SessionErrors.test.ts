import { describe, it, expect } from 'vitest';
import {
  SessionNotFoundError,
  SessionExpiredError,
  SessionRevokedError,
  TokenReuseDetectedError,
} from '../../../src/domain/auth/errors.js';

describe('Session Lifecycle Errors', () => {
  describe('SessionNotFoundError', () => {
    it('should have correct name and message', () => {
      const error = new SessionNotFoundError();
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('SessionNotFoundError');
      expect(error.message).toBe('Refresh session not found');
    });
  });

  describe('SessionExpiredError', () => {
    it('should have correct name and message', () => {
      const error = new SessionExpiredError();
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('SessionExpiredError');
      expect(error.message).toBe('Refresh session has expired');
    });
  });

  describe('SessionRevokedError', () => {
    it('should have correct name and message', () => {
      const error = new SessionRevokedError();
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('SessionRevokedError');
      expect(error.message).toBe('Refresh session has been revoked');
    });
  });

  describe('TokenReuseDetectedError', () => {
    it('should have correct name and message', () => {
      const error = new TokenReuseDetectedError();
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('TokenReuseDetectedError');
      expect(error.message).toContain('reuse detected');
    });
  });
});
