# Project Backlog

Features, improvements, and tasks planned for future development.

**Total Items:** 14 | **High:** 2 | **Medium:** 4 | **Low:** 4 | **Tech Debt:** 4

---

## Quick Reference

| #   | Feature                          | Priority  | Effort | Est. Time | Status     | Details                             |
| --- | -------------------------------- | --------- | ------ | --------- | ---------- | ----------------------------------- |
| 1   | Rate Limiting Middleware         | 🔴 High   | Small  | 2-4h      | 📋 Planned | [↓](#rate-limiting-middleware)      |
| 2   | ~~Refresh Token Implementation~~ | ~~🔴 High~~ | ~~Medium~~ | ~~8-12h~~ | ✅ Done | [↓](#refresh-token-implementation)  |
| 3   | Email Verification               | 🔴 High   | Large  | 16-20h    | 📋 Planned | [↓](#email-verification)            |
| 4   | Automated Testing Suite          | 🟡 Medium | Large  | 20-30h    | 📋 Planned | [↓](#automated-testing-suite)       |
| 5   | Password Reset Flow              | 🟡 Medium | Medium | 10-14h    | 📋 Planned | [↓](#password-reset-flow)           |
| 6   | API Versioning                   | 🟡 Medium | Small  | 4-6h      | 📋 Planned | [↓](#api-versioning)                |
| 7   | Admin Dashboard Backend          | 🟡 Medium | Large  | 24-32h    | 📋 Planned | [↓](#admin-dashboard-backend)       |
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

**Priority:** 🔴 High  
**Effort:** Small  
**Estimated Time:** 2-4 hours

**Description:**  
Implement rate limiting to prevent API abuse and protect against brute force attacks.

**Requirements:**

- Use `express-rate-limit` package
- Different limits for different endpoint types:
  - Auth endpoints: 5 requests per 15 minutes
  - Protected endpoints: 100 requests per 15 minutes
  - Health check: Unlimited
- Return `429 Too Many Requests` with `Retry-After` header
- Log rate limit violations

**Acceptance Criteria:**

- [ ] Install and configure express-rate-limit
- [ ] Apply rate limiting to auth routes
- [ ] Apply rate limiting to protected routes
- [ ] Return proper 429 status codes
- [ ] Add rate limit info to response headers
- [ ] Document rate limits in API docs
- [ ] Add tests for rate limiting

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
- [ ] Update documentation
- [ ] Add tests

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

**Priority:** 🟡 Medium  
**Effort:** Large  
**Estimated Time:** 20-30 hours

**Description:**  
Implement comprehensive automated testing with unit, integration, and E2E tests.

**Requirements:**

- Unit tests for utilities and models
- Integration tests for API endpoints
- E2E tests for complete flows
- Test coverage > 80%
- CI/CD integration
- Test database setup/teardown

**Stack:**

- Jest or Vitest for test runner
- Supertest for API testing
- MongoDB Memory Server for test database

**Acceptance Criteria:**

- [ ] Set up test framework
- [ ] Configure test database
- [ ] Write unit tests for utilities
- [ ] Write unit tests for models
- [ ] Write integration tests for auth routes
- [ ] Write integration tests for protected routes
- [ ] Write E2E tests for complete flows
- [ ] Add coverage reporting
- [ ] Integrate with CI/CD
- [ ] Document testing approach

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
- [ ] Update documentation
- [ ] Add tests

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
- [ ] Update frontend integration docs

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
- [ ] Update documentation
- [ ] Add tests

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
- [ ] Update documentation
- [ ] Add tests

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
- [ ] Update documentation
- [ ] Add tests

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
- [ ] Update documentation
- [ ] Add tests

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
- [ ] Update documentation
- [ ] Add tests

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
- [ ] Update documentation
- [ ] Add tests

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

**Last Updated:** 2026-02-21  
**Total Items:** 14 prioritized + 4 technical debt + ideas  
**Next Review:** 2026-03-01
