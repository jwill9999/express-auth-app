import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleOAuthLogin } from '../../../src/application/auth/use-cases/GoogleOAuthLogin.js';
import type { TokenProvider } from '../../../src/application/auth/ports/TokenProvider.js';
import type { CreateRefreshSession } from '../../../src/application/auth/use-cases/CreateRefreshSession.js';

describe('GoogleOAuthLogin Use Case', () => {
  let useCase: GoogleOAuthLogin;
  let tokenProvider: TokenProvider;
  let createRefreshSession: CreateRefreshSession;

  const googleUser = { id: 'google-123', email: 'google@example.com', name: 'Google User' };

  beforeEach(() => {
    tokenProvider = {
      generate: vi.fn().mockReturnValue('access-token-abc'),
      verify: vi.fn(),
    };

    createRefreshSession = {
      execute: vi.fn().mockResolvedValue('refresh-token-xyz'),
    } as unknown as CreateRefreshSession;

    useCase = new GoogleOAuthLogin(tokenProvider, createRefreshSession);
  });

  it('should return an access token for the authenticated user', async () => {
    const result = await useCase.execute(googleUser);
    expect(result.token).toBe('access-token-abc');
    expect(tokenProvider.generate).toHaveBeenCalledWith('google-123', 'google@example.com');
  });

  it('should return a refresh token when createRefreshSession is provided', async () => {
    const result = await useCase.execute(googleUser);
    expect(result.refreshToken).toBe('refresh-token-xyz');
    expect(createRefreshSession.execute).toHaveBeenCalledWith('google-123');
  });

  it('should not return a refresh token when createRefreshSession is not provided', async () => {
    useCase = new GoogleOAuthLogin(tokenProvider);
    const result = await useCase.execute(googleUser);
    expect(result.refreshToken).toBeUndefined();
  });

  it('should map user data correctly in the result', async () => {
    const result = await useCase.execute(googleUser);
    expect(result.user.id).toBe('google-123');
    expect(result.user.email).toBe('google@example.com');
    expect(result.user.name).toBe('Google User');
  });

  it('should handle a user without a name', async () => {
    const result = await useCase.execute({ id: 'google-123', email: 'google@example.com' });
    expect(result.user.name).toBeUndefined();
  });
});
