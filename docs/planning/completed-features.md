# Project Index - Completed Features

This document tracks all features, changes, and additions to the project with timestamps.

**Total Completed:** 12 features | **Current Version:** 1.1.3

---

## Quick Reference

| #   | Feature                         | Date       | Priority  | Status      | Impact                  | Details                                            |
| --- | ------------------------------- | ---------- | --------- | ----------- | ----------------------- | -------------------------------------------------- |
| 1   | TypeScript Migration            | 2026-02-15 | 🔴 High   | ✅ Complete | Type safety, better DX  | [↓](#typescript-migration---2026-02-15)            |
| 2   | Docker & Docker Compose Setup   | 2026-02-15 | 🟡 Medium | ✅ Complete | Consistent environments | [↓](#docker--docker-compose-setup---2026-02-15)    |
| 3   | Multi-Environment Configuration | 2026-02-15 | 🟡 Medium | ✅ Complete | Easy env switching      | [↓](#multi-environment-configuration---2026-02-15) |
| 4   | Request Logging with Morgan     | 2026-02-15 | 🟢 Low    | ✅ Complete | Request monitoring      | [↓](#request-logging-with-morgan---2026-02-15)     |
| 5   | CORS Configuration              | 2026-02-15 | 🔴 High   | ✅ Complete | Secure cross-origin     | [↓](#cors-configuration---2026-02-15)              |
| 6   | Mongoose 9 Compatibility Fix    | 2026-02-15 | 🔴 High   | ✅ Complete | Registration working    | [↓](#mongoose-9-compatibility-fix---2026-02-15)    |
| 7   | Initial Project Setup           | 2026-02-14 | 🔴 High   | ✅ Complete | Core auth system        | [↓](#initial-project-setup---2026-02-14)           |
| 8   | Feature Planning Skill          | 2026-02-21 | 🟡 Medium | ✅ Complete | Structured planning     | [↓](#feature-planning-skill---2026-02-21)          |
| 9   | JWT Lifecycle Hardening         | 2026-02-21 | 🔴 High   | ✅ Complete | Secure token lifecycle  | [↓](#jwt-lifecycle-hardening---2026-02-21)         |
| 10  | Session Lifecycle Fixes         | 2026-02-21 | 🔴 High   | ✅ Complete | Architecture + security | [↓](#session-lifecycle-fixes---2026-02-21)         |
| 11  | PR Code Review Fixes            | 2026-02-28 | 🔴 High   | ✅ Complete | Race condition + DX     | [↓](#pr-code-review-fixes---2026-02-28)            |
| 12  | Rate Limiting Middleware        | 2026-03-01 | 🔴 High   | ✅ Complete | Brute force protection  | [↓](#rate-limiting-middleware---2026-03-01)        |
| 13  | GitHub Pages Documentation Site | 2026-03-01 | 🟢 Low    | ✅ Complete | Browsable public docs   | [↓](#github-pages-documentation-site---2026-03-01) |

> **Note:** When completed features exceed 15 items, individual features will be moved to separate files in `completed/` directory.

---

## 2026-03

### Rate Limiting Middleware - 2026-03-01

**Status:** ✅ Completed
**Author:** Development Team
**Description:** Implemented `express-rate-limit` middleware to protect against brute force and API abuse. Auth endpoints are limited to 5 requests per 15 minutes; protected API endpoints to 100 per 15 minutes. Rate limiting is disabled in test environments via the `rateLimiting` flag on `AppDependencies`.
**Files Changed:**
- `src/interfaces/http/middleware/rateLimiter.ts` (new)
- `src/interfaces/http/routes.ts` — apply limiters per route group
- `src/interfaces/http/app.ts` — `rateLimiting` flag in `AppDependencies`
- `src/interfaces/http/swagger.ts` — `RateLimitError` schema + 429 responses
- `src/interfaces/http/controllers/AuthController.ts` — 429 Swagger docs on register/login
- `tests/interfaces/http/rateLimiter.test.ts` (new)
**Related Docs:** [backlog.md](backlog.md#rate-limiting-middleware)

---

### GitHub Pages Documentation Site - 2026-03-01

**Status:** ✅ Completed
**Author:** Development Team
**Description:** Enabled GitHub Pages to serve the `docs/` folder as a browsable public documentation site. No content was migrated — all docs remain in the repo for version control, PR reviews, and AI agent access. Added `docs/_config.yml` for Jekyll configuration.
**Files Changed:**
- `docs/_config.yml` (new) — Jekyll config with title, theme, baseurl
- `docs/README.md` — added live Pages URL to Quick Links
**Live URL:** [https://letuscode.co.uk/express-auth-app/](https://letuscode.co.uk/express-auth-app/)
**Related Docs:** [backlog.md](backlog.md)

---

## 2026-02

### TypeScript Migration - 2026-02-15

**Status:** ✅ Completed  
**Author:** Development Team  
**Priority:** 🔴 High

**Description:**  
Complete conversion of the entire codebase from JavaScript to TypeScript with strict mode enabled and zero `any` types.

**Changes:**

- Converted all `.js` files to `.ts` with proper type annotations
- Created TypeScript interfaces for User model and request types
- Enabled strict TypeScript compiler options
- Migrated to ES6 imports/exports
- Updated build process to compile TypeScript
- Updated Docker configuration for TypeScript builds

**Files Changed:**

- Created `src/` directory with all TypeScript source
- Updated `tsconfig.json` with strict settings
- Modified `package.json` for TypeScript scripts
- Updated `Dockerfile` to build TypeScript
- All route, model, config, and middleware files

**Impact:**

- ✅ Full compile-time type safety
- ✅ Better IDE support and autocomplete
- ✅ Self-documenting code with types
- ✅ Caught 15+ potential runtime errors
- ✅ Improved refactoring confidence

**Related Docs:**

- [TYPESCRIPT_MIGRATION.md](../../TYPESCRIPT_MIGRATION.md)
- [Architecture: Overview](../architecture/overview.md)

---

### Docker & Docker Compose Setup - 2026-02-15

**Status:** ✅ Completed  
**Author:** Development Team  
**Priority:** 🟡 Medium

**Description:**  
Containerized the application with Docker and set up multi-environment Docker Compose configurations.

**Changes:**

- Created `Dockerfile` for building the application
- Created `docker-compose.yml` for development
- Created `docker-compose.prod.yml` for production
- Added `.dockerignore` for efficient builds
- Configured MongoDB container with persistent volumes
- Set up health checks for MongoDB

**Features:**

- Separate dev and production configurations
- Hot reload in development mode
- MongoDB with persistent data volumes
- Environment-specific builds
- Container networking

**Files Added:**

- `Dockerfile`
- `docker-compose.yml`
- `docker-compose.prod.yml`
- `.dockerignore`

**Impact:**

- ✅ Consistent development environments
- ✅ Easy deployment process
- ✅ Isolated services
- ✅ Simple scaling options

---

### Multi-Environment Configuration - 2026-02-15

**Status:** ✅ Completed  
**Author:** Development Team  
**Priority:** 🟡 Medium

**Description:**  
Implemented environment-specific configuration with separate `.env` files for development and production.

**Changes:**

- Created `.env.development` with dev settings
- Created `.env.production` with prod placeholders
- Updated server to load environment-specific configs
- Added `FRONTEND_URL` configuration
- Implemented NODE_ENV-based environment loading

**Files Added:**

- `.env.development`
- `.env.production`

**Files Modified:**

- `src/server.ts` - Added env file selection logic
- `docker-compose.yml` - Uses `.env.development`
- `docker-compose.prod.yml` - Uses `.env.production`

**Impact:**

- ✅ Easy environment switching
- ✅ Secure production configuration
- ✅ Development-specific settings
- ✅ No hardcoded secrets

---

### Request Logging with Morgan - 2026-02-15

**Status:** ✅ Completed  
**Author:** Development Team  
**Priority:** 🟢 Low

**Description:**  
Added comprehensive request logging to both console and file with Morgan middleware.

**Changes:**

- Installed Morgan logging middleware
- Created custom logger middleware
- Configured console logging (development)
- Configured file logging (`logs/access.log`)
- Added custom response time token

**Features:**

- Real-time console logging
- Persistent file-based logs
- Response time tracking
- Colored output for terminal
- Combined console + file logging

**Files Added:**

- `src/middleware/logger.ts`
- `logs/access.log` (generated)

**Impact:**

- ✅ Request monitoring
- ✅ Performance tracking
- ✅ Audit trail
- ✅ Debugging support

---

### CORS Configuration - 2026-02-15

**Status:** ✅ Completed  
**Author:** Development Team  
**Priority:** 🔴 High

**Description:**  
Configured CORS to allow frontend applications to communicate with the API securely.

**Changes:**

- Added CORS middleware with origin configuration
- Configured credentials support
- Added `FRONTEND_URL` environment variable
- Set default frontend URL for development

**Configuration:**

```typescript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true,
  optionsSuccessStatus: 200,
};
```

**Impact:**

- ✅ Frontend can make authenticated requests
- ✅ Secure cross-origin communication
- ✅ Environment-specific origins
- ✅ Credentials/cookies support

---

### Mongoose 9 Compatibility Fix - 2026-02-15

**Status:** ✅ Completed  
**Author:** Development Team  
**Priority:** 🔴 High

**Description:**  
Fixed User model pre-save hook to work with Mongoose 9.x (removed callback pattern).

**Changes:**

- Removed `next()` callback from pre-save hook
- Updated to async/await pattern
- Removed try-catch (handled by Mongoose)

**Before:**

```javascript
userSchema.pre('save', async function (next) {
  try {
    // ...hash password
    next();
  } catch (error) {
    next(error);
  }
});
```

**After:**

```typescript
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
```

**Impact:**

- ✅ User registration working
- ✅ Password hashing functional
- ✅ Compatible with Mongoose 9.x
- ✅ Cleaner async code

---

### Initial Project Setup - 2026-02-14

**Status:** ✅ Completed  
**Author:** Development Team  
**Priority:** 🔴 High

**Description:**  
Initial project setup with Express, MongoDB, JWT authentication, and Google OAuth.

**Features Implemented:**

- Express 5 server
- MongoDB with Mongoose
- Email/password authentication
- JWT token generation and verification
- Google OAuth 2.0 integration
- Password hashing with bcrypt
- Protected routes with JWT middleware
- Swagger/OpenAPI documentation
- Input validation
- Error handling

**Files Created:**

- Basic project structure
- Authentication routes
- User model
- JWT middleware
- Passport OAuth configuration
- Swagger configuration
- Validation utilities

**Impact:**

- ✅ Core authentication system working
- ✅ Multiple auth methods supported
- ✅ API documentation available
- ✅ Security best practices implemented

---

### Feature Planning Skill - 2026-02-21
**Status:** ✅ Completed  
**Author:** Development Team  
**Priority:** 🟡 Medium  

**Description:**  
Added a new Copilot skill (`feature-planning`) that provides a structured workflow for breaking down feature requirements into trackable sub-tasks linked to project documentation. Each sub-task is tagged by architecture layer and references the docs it will affect.

**Changes:**
- Created `.github/skills/feature-planning/SKILL.md` with skill definition, workflow, and conventions
- Created `docs/planning/features/` directory for individual feature plans
- Created `docs/planning/features/_template.md` as a reusable feature plan template
- Created `docs/planning/features/README.md` explaining the feature planning process
- Updated `docs/README.md` to include feature plans in documentation structure

**Files Added:**
- `.github/skills/feature-planning/SKILL.md`
- `docs/planning/features/README.md`
- `docs/planning/features/_template.md`

**Impact:**
- ✅ Structured workflow for planning new features
- ✅ Sub-tasks linked to architecture layers and documentation
- ✅ Reusable template for consistent feature plans
- ✅ Integration with existing docs skill

**Related Docs:**
- [Feature Plans](../planning/features/)
- [Backlog](../planning/backlog.md)

---

### JWT Lifecycle Hardening - 2026-02-21
**Status:** ✅ Completed  
**Author:** Development Team  
**Priority:** 🔴 High  

**Description:**  
Added full refresh token lifecycle with rotating tokens, reuse detection, and revocation controls. Access tokens are now short-lived (5m) with 7-day refresh tokens stored in secure httpOnly cookies. Supports current-session logout, all-device logout, and admin-forced revocation.

**Changes:**
- Added `RefreshSession` domain entity with token family tracking
- Added domain errors: `SessionNotFoundError`, `SessionExpiredError`, `SessionRevokedError`, `TokenReuseDetectedError`
- Added `RefreshSessionRepository` and `RefreshTokenProvider` application ports
- Added use cases: `RefreshSessionUseCase`, `LogoutCurrentSession`, `LogoutAllSessions`, `AdminRevokeSessions`
- Updated `LoginUser` and `RegisterUser` to issue refresh tokens
- Added `MongoRefreshSessionRepository` with TTL index for auto-cleanup
- Added `JwtRefreshTokenProvider` with SHA-256 token hashing and unique JTI
- Extended `AuthController` with `/auth/refresh`, `/auth/logout`, `/auth/logout-all`, `/auth/admin/revoke`
- Updated `AuthMiddleware` for strict `Bearer` prefix parsing
- Google OAuth callback now shares the same session lifecycle
- Added `cookie-parser` middleware for httpOnly cookie transport

**Files Added:**
- `src/domain/auth/RefreshSession.ts`
- `src/application/auth/ports/RefreshSessionRepository.ts`
- `src/application/auth/ports/RefreshTokenProvider.ts`
- `src/application/auth/dtos/RefreshSessionDTO.ts`
- `src/application/auth/dtos/LogoutDTO.ts`
- `src/application/auth/dtos/AdminRevokeDTO.ts`
- `src/application/auth/use-cases/RefreshSession.ts`
- `src/application/auth/use-cases/LogoutCurrentSession.ts`
- `src/application/auth/use-cases/LogoutAllSessions.ts`
- `src/application/auth/use-cases/AdminRevokeSessions.ts`
- `src/infrastructure/auth/repositories/MongoRefreshSessionRepository.ts`
- `src/infrastructure/auth/providers/JwtRefreshTokenProvider.ts`

**Files Modified:**
- `src/domain/auth/errors.ts` — session lifecycle errors
- `src/domain/auth/AuthToken.ts` — optional `refreshToken`
- `src/application/auth/use-cases/LoginUser.ts` — refresh session creation
- `src/application/auth/use-cases/RegisterUser.ts` — refresh session creation
- `src/interfaces/http/controllers/AuthController.ts` — new endpoints + cookie handling
- `src/interfaces/http/middleware/AuthMiddleware.ts` — strict Bearer parsing
- `src/interfaces/http/app.ts` — new dependencies + cookie-parser
- `src/config/env.ts` — refresh token config
- `src/server.ts` — composition root wiring

**Impact:**
- ✅ Rotating refresh tokens with reuse detection
- ✅ Token family-based revocation on reuse
- ✅ Per-session, all-device, and admin-forced logout
- ✅ Short-lived access tokens (5m default)
- ✅ Secure httpOnly cookie transport for refresh tokens
- ✅ Google OAuth shares same lifecycle as email/password login
- ✅ ~51 new tests (88 total, all passing)
- ✅ Zero architecture boundary violations

**Related Docs:**
- [Backlog: Refresh Token Implementation](backlog.md#refresh-token-implementation) (completed)

---

### Session Lifecycle Fixes - 2026-02-21

**Status:** ✅ Completed
**Author:** Development Team
**Priority:** 🔴 High

**Description:**
Follow-up hardening after JWT Lifecycle Hardening — fixed architecture violations, security gaps, and session management bugs discovered during code review.

**Changes:**
- **Fail-fast secrets**: Server throws on startup if `JWT_SECRET` or `SESSION_SECRET` are missing (previously would silently sign tokens with `undefined`)
- **Architecture fix**: Extracted `GoogleOAuthLogin` use case so the controller no longer imports from `src/infrastructure`
- **Admin endpoint security**: `POST /auth/admin/revoke` now requires a valid Bearer token and admin check
- **Session ID bug**: Fixed empty-string session ID passed to `RefreshSession` constructors
- **CreateRefreshSession**: Extracted shared session-creation logic from `LoginUser`, `RegisterUser`, and `GoogleOAuthLogin` into a reusable use case

**Files Changed:**
- `src/config/env.ts` — fail-fast checks
- `src/application/auth/use-cases/GoogleOAuthLogin.ts` — new use case
- `src/application/auth/use-cases/CreateRefreshSession.ts` — new shared use case
- `src/interfaces/http/controllers/AuthController.ts` — admin auth fix
- `src/server.ts` — wiring updates

**Related Docs:**
- [Architecture: Authentication](../architecture/authentication.md)

---

### PR Code Review Fixes - 2026-02-28

**Status:** ✅ Completed
**Author:** Development Team
**Priority:** 🔴 High

**Description:**
Security and correctness fixes identified by automated code review on PR #2.

**Changes:**
- **Race condition in token rotation**: `revokeById` now atomically checks `revoked: false` using `findOneAndUpdate`, ensuring only one concurrent request can rotate a given token. Returns `boolean` — concurrent losers get `SessionNotFoundError` without family revocation (not a malicious reuse scenario).
- **Refresh cookie `secure` flag**: Changed from hardcoded `true` to `process.env.NODE_ENV === 'production'`, fixing the refresh flow in local HTTP development.
- **Swagger `/auth/refresh`**: Now documents the cookie source, optional request body, full `AuthResponse` schema, and `Set-Cookie` response header.
- **Concurrent rotation test**: Added a dedicated test verifying `revokeById → false` throws `SessionNotFoundError` without revoking the token family.

**Files Changed:**
- `src/application/auth/ports/RefreshSessionRepository.ts` — `revokeById` returns `Promise<boolean>`
- `src/application/auth/use-cases/RefreshSession.ts` — atomic revoke check
- `src/infrastructure/auth/repositories/MongoRefreshSessionRepository.ts` — atomic `findOneAndUpdate`
- `src/interfaces/http/controllers/AuthController.ts` — secure flag + Swagger docs
- `tests/application/auth/RefreshSession.test.ts` — concurrent rotation test + updated mocks

**Related Docs:**
- [Architecture: Authentication](../architecture/authentication.md)
- [Changelog: 2026-02](../changelog/2026-02.md)

---

### Security Hardening & Infrastructure Improvements - 2026-03-02

**Status:** ✅ Completed
**Description:** Seven focused security and infrastructure improvements covering secrets hygiene, security headers (defense-in-depth via helmet + Traefik), HTTP boundary validation with Zod, real Mongo integration tests, and Docker hardening.
**Files Changed:**
- `.gitignore` — allow `*.example` env files
- `.env.development.example`, `.env.production.example` — safe templates replacing committed env files (`.env.development`, `.env.production` removed from git)
- `src/interfaces/http/app.ts` — `helmet` added as first middleware
- `src/interfaces/http/validation/schemas.ts` (new) — Zod schemas for register, login, adminRevoke
- `src/interfaces/http/validation/validate.ts` (new) — reusable `validate()` middleware factory
- `src/interfaces/http/controllers/AuthController.ts` — `validate()` applied on register, login, admin/revoke routes
- `src/interfaces/http/routes.ts` — `GET /health` endpoint added
- `traefik/traefik.dev.yml` (new) — Traefik dev static config (HTTP, dashboard on :8080)
- `traefik/traefik.prod.yml` (new) — Traefik prod static config (HTTPS + Let's Encrypt)
- `docker-compose.yml` — Traefik service added; app uses `expose` + labels; app healthcheck wired
- `docker-compose.prod.yml` — Traefik service with TLS; `letsencrypt_data` volume; app healthcheck wired
- `Dockerfile` — `USER node` non-root user; `HEALTHCHECK` instruction; pinning comment
- `tests/integration/MongoUserRepository.integration.test.ts` (new) — 8 integration tests
- `tests/integration/MongoRefreshSessionRepository.integration.test.ts` (new) — 6 integration tests
**Related Docs:**
- [Changelog: 2026-03](../changelog/2026-03.md)
- [Guide: Deployment](../guides/deployment.md)
- [Guide: Setup](../guides/setup.md)

---

### Unit Test Coverage ≥ 90% - 2026-03-02
**Status:** ✅ Completed
**Description:** Increased unit test coverage to a minimum of 90% across every layer of the Clean Architecture stack. Added Codecov integration with a coverage badge in the README.
**Files Changed:**
- `tests/domain/auth/` — entity, value object, and error class tests
- `tests/application/auth/` — `RegisterUser`, `LoginUser` use-case tests with full branch and edge-case coverage
- `tests/infrastructure/auth/` — `BcryptPasswordHasher`, `JwtTokenProvider`, `MongoUserRepository` tests
- `tests/interfaces/http/` — controller integration tests, middleware, and error-mapping edge cases
- `.github/workflows/ci.yml` — Codecov upload step added
- `README.md` — Codecov badge added
**Related Docs:**
- [Changelog: 2026-03](../changelog/2026-03.md)

---

### CI/CD Pipeline Hardening + Branch Protection - 2026-03-02
**Status:** ✅ Completed
**Description:** Hardened CI/CD pipelines with security-first practices: pinned action SHAs, concurrency control, dependency CVE review, Docker container scanning, automated dependency updates, and enforced branch protection rules on `main`.
**Files Changed:**
- `.github/workflows/ci.yml` — format check, concurrency, SHA-pinned actions
- `.github/workflows/pr-checks.yml` (new) — Dependency Review, fork-safe PR commenting
- `.github/workflows/docker.yml` (new) — Docker build + Trivy CVE scan on PRs + SARIF upload post-merge
- `.github/dependabot.yml` (new) — weekly npm + GitHub Actions updates with grouped PRs
- `README.md` — CI/CD section added documenting all workflows, branch protection, and GitHub security settings
**GitHub Settings configured:**
- CodeQL Default Setup (SAST)
- Secret Scanning + push protection
- Dependency Graph + Dependabot alerts
- Branch protection rules on `main`
**Related Docs:**
- [Changelog: 2026-03](../changelog/2026-03.md)

---

## Summary Statistics

**Total Features Completed:** 14
**Total Files Created:** 55+
**Total Lines of Code:** ~4,800+
**Test Coverage:** ≥ 90% across all layers (unit + integration), enforced in CI
**Documentation Coverage:** 98%

## Version History

| Version | Date       | Major Changes                                        |
| ------- | ---------- | ---------------------------------------------------- |
| 1.3.0   | 2026-03-02 | Security hardening: helmet, Traefik, Zod validation, Mongo integration tests, Docker non-root + healthcheck |
| 1.2.0   | 2026-03-02 | ≥90% test coverage, CI/CD hardening, branch protection, security scanning |
| 1.1.3   | 2026-03-01 | Rate limiting, GitHub Pages docs site                |
| 1.0.0   | 2026-02-15 | TypeScript migration, Docker setup, multi-env config |
| 0.1.0   | 2026-02-14 | Initial JavaScript implementation                    |

---

**Last Updated:** 2026-03-02
**Current Version:** 1.3.0
**Next Milestone:** See [Backlog](./backlog.md)
