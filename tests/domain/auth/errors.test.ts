import { describe, it, expect } from 'vitest';
import {
  InvalidCredentialsError,
  UserAlreadyExistsError,
  ValidationError,
} from '../../../src/domain/auth/errors.js';

describe('Domain Errors', () => {
  describe('InvalidCredentialsError', () => {
    it('should have correct name and message', () => {
      const error = new InvalidCredentialsError();

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('InvalidCredentialsError');
      expect(error.message).toBe('Invalid credentials');
    });
  });

  describe('UserAlreadyExistsError', () => {
    it('should have correct name and message', () => {
      const error = new UserAlreadyExistsError();

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('UserAlreadyExistsError');
      expect(error.message).toBe('User already exists');
    });
  });

  describe('ValidationError', () => {
    it('should have correct name and custom message', () => {
      const error = new ValidationError('Email is required');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Email is required');
    });
  });
});
