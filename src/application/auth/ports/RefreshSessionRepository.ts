import type { RefreshSession } from '../../../domain/auth/RefreshSession.js';

export interface RefreshSessionRepository {
  save(session: RefreshSession): Promise<RefreshSession>;
  findByTokenHash(tokenHash: string): Promise<RefreshSession | null>;
  revokeById(id: string): Promise<void>;
  revokeByFamily(tokenFamily: string): Promise<void>;
  revokeAllByUserId(userId: string): Promise<void>;
}
