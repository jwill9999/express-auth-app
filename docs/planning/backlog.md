# Project Backlog

Features, improvements, and tasks planned for future development.

**Total Items:** 17 | **High:** 3 | **Medium:** 5 | **Low:** 4 | **Tech Debt:** 4

---

## Quick Reference

| #   | Feature                          | Priority  | Effort | Est. Time | Status     | Details                             |
| --- | -------------------------------- | --------- | ------ | --------- | ---------- | ----------------------------------- |
| 1   | ~~Rate Limiting Middleware~~     | ~~🔴 High~~   | ~~Small~~  | ~~2-4h~~      | ✅ Done    | [↓](#rate-limiting-middleware)      |
| 2   | ~~Refresh Token Implementation~~ | ~~🔴 High~~ | ~~Medium~~ | ~~8-12h~~ | ✅ Done | [↓](#refresh-token-implementation)  |
| 2a  | Frontend Auth Integration        | 🔴 High   | Medium | 6-10h     | 📋 Planned | [↓](#frontend-auth-integration)     |
| 3   | Email Verification               | 🔴 High   | Large  | 16-20h    | 📋 Planned | [↓](#email-verification)            |
| 4   | ~~Automated Testing Suite~~      | ~~🟡 Medium~~ | ~~Large~~ | ~~20-30h~~ | ✅ Done    | [↓](#automated-testing-suite)        |
| 5   | Password Reset Flow              | 🟡 Medium | Medium | 10-14h    | 📋 Planned | [↓](#password-reset-flow)           |
| 6   | API Versioning                   | 🟡 Medium | Small  | 4-6h      | 📋 Planned | [↓](#api-versioning)                |
| 7   | Admin Dashboard Backend          | 🟡 Medium | Large  | 24-32h    | 📋 Planned | [↓](#admin-dashboard-backend)       |
| 10a | Redis Rate Limit Store           | 🟡 Medium | Small  | 2-4h      | 📋 Planned | [↓](#redis-rate-limit-store)        |
| 10b | Nginx Reverse Proxy Rate Limiting | 🟡 Medium | Small  | 2-3h      | 📋 Planned | [↓](#nginx-reverse-proxy-rate-limiting) |
| 8   | Two-Factor Authentication (2FA)  | 🟢 Low    | Large  | 20-24h    | 📋 Planned | [↓](#two-factor-authentication-2fa) |
| 9   | Social Login (GitHub, Microsoft) | 🟢 Low    | Medium | 8-12h     | 📋 Planned | [↓](#social-login-github-microsoft) |
| 10  | Redis Caching Layer              | 🟢 Low    | Medium | 10-14h    | 📋 Planned | [↓](#redis-caching-layer)           |
| 11  | Webhook System                   | 🟢 Low    | Large  | 20-30h    | 📋 Planned | [↓](#webhook-system)                |
| 12  | GraphQL API                      | 🟢 Low    | Large  | 30-40h    | 📋 Planned | [↓](#graphql-api)                   |

### Technical Debt & Improvements

| #   | Item                          | Priority  | Effort | Details                             |
| --- | ----------------------------- | --------- | ------ | ----------------------------------- |
| 13  | Code Organization Refactoring | 🟢 Low    | Small  | [↓](#code-organization-refactoring) |
| 14  | Performance Optimization      | 🟢 Low    | Medium | [↓](#performance-optimization)      |
| 15  | Security Enhancements         | 🟡 Medium | Small  | [↓](#security-enhancements)         |
| 16  | Documentation Improvements    | 🟢 Low    | Small  | [↓](#documentation-improvements)    |

> **Note:** When backlog exceeds 20 items, individual tasks will be moved to separate files in `backlog/` directory.

---

## 🔴 High Priority

### Rate Limiting Middleware

**Priority:** 🔴 High — ✅ **Completed 2026-03-01**
**Effort:** Small

**Description:**
Implemented `express-rate-limit` middleware protecting auth endpoints (5 req/15 min) and protected API endpoints (100 req/15 min). Returns `429 Too Many Requests` with `RateLimit-*` standard headers. Rate limiting is opt-out via `rateLimiting: false` in `AppDependencies` (used in tests).

**Acceptance Criteria:**

- [x] Install and configure express-rate-limit
- [x] Apply rate limiting to auth routes
- [x] Apply rate limiting to protected routes
- [x] Return proper 429 status codes
- [x] Add rate limit info to response headers (`RateLimit-*`)
- [x] Document rate limits in API docs (Swagger 429 responses + `RateLimitError` schema)
- [x] Add tests for rate limiting

**Related:**

- Security improvements
- API documentation updates

---

### Refresh Token Implementation

**Priority:** 🔴 High — ✅ **Completed 2026-02-21**  
**Effort:** Medium  

**Description:**  
Implemented as "JWT Lifecycle Hardening" — rotating refresh tokens with reuse detection, token-family revocation, per-device and all-device logout, and admin-forced revocation. See [index.md](index.md#jwt-lifecycle-hardening---2026-02-21) for full details.

**Acceptance Criteria:**

- [x] Create RefreshToken model (`RefreshSession` entity + `MongoRefreshSessionRepository`)
- [x] Modify login to return both tokens
- [x] Create POST /auth/refresh endpoint
- [x] Implement token rotation with reuse detection
- [x] Add logout endpoint to invalidate tokens (`/auth/logout`, `/auth/logout-all`, `/auth/admin/revoke`)
- [x] Update documentation
- [x] Add integration tests (45 new tests)

---

### Frontend Auth Integration

**Priority:** 🔴 High  
**Effort:** Medium  
**Dependencies:** Refresh Token Implementation (✅ Done)

**Description:**  
The backend now issues short-lived access tokens (5m) with rotating refresh tokens in httpOnly cookies. The frontend must be updated to work with this new token lifecycle — without these changes, users would be forced to re-login every 5 minutes.

**Background — what changed:**

| Before | After |
|--------|-------|
| Login returns a 24h access token | Login returns a 5m access token + httpOnly refresh cookie |
| Token stored in localStorage | Access token held in memory only; refresh token managed by browser cookie jar |
| No refresh mechanism needed | Must call `POST /auth/refresh` before access token expires |
| Logout = clear local token | Logout = call `POST /auth/logout` to revoke server-side session |

**What stays the same:**
- Login form → `POST /auth/login` (same request body)
- Register form → `POST /auth/register` (same request body)
- Google SSO → `GET /auth/google` redirect (same flow)
- Protected calls → `Authorization: Bearer <token>` header (same)

**Acceptance Criteria:**

#### 1. Credentials Mode
- [ ] All API calls to `/auth/*` include `credentials: 'include'` (fetch) or `withCredentials: true` (axios) so httpOnly cookies are sent

#### 2. In-Memory Token Storage
- [ ] Access token stored in a JS variable / reactive state (not localStorage or sessionStorage)
- [ ] On page reload, call `POST /auth/refresh` to restore the session from the cookie
- [ ] Clear in-memory token on logout

#### 3. Auth Interceptor (Auto-Refresh)
- [ ] Create an HTTP interceptor (axios interceptor or fetch wrapper) that:
  - Detects 401 responses on protected API calls
  - Calls `POST /auth/refresh` to obtain a new access token
  - Retries the original failed request with the new token
  - If refresh also fails (401), redirect to login
- [ ] Proactive refresh: optionally refresh the token before the 5m window expires (e.g., at 4m mark) to avoid latency on the first 401

#### 4. Refresh Queue (Race Condition Handling)
- [ ] If multiple API calls receive 401 simultaneously, only one triggers the refresh
- [ ] Other calls wait for the refresh to complete, then retry with the new token
- [ ] Prevent infinite refresh loops (e.g., max 1 retry per request)

#### 5. Logout Integration
- [ ] "Logout" button calls `POST /auth/logout` (with `credentials: 'include'` to send cookie)
- [ ] Clear in-memory access token and redirect to login
- [ ] Optionally add "Logout all devices" button that calls `POST /auth/logout-all` with `Authorization: Bearer <token>`

#### 6. Login / Register Response Handling
- [ ] On successful login/register, extract `token` from response body and store in memory
- [ ] Do NOT try to read the refresh token — it's set as an httpOnly cookie automatically
- [ ] Redirect to the authenticated area of the app

#### 7. Google SSO Callback
- [ ] After Google OAuth redirect, extract access token from response
- [ ] Refresh cookie is set automatically by the API — no additional handling needed

#### 8. Error Handling
- [ ] Handle `TokenReuseDetectedError` (401 with "reuse detected" message) — clear state and force full re-login
- [ ] Handle `SessionExpiredError` — redirect to login with appropriate message
- [ ] Handle network errors during refresh gracefully

**Implementation Notes:**

```typescript
// Example: Axios interceptor pattern
let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      
      // Deduplicate concurrent refresh calls
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      
      accessToken = await refreshPromise;
      error.config.headers.Authorization = `Bearer ${accessToken}`;
      return api(error.config);
    }
    return Promise.reject(error);
  }
);
```

**Acceptance Testing:**
- [ ] Login → receive token → access protected route → wait 5m → auto-refresh works
- [ ] Open two tabs → both share the same cookie → refresh works in both
- [ ] Logout → cookie cleared → refresh fails → redirected to login
- [ ] Logout all devices → other tabs fail on next refresh → redirected to login
- [ ] Simulate token theft (replay old refresh token) → reuse detected → forced re-login

**Documentation:**
- [ ] Update `docs/planning/index.md` with completed feature entry
- [ ] Update `docs/planning/backlog.md` (mark done)
- [ ] Add entry to `docs/changelog/YYYY-MM.md`
- [ ] Create/update `docs/guides/setup.md` — frontend integration guide (token storage, interceptor pattern, cookie requirements)

---

### Email Verification

**Priority:** 🔴 High  
**Effort:** Large  
**Estimated Time:** 16-20 hours

**Description:**  
Add email verification to ensure valid email addresses and prevent fake accounts.

**Requirements:**

- Generate verification token on registration
- Send verification email (requires email service)
- Verification endpoint to confirm email
- Mark users as verified/unverified
- Resend verification email option
- Block unverified users from certain actions

**Acceptance Criteria:**

- [ ] Add email service integration (SendGrid/AWS SES)
- [ ] Add emailVerified field to User model
- [ ] Generate secure verification tokens
- [ ] Create POST /auth/verify-email endpoint
- [ ] Create POST /auth/resend-verification endpoint
- [ ] Send styled HTML emails
- [ ] Block unverified users from protected routes
- [ ] Add email templates
- [ ] Add tests
- [ ] Update `docs/planning/index.md` with completed feature entry
- [ ] Update `docs/planning/backlog.md` (mark done)
- [ ] Add entry to `docs/changelog/YYYY-MM.md`
- [ ] Update `docs/api/endpoints.md` — document `/auth/verify-email` and `/auth/resend-verification`
- [ ] Update `docs/api/authentication.md` — document the email verification flow
- [ ] Update `docs/architecture/database-schema.md` — add `emailVerified`, `emailVerificationToken`, `emailVerificationExpires` fields

**Database Changes:**

```typescript
interface IUser {
  // existing fields...
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
}
```

---

## 🟡 Medium Priority

### Automated Testing Suite

**Priority:** 🟡 Medium — ✅ **Completed 2026-02-28**
**Effort:** Large

**Description:**
Implemented with Vitest as the test runner and Supertest for HTTP integration tests. All use cases, providers, controllers, and routes are covered. No real database is required — mocks are injected via `createApp(deps)`.

**Acceptance Criteria:**

- [x] Set up test framework (Vitest)
- [x] Configure test isolation (mock injection, no DB required)
- [x] Write unit tests for use cases
- [x] Write unit tests for providers (BcryptPasswordHasher, JwtTokenProvider, JwtRefreshTokenProvider)
- [x] Write integration tests for auth routes
- [x] Write integration tests for session routes
- [x] Write integration tests for protected routes
- [x] 89 tests passing, zero failures
- [ ] Coverage reporting (available via `npm run test:coverage`)
- [ ] CI/CD integration (planned)

---

### Password Reset Flow

**Priority:** 🟡 Medium  
**Effort:** Medium  
**Estimated Time:** 10-14 hours

**Description:**  
Allow users to reset their password via email when they forget it.

**Requirements:**

- Request password reset endpoint
- Generate secure reset token
- Send reset email with link
- Reset password endpoint
- Token expiration (1 hour)
- Invalidate token after use

**Acceptance Criteria:**

- [ ] Create POST /auth/forgot-password endpoint
- [ ] Create POST /auth/reset-password endpoint
- [ ] Add resetToken fields to User model
- [ ] Generate secure tokens
- [ ] Send reset email
- [ ] Validate reset tokens
- [ ] Expire tokens after 1 hour
- [ ] Hash new password
- [ ] Add tests
- [ ] Update `docs/planning/index.md` with completed feature entry
- [ ] Update `docs/planning/backlog.md` (mark done)
- [ ] Add entry to `docs/changelog/YYYY-MM.md`
- [ ] Update `docs/api/endpoints.md` — document `/auth/forgot-password` and `/auth/reset-password`
- [ ] Update `docs/api/authentication.md` — document the password reset flow

---

### API Versioning

**Priority:** 🟡 Medium  
**Effort:** Small  
**Estimated Time:** 4-6 hours

**Description:**  
Implement API versioning to support multiple API versions simultaneously.

**Requirements:**

- Version prefix in routes (e.g., `/v1/auth/login`)
- Current routes become v1
- Support for multiple versions
- Version header option
- Deprecation warnings for old versions

**Acceptance Criteria:**

- [ ] Add /v1 prefix to all routes
- [ ] Update Swagger configuration
- [ ] Add version middleware
- [ ] Support Accept-Version header
- [ ] Update documentation
- [ ] Add deprecation mechanism
- [ ] Update `docs/planning/index.md` with completed feature entry
- [ ] Update `docs/planning/backlog.md` (mark done)
- [ ] Add entry to `docs/changelog/YYYY-MM.md`
- [ ] Update `docs/api/endpoints.md` — prefix all routes with `/v1`
- [ ] Update `docs/api/authentication.md` — note versioning strategy
- [ ] Update `docs/guides/development.md` — document how to add new API versions
- [ ] Update frontend integration docs to use `/v1` prefix

---

### Admin Dashboard Backend

**Priority:** 🟡 Medium  
**Effort:** Large  
**Estimated Time:** 24-32 hours

**Description:**  
Create admin-only endpoints for user management and system monitoring.

**Requirements:**

- Admin role system
- User management endpoints (list, view, delete, suspend)
- System statistics endpoint
- Audit log viewing
- Admin authentication

**Acceptance Criteria:**

- [ ] Add roles field to User model
- [ ] Create role-based middleware
- [ ] Create admin routes
- [ ] GET /admin/users (list all users)
- [ ] GET /admin/users/:id (view user)
- [ ] PUT /admin/users/:id (update user)
- [ ] DELETE /admin/users/:id (delete user)
- [ ] GET /admin/stats (system statistics)
- [ ] Add admin seed script
- [ ] Add tests
- [ ] Update `docs/planning/index.md` with completed feature entry
- [ ] Update `docs/planning/backlog.md` (mark done)
- [ ] Add entry to `docs/changelog/YYYY-MM.md`
- [ ] Update `docs/api/endpoints.md` — document all `/admin/*` endpoints
- [ ] Update `docs/architecture/overview.md` — document role-based access control
- [ ] Update `docs/architecture/database-schema.md` — add `roles` field to User schema
- [ ] Create `docs/guides/setup.md` section — document admin seed script usage

---

## 🟢 Low Priority

### Two-Factor Authentication (2FA)

**Priority:** 🟢 Low  
**Effort:** Large  
**Estimated Time:** 20-24 hours

**Description:**  
Add optional two-factor authentication using TOTP (Google Authenticator, Authy).

**Requirements:**

- Enable/disable 2FA per user
- Generate QR code for setup
- Verify TOTP codes
- Backup codes
- 2FA required on login

**Acceptance Criteria:**

- [ ] Add 2FA fields to User model
- [ ] Install speakeasy/otplib
- [ ] Create POST /auth/2fa/enable endpoint
- [ ] Create POST /auth/2fa/verify endpoint
- [ ] Generate and display QR codes
- [ ] Generate backup codes
- [ ] Modify login flow for 2FA
- [ ] Add tests
- [ ] Update `docs/planning/index.md` with completed feature entry
- [ ] Update `docs/planning/backlog.md` (mark done)
- [ ] Add entry to `docs/changelog/YYYY-MM.md`
- [ ] Update `docs/api/endpoints.md` — document `/auth/2fa/enable` and `/auth/2fa/verify`
- [ ] Update `docs/api/authentication.md` — document the 2FA login flow
- [ ] Update `docs/architecture/database-schema.md` — add 2FA fields to User schema

---

### Social Login (GitHub, Microsoft)

**Priority:** 🟢 Low  
**Effort:** Medium  
**Estimated Time:** 8-12 hours

**Description:**  
Add additional OAuth providers beyond Google.

**Requirements:**

- GitHub OAuth integration
- Microsoft/Azure AD OAuth
- Link multiple social accounts
- Unified OAuth callback handler

**Acceptance Criteria:**

- [ ] Add GitHub Passport strategy
- [ ] Add Microsoft Passport strategy
- [ ] Create OAuth routes for each provider
- [ ] Update User model for multiple providers
- [ ] Allow linking accounts
- [ ] Add tests
- [ ] Update `docs/planning/index.md` with completed feature entry
- [ ] Update `docs/planning/backlog.md` (mark done)
- [ ] Add entry to `docs/changelog/YYYY-MM.md`
- [ ] Update `docs/api/authentication.md` — document GitHub and Microsoft OAuth flows
- [ ] Update `docs/architecture/database-schema.md` — document multi-provider User schema changes
- [ ] Update `docs/guides/setup.md` — add GitHub and Microsoft OAuth app configuration steps

---

### Redis Caching Layer

**Priority:** 🟢 Low  
**Effort:** Medium  
**Estimated Time:** 10-14 hours

**Description:**  
Add Redis for caching and session storage to improve performance.

**Requirements:**

- Redis connection setup
- Cache frequently accessed data
- Session storage in Redis
- Cache invalidation strategy
- Optional (graceful degradation if Redis down)

**Acceptance Criteria:**

- [ ] Add Redis to Docker Compose
- [ ] Install redis client
- [ ] Create Redis connection module
- [ ] Cache user lookups
- [ ] Store sessions in Redis
- [ ] Implement cache invalidation
- [ ] Add cache middleware
- [ ] Add tests
- [ ] Update `docs/planning/index.md` with completed feature entry
- [ ] Update `docs/planning/backlog.md` (mark done)
- [ ] Add entry to `docs/changelog/YYYY-MM.md`
- [ ] Update `docs/architecture/overview.md` — document Redis in the infrastructure layer
- [ ] Create/update `docs/guides/deployment.md` — Redis setup, Docker Compose config, and graceful degradation notes

---

### Redis Rate Limit Store

**Priority:** 🟡 Medium  
**Effort:** Small  
**Estimated Time:** 2-4 hours  
**Dependencies:** Redis Caching Layer (Redis must be running in Docker Compose)

**Description:**  
The current `express-rate-limit` middleware uses an **in-memory store**, which means each Node.js process maintains its own independent counter. If the app is ever scaled horizontally (multiple instances or pods), a client gets `limit × instances` effective requests — completely defeating the rate limiter. Switching to `rate-limit-redis` gives a single shared counter across all instances.

**Requirements:**

- Install `rate-limit-redis` (or `@upstash/ratelimit` for serverless)
- Connect rate limiter to the existing Redis instance
- Graceful degradation: fall back to in-memory if Redis is unavailable
- No change to the existing limits or API behaviour

**Acceptance Criteria:**

- [ ] Install `rate-limit-redis`
- [ ] Create a shared Redis client (reuse from Redis Caching Layer)
- [ ] Pass Redis store to `authRateLimiter` and `protectedRateLimiter`
- [ ] Verify counters are shared across two parallel app instances
- [ ] Graceful degradation when Redis is down (log warning, don't crash)
- [ ] Update tests (mock Redis store)
- [ ] Update `docs/planning/index.md` with completed feature entry
- [ ] Update `docs/planning/backlog.md` (mark done)
- [ ] Add entry to `docs/changelog/YYYY-MM.md`
- [ ] Update `docs/architecture/overview.md` to note Redis as rate limit store

**Notes:**
Must be implemented before deploying more than one Node instance in production. Safe to skip until horizontal scaling is needed.

---

### Nginx Reverse Proxy Rate Limiting

**Priority:** 🟡 Medium  
**Effort:** Small  
**Estimated Time:** 2-3 hours  
**Dependencies:** Redis Rate Limit Store (app-level limiter should be hardened first)

**Description:**  
Move coarse-grained rate limiting to the Nginx reverse proxy layer so that excess traffic is rejected **before** it reaches Node.js. This reduces CPU/memory load on the app for abusive clients. The `express-rate-limit` middleware is kept as a defence-in-depth backstop (e.g. if someone hits the app directly by IP).

**Requirements:**

- Nginx `limit_req_zone` and `limit_req` directives for `/auth/` and `/api/` locations
- Return `429` with a JSON body consistent with the app's error format
- App-level rate limiter remains active but limits are relaxed (higher threshold) since Nginx handles the primary enforcement
- Nginx config added to Docker Compose production setup

**Acceptance Criteria:**

- [ ] Add `limit_req_zone` zones in `nginx.conf` (auth: 5r/m, api: 100r/m per IP)
- [ ] Apply `limit_req` to `/auth/` and `/api/` location blocks
- [ ] Configure `limit_req_status 429` and a custom JSON error page
- [ ] Relax app-level limits to act as backstop only (e.g. 2× Nginx limit)
- [ ] Test that Nginx blocks before Node handles the request (check access logs)
- [ ] Update `docs/planning/index.md` with completed feature entry
- [ ] Update `docs/planning/backlog.md` (mark done)
- [ ] Add entry to `docs/changelog/YYYY-MM.md`
- [ ] Create/update `docs/guides/deployment.md` — document Nginx rate limiting config and how to tune limits
- [ ] Update `docs/architecture/overview.md` — note Nginx as the primary rate limiting layer
- [ ] Update `docker-compose.prod.yml` with Nginx service config

---

### Webhook System

**Priority:** 🟢 Low  
**Effort:** Large  
**Estimated Time:** 20-30 hours

**Description:**  
Allow external systems to subscribe to events (user registered, login, etc.).

**Requirements:**

- Webhook registration endpoints
- Event types (user.created, user.login, etc.)
- Secure webhook signing
- Retry logic for failed webhooks
- Webhook logs and monitoring

**Acceptance Criteria:**

- [ ] Create Webhook model
- [ ] Create webhook CRUD endpoints
- [ ] Implement event emitter
- [ ] Add webhook signing
- [ ] Implement retry queue
- [ ] Add webhook logs
- [ ] Create webhook testing tool
- [ ] Add tests
- [ ] Update `docs/planning/index.md` with completed feature entry
- [ ] Update `docs/planning/backlog.md` (mark done)
- [ ] Add entry to `docs/changelog/YYYY-MM.md`
- [ ] Update `docs/api/endpoints.md` — document all `/webhooks/*` endpoints
- [ ] Update `docs/architecture/overview.md` — document event emitter pattern

---

### GraphQL API

**Priority:** 🟢 Low  
**Effort:** Large  
**Estimated Time:** 30-40 hours

**Description:**  
Add GraphQL API alongside REST API for more flexible data fetching.

**Requirements:**

- GraphQL server setup
- Schema definitions
- Resolvers for all operations
- GraphQL Playground
- Authentication with GraphQL
- Subscriptions (optional)

**Acceptance Criteria:**

- [ ] Install Apollo Server
- [ ] Define GraphQL schema
- [ ] Create resolvers
- [ ] Add authentication middleware
- [ ] Set up GraphQL Playground
- [ ] Implement subscriptions (optional)
- [ ] Add tests
- [ ] Update `docs/planning/index.md` with completed feature entry
- [ ] Update `docs/planning/backlog.md` (mark done)
- [ ] Add entry to `docs/changelog/YYYY-MM.md`
- [ ] Create `docs/api/graphql.md` — schema reference and example queries
- [ ] Update `docs/architecture/overview.md` — document GraphQL alongside REST

---

## 📋 Technical Debt & Improvements

### Code Organization Refactoring

**Priority:** 🟢 Low  
**Effort:** Small

- [ ] Extract route handlers to controllers
- [ ] Create service layer for business logic
- [ ] Standardize error responses
- [ ] Create response helper utilities
- [ ] Improve TypeScript type reuse

### Performance Optimization

**Priority:** 🟢 Low  
**Effort:** Medium

- [ ] Add database indexes
- [ ] Implement query optimization
- [ ] Add compression middleware
- [ ] Optimize Docker image size
- [ ] Implement lazy loading where applicable

### Security Enhancements

**Priority:** 🟡 Medium  
**Effort:** Small

- [ ] Add helmet.js for security headers
- [ ] Implement CSRF protection
- [ ] Add input sanitization
- [ ] Set up security.txt
- [ ] Implement security headers

### Documentation Improvements

**Priority:** 🟢 Low  
**Effort:** Small

- [ ] Add API examples for all endpoints
- [ ] Create video tutorials
- [ ] Add deployment guides for cloud providers
- [ ] Create troubleshooting guide
- [ ] Add architecture diagrams

---

## 🎯 Future Ideas (Not Prioritized)

- Multi-tenancy support
- Microservices architecture
- Event sourcing and CQRS
- Real-time notifications (WebSockets)
- File upload and storage
- Search functionality (Elasticsearch)
- Internationalization (i18n)
- Mobile app backend features
- Payment integration
- Analytics and reporting

---

**Last Updated:** 2026-03-01  
**Total Items:** 17 prioritized + 4 technical debt + ideas  
**Next Review:** 2026-03-31
