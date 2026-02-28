export interface RefreshTokenProvider {
  generateRefreshToken(userId: string, tokenFamily: string): string;
  verifyRefreshToken(token: string): { userId: string; family: string } | null;
  hashToken(token: string): string;
}
