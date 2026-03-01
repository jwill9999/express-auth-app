# Authentication Architecture

## Overview

The API uses a **dual-token system** with short-lived access tokens and rotating refresh tokens. Both email/password and Google OAuth logins share the same token lifecycle.

```
┌──────────┐         ┌──────────────┐         ┌──────────┐
│  Client  │──login──▶  Auth API    │──save───▶  MongoDB  │
│          │◀─────────│              │◀─────────│          │
│          │ access   │  • access    │ session  │  users   │
│          │ token    │    token     │  record  │  refresh │
│          │ (body)   │  • refresh   │          │  sessions│
│          │ refresh  │    session   │          │          │
│          │ token    │              │          │          │
│          │ (cookie) │              │          │          │
└──────────┘         └──────────────┘         └──────────┘
```

## Token Types

| Property | Access Token | Refresh Token |
|----------|-------------|---------------|
| **Purpose** | Authorize API requests | Obtain new access tokens |
| **Default TTL** | 5 minutes | 7 days |
| **Transport** | `Authorization: Bearer <token>` header | Secure httpOnly cookie |
| **Storage (client)** | In-memory (JS variable) | Browser cookie jar (not accessible to JS) |
| **Storage (server)** | Stateless (not stored) | SHA-256 hash stored in MongoDB |
| **Revocable** | No (short-lived, expires naturally) | Yes (revoked in database) |
| **JWT claims** | `{ id, email, iat, exp }` | `{ userId, family, jti, iat, exp }` |

## Authentication Flows

### 1. Login (Email/Password or Google OAuth)

Both login methods produce the same token pair:

```
Client                    API                       MongoDB
  │                        │                          │
  │──POST /auth/login─────▶│                          │
  │  { email, password }   │──findByEmail────────────▶│
  │                        │◀─────────user────────────│
  │                        │                          │
  │                        │  verify password (bcrypt) │
  │                        │  generate access token    │
  │                        │  generate refresh token   │
  │                        │  hash refresh token       │
  │                        │                          │
  │                        │──save RefreshSession─────▶│
  │                        │  { userId, tokenFamily,   │
  │                        │    tokenHash, expiresAt } │
  │                        │                          │
  │◀───200 OK──────────────│                          │
  │  Body: { token }       │                          │
  │  Cookie: refreshToken  │                          │
  │  (httpOnly, secure)    │                          │
```

Google OAuth follows the same pattern — after Passport authenticates the user via Google, the callback handler creates the same access + refresh token pair.

### 2. Accessing Protected Resources

```
Client                    API
  │                        │
  │──GET /api/data─────────▶│
  │  Authorization:         │
  │  Bearer <accessToken>   │
  │                        │
  │  AuthMiddleware:        │
  │  1. Extract Bearer token│
  │  2. Verify JWT signature│
  │  3. Attach user to req  │
  │                        │
  │◀───200 OK──────────────│
  │  { data }              │
```

No database lookup is needed — access tokens are stateless JWTs.

### 3. Token Refresh (Rotation)

When the access token expires, the client calls `/auth/refresh`. The old refresh token is revoked **atomically** and a new pair is issued **within the same token family**:

```
Client                    API                       MongoDB
  │                        │                          │
  │──POST /auth/refresh───▶│                          │
  │  Cookie: refreshToken  │                          │
  │                        │  verify JWT signature     │
  │                        │  hash token               │
  │                        │                          │
  │                        │──findByTokenHash─────────▶│
  │                        │◀──RefreshSession──────────│
  │                        │                          │
  │                        │  check: not revoked?      │
  │                        │  check: not expired?      │
  │                        │                          │
  │                        │──revokeById (atomic) ────▶│
  │                        │  findOneAndUpdate         │
  │                        │  { _id, revoked: false }  │
  │                        │◀── true (won race) ───────│
  │                        │                          │
  │                        │  generate new access token │
  │                        │  generate new refresh token│
  │                        │  (same tokenFamily)       │
  │                        │                          │
  │                        │──save new RefreshSession──▶│
  │                        │                          │
  │◀───200 OK──────────────│                          │
  │  Body: { token }       │                          │
  │  Cookie: new refresh   │                          │
```

**Concurrent request handling**: `revokeById` uses `findOneAndUpdate({ _id, revoked: false })` so only one concurrent caller can win the atomic revocation. If `revokeById` returns `false` (session already revoked by a concurrent rotation), the request throws `SessionNotFoundError` **without revoking the family** — this is a benign race, not a replay attack.

### 4. Reuse Detection

If a previously-rotated refresh token is replayed (e.g., stolen by an attacker), the API detects reuse and **revokes the entire token family**, protecting all sessions in that lineage:

```
Client (attacker)         API                       MongoDB
  │                        │                          │
  │──POST /auth/refresh───▶│                          │
  │  Cookie: OLD refresh   │                          │
  │                        │  verify JWT ✓             │
  │                        │  hash token               │
  │                        │                          │
  │                        │──findByTokenHash─────────▶│
  │                        │◀──null OR revoked─────────│
  │                        │                          │
  │                        │  ⚠ REUSE DETECTED         │
  │                        │                          │
  │                        │──revokeByFamily───────────▶│
  │                        │  (revokes ALL tokens in   │
  │                        │   this family)            │
  │                        │                          │
  │◀───401 Unauthorized────│                          │
  │  "Refresh token reuse  │                          │
  │   detected"            │                          │
```

This forces the legitimate user to re-authenticate, but prevents the attacker from using any tokens in that family.

## Logout & Revocation

| Endpoint | Scope | Who can call | What happens |
|----------|-------|-------------|--------------|
| `POST /auth/logout` | Current session | Anyone with a refresh token | Revokes the single refresh session, clears cookie |
| `POST /auth/logout-all` | All sessions | Authenticated user (Bearer token) | Revokes all refresh sessions for the user |
| `POST /auth/admin/revoke` | All sessions for a target user | Admin (requires `{ userId }` in body) | Revokes all refresh sessions for the target user |

After any logout, the user's existing access tokens remain valid until they expire (max 5 minutes), but no new access tokens can be obtained.

## Token Family Model

Each login creates a new **token family** (a random UUID). Every refresh within that session reuses the same family ID. This enables:

- **Reuse detection**: If a token not in the DB is presented but has a valid family, all tokens in that family are revoked.
- **Per-session revocation**: Logging out one device only affects that device's family.
- **Full revocation**: Logout-all revokes all families for a user.

```
Login → family: "abc-123"
  ├─ Refresh Token v1 (revoked after use)
  ├─ Refresh Token v2 (revoked after use)
  ├─ Refresh Token v3 (current)
  └─ ... (chain continues until logout or expiry)
```

## Security Properties

| Threat | Mitigation |
|--------|-----------|
| Concurrent refresh requests (two tabs racing) | Atomic `revokeById` (`findOneAndUpdate({ revoked: false })`) — only one caller wins; the other gets `SessionNotFoundError` without family revocation |
| XSS stealing refresh token | httpOnly cookie — not accessible to JavaScript |
| Replay attack (stolen refresh token) | Rotation + reuse detection → family revocation |
| Long-lived token exposure | Access tokens expire in 5 minutes |
| CSRF on refresh endpoint | `SameSite=Strict` cookie + `/auth` path scope |
| Database leak of refresh tokens | Only SHA-256 hashes stored, not raw tokens |
| Forgotten session on shared device | Logout-all revokes every session |
| Compromised account | Admin revoke kills all sessions immediately |

## Database: RefreshSession Collection

```typescript
{
  _id: ObjectId,
  userId: string,          // references users._id
  tokenFamily: string,     // UUID, shared across rotations
  tokenHash: string,       // SHA-256 of the refresh JWT
  expiresAt: Date,         // 7 days from creation
  createdAt: Date,
  revoked: boolean         // true after rotation, logout, or reuse detection
}
```

**Indexes:**
- `userId` — fast lookup for logout-all
- `tokenFamily` — fast lookup for family revocation
- `tokenHash` — unique, fast lookup on refresh
- `expiresAt` — TTL index for automatic cleanup of expired sessions

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `JWT_SECRET` | — | Secret for signing access tokens |
| `JWT_EXPIRES_IN` | `5m` | Access token lifetime |
| `REFRESH_TOKEN_SECRET` | `JWT_SECRET` | Secret for signing refresh tokens |
| `REFRESH_TOKEN_EXPIRES_IN` | `7d` | Refresh token JWT lifetime |
| `REFRESH_TOKEN_TTL_MS` | `604800000` (7d) | Refresh session DB TTL in milliseconds |

## Clean Architecture Mapping

| Concept | Layer | File |
|---------|-------|------|
| `RefreshSession` entity | Domain | `src/domain/auth/RefreshSession.ts` |
| Session errors | Domain | `src/domain/auth/errors.ts` |
| `RefreshSessionRepository` port | Application | `src/application/auth/ports/RefreshSessionRepository.ts` |
| `RefreshTokenProvider` port | Application | `src/application/auth/ports/RefreshTokenProvider.ts` |
| `RefreshSessionUseCase` | Application | `src/application/auth/use-cases/RefreshSession.ts` |
| `LogoutCurrentSession` | Application | `src/application/auth/use-cases/LogoutCurrentSession.ts` |
| `LogoutAllSessions` | Application | `src/application/auth/use-cases/LogoutAllSessions.ts` |
| `AdminRevokeSessions` | Application | `src/application/auth/use-cases/AdminRevokeSessions.ts` |
| `MongoRefreshSessionRepository` | Infrastructure | `src/infrastructure/auth/repositories/MongoRefreshSessionRepository.ts` |
| `JwtRefreshTokenProvider` | Infrastructure | `src/infrastructure/auth/providers/JwtRefreshTokenProvider.ts` |
| Endpoints + cookies | Interface | `src/interfaces/http/controllers/AuthController.ts` |

---

**Last Updated:** 2026-02-28
**Author:** Development Team
