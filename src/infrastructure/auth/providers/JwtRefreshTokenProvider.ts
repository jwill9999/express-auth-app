import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import type { RefreshTokenProvider } from '../../../application/auth/ports/RefreshTokenProvider.js';

export class JwtRefreshTokenProvider implements RefreshTokenProvider {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string = '7d',
  ) {}

  generateRefreshToken(userId: string, tokenFamily: string): string {
    return jwt.sign({ userId, family: tokenFamily, jti: crypto.randomUUID() }, this.secret, {
      expiresIn: this.expiresIn,
    } as jwt.SignOptions);
  }

  verifyRefreshToken(token: string): { userId: string; family: string } | null {
    try {
      const decoded = jwt.verify(token, this.secret) as {
        userId: string;
        family: string;
      };
      return { userId: decoded.userId, family: decoded.family };
    } catch {
      return null;
    }
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
