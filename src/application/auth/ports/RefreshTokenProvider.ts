export interface RefreshTokenProvider {
  generateRefreshToken(userId: string, sessionId: string, tokenFamily: string): string;
  verifyRefreshToken(token: string): { userId: string; sid: string; family: string } | null;
  hashToken(token: string): string;
}
