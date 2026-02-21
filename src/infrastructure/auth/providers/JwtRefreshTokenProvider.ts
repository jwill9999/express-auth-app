import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import type { RefreshTokenProvider } from '../../../application/auth/ports/RefreshTokenProvider.js';

export class JwtRefreshTokenProvider implements RefreshTokenProvider {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string = '7d',
  ) {}

  generateRefreshToken(userId: string, sessionId: string, tokenFamily: string): string {
    return jwt.sign(
      { userId, sid: sessionId, family: tokenFamily, jti: crypto.randomUUID() },
      this.secret,
      { expiresIn: this.expiresIn } as jwt.SignOptions,
    );
  }

  verifyRefreshToken(token: string): { userId: string; sid: string; family: string } | null {
    try {
      const decoded = jwt.verify(token, this.secret) as {
        userId: string;
        sid: string;
        family: string;
      };
      return { userId: decoded.userId, sid: decoded.sid, family: decoded.family };
    } catch {
      return null;
    }
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
