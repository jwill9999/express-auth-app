import type { RefreshSession } from '../../../domain/auth/RefreshSession.js';

export interface RefreshSessionRepository {
  save(session: RefreshSession): Promise<RefreshSession>;
  findByTokenHash(tokenHash: string): Promise<RefreshSession | null>;
  /** Atomically revokes the session only if it is not already revoked.
   *  Returns true if the session was revoked by this call, false if it was
   *  already revoked (e.g. by a concurrent rotation request). */
  revokeById(id: string): Promise<boolean>;
  revokeByFamily(tokenFamily: string): Promise<void>;
  revokeAllByUserId(userId: string): Promise<void>;
}
