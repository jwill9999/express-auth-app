import mongoose, { Document, Schema, Model } from 'mongoose';
import { RefreshSession } from '../../../domain/auth/RefreshSession.js';
import type { RefreshSessionRepository } from '../../../application/auth/ports/RefreshSessionRepository.js';

interface RefreshSessionDocument extends Document {
  userId: string;
  tokenFamily: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revoked: boolean;
}

const refreshSessionSchema = new Schema<RefreshSessionDocument>({
  userId: { type: String, required: true, index: true },
  tokenFamily: { type: String, required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  revoked: { type: Boolean, default: false },
});

// TTL index to auto-remove expired sessions
refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshSessionModel: Model<RefreshSessionDocument> =
  mongoose.model<RefreshSessionDocument>('RefreshSession', refreshSessionSchema);

function toDomain(doc: RefreshSessionDocument): RefreshSession {
  return new RefreshSession(
    doc._id.toString(),
    doc.userId,
    doc.tokenFamily,
    doc.tokenHash,
    doc.expiresAt,
    doc.createdAt,
    doc.revoked,
  );
}

export class MongoRefreshSessionRepository implements RefreshSessionRepository {
  async save(session: RefreshSession): Promise<RefreshSession> {
    const doc = await RefreshSessionModel.create({
      userId: session.userId,
      tokenFamily: session.tokenFamily,
      tokenHash: session.tokenHash,
      expiresAt: session.expiresAt,
      revoked: session.revoked,
    });
    return toDomain(doc);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshSession | null> {
    const doc = await RefreshSessionModel.findOne({ tokenHash });
    return doc ? toDomain(doc) : null;
  }

  async revokeById(id: string): Promise<boolean> {
    const result = await RefreshSessionModel.findOneAndUpdate(
      { _id: id, revoked: false },
      { revoked: true },
    );
    return result !== null;
  }

  async revokeByFamily(tokenFamily: string): Promise<void> {
    await RefreshSessionModel.updateMany({ tokenFamily }, { revoked: true });
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await RefreshSessionModel.updateMany({ userId }, { revoked: true });
  }
}
