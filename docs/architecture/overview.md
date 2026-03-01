# Architecture Overview

## System Architecture

The Express Auth API is a modern, TypeScript-based authentication service built on Node.js and Express, following **Clean Architecture (Hexagonal / Ports & Adapters)**.

> **📐 For full rules on where files go and layer boundaries, see [Clean Architecture Guidelines](./clean-architecture-guidelines.md).**

### High-Level Architecture

```
┌─────────────────┐
│   Client App    │
│  (React/Vue)    │
└────────┬────────┘
         │ HTTP/HTTPS
         ▼
┌─────────────────┐
│  Load Balancer  │
│   (Optional)    │
└────────┬────────┘
         │
         ▼
┌────────────────────────────────────────────────────┐
│  Interface Layer (Express)                         │
│  Controllers · Middleware · Routes · Swagger        │
├────────────────────────────────────────────────────┤
│  Application Layer (Use Cases)                     │
│  RegisterUser · LoginUser · RefreshSession ·       │
│  LogoutCurrentSession · LogoutAllSessions ·        │
│  AdminRevokeSessions · Ports (interfaces)          │
├────────────────────────────────────────────────────┤
│  Domain Layer (Pure Business Core)                 │
│  User entity · AuthToken · Domain errors           │
├────────────────────────────────────────────────────┤
│  Infrastructure Layer (Adapters)                   │
│  MongoUserRepository · MongoRefreshSessionRepo ·   │
│  JwtTokenProvider · JwtRefreshTokenProvider ·      │
│  Bcrypt · Passport (Google OAuth) · MongoDB        │
└──────────┬─────────────────────────────────────────┘
           │
           ▼
    ┌──────────────┐
    │   MongoDB    │
    │   Database   │
    └──────────────┘
```

### Dependency Direction

```
Domain ← Application ← Infrastructure
                ↑
           Interface (HTTP)
```

All dependencies point inward. Inner layers never import from outer layers. Boundaries are enforced by [dependency-cruiser](./clean-architecture-guidelines.md#boundary-enforcement) (`npm run lint:deps`).

## Technology Stack

### Core Technologies
- **TypeScript 5.9+** - Static typing and modern JavaScript features
- **Node.js 20+** - Runtime environment
- **Express 5** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose 9** - MongoDB ODM

### Authentication & Security
- **JWT (jsonwebtoken)** - Token-based authentication
- **Passport.js** - Authentication middleware
- **Passport-Google-OAuth20** - Google OAuth 2.0 strategy
- **bcryptjs** - Password hashing
- **express-rate-limit** - Rate limiting middleware (auth: 5 req/15 min, API: 100 req/15 min)

### Development & Build
- **TypeScript** - Type safety and tooling
- **tsx** - TypeScript execution and watch mode
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

### Monitoring & Logging
- **Morgan** - HTTP request logger
- **Custom Logger** - File-based access logs

### Documentation
- **Swagger/OpenAPI** - API documentation
- **swagger-jsdoc** - JSDoc to Swagger converter
- **swagger-ui-express** - Interactive API documentation

## Design Principles

### 1. Type Safety First
- Strict TypeScript with no `any` types
- Compile-time error detection
- Better IDE support and refactoring

### 2. Clean Architecture (Ports & Adapters)
- **Domain**: Pure entities, value objects, domain errors — no framework imports
- **Application**: Use cases and port interfaces — depends on domain only
- **Infrastructure**: Implements ports (MongoDB, JWT, bcrypt, Passport)
- **Interface**: Express controllers, middleware, routes — calls use cases only
- **Composition Root** (`server.ts`): Wires all layers via dependency injection

See [Clean Architecture Guidelines](./clean-architecture-guidelines.md) for full rules.

### 3. Security by Default
- Passwords hashed with bcrypt (10 salt rounds)
- Short-lived access tokens (5m) with rotating refresh tokens (7d)
- Refresh tokens stored as SHA-256 hashes in httpOnly cookies
- Token reuse detection with family-wide revocation
- Per-session, all-device, and admin-forced logout
- CORS configured for specific origins
- Environment-based secrets
- Input validation on all endpoints

### 4. Scalability
- Stateless JWT authentication (horizontal scaling)
- MongoDB for flexible data modeling
- Docker containerization
- Environment-based configuration

### 5. Developer Experience
- TypeScript for better tooling
- Hot reload in development
- Comprehensive error messages
- API documentation with Swagger
- Docker for consistent environments

## Key Components

### Authentication Flow
1. User registers or logs in
2. Credentials validated
3. Short-lived access token (5m) generated and returned in response body
4. Refresh token generated and set as secure httpOnly cookie
5. Refresh session (SHA-256 hash of token) persisted in MongoDB
6. Client includes access token in `Authorization: Bearer` header
7. Middleware verifies token on protected routes
8. When access token expires, client calls `POST /auth/refresh` with cookie
9. Old refresh token is revoked, new token pair issued (rotation)
10. If a rotated token is replayed, the entire token family is revoked (reuse detection)

See [Authentication Architecture](./authentication.md) for full details.

### OAuth Flow (Google)
1. Client initiates OAuth flow
2. Redirects to Google consent screen
3. Google redirects back with authorization code
4. Server exchanges code for user profile
5. User created/updated in database
6. JWT token generated and returned

### Request Lifecycle
1. Request received by Express
2. Morgan logs request
3. CORS middleware checks origin
4. Rate limiter checks request count (auth: 5/15 min, API: 100/15 min) → 429 if exceeded
5. Body parser processes request body
6. Session middleware (for OAuth only)
7. Route handler processes request
8. Auth middleware verifies JWT (protected routes)
9. Response sent to client
10. Morgan logs response

## Data Flow

```
Request → CORS → Logger → Rate Limiter → Parser → Session → Passport → Routes → Auth Middleware → Business Logic → Database → Response
```

## Environment Configuration

The application supports multiple environments:
- **Development**: `.env.development` (hot reload, detailed logging)
- **Production**: `.env.production` (optimized, minimal logging)
- **Local**: `.env.local` (optional overrides, gitignored)

### Key Environment Variables

| Variable | Default | Description |
|---|---|---|
| `RATE_LIMIT_ENABLED` | `true` | Set to `false` to disable rate limiting (e.g. local dev) |
| `JWT_EXPIRES_IN` | `5m` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRES_IN` | `7d` | Refresh token lifetime |

## Deployment Architecture

### Development
- Docker Compose with hot reload
- MongoDB container with persistent volumes
- Source code mounted as volume

### Production
- Compiled TypeScript to JavaScript
- Optimized Docker image
- MongoDB with authentication
- Environment variables from secrets management
- Load balancer (recommended)
- HTTPS termination

## Performance Considerations

- **Stateless Auth**: No session storage required
- **Connection Pooling**: Mongoose handles MongoDB connections
- **Async/Await**: Non-blocking I/O throughout
- **Compiled Code**: Production runs optimized JavaScript
- **Docker Layers**: Efficient image caching

## Security Measures

1. **Password Security**
   - bcrypt hashing with salt
   - Never stored in plain text
   - Configurable salt rounds

2. **Token Security**
   - Dual-token system: short-lived access + rotating refresh
   - Access tokens: JWT with 5m default expiry
   - Refresh tokens: httpOnly secure cookie, SHA-256 hashed in DB
   - Token rotation on every refresh
   - Reuse detection with family-wide revocation
   - See [Authentication Architecture](./authentication.md)

3. **Session Security**
   - Secure session cookies (OAuth)
   - HttpOnly and Secure flags (production)
   - Secret stored in environment

4. **CORS Security**
   - Configured allowed origins
   - Credentials support for same-origin
   - Preflight handling

5. **Rate Limiting**
   - Auth endpoints (`/auth/*`): 5 requests per 15 minutes per IP
   - Protected API endpoints (`/api/*`): 100 requests per 15 minutes per IP
   - Returns `429 Too Many Requests` with `RateLimit-*` standard headers
   - Configurable via `RATE_LIMIT_ENABLED` env var
   - Defence-in-depth: app-level backstop; move primary enforcement to Nginx/proxy at scale (see [Backlog](../planning/backlog.md#nginx-reverse-proxy-rate-limiting))

6. **Input Validation**
   - Email format validation
   - Password strength requirements
   - Request body validation

## Monitoring & Logging

- **Request Logs**: Morgan HTTP logger (console + file)
- **Error Logs**: Console error output
- **Access Logs**: File-based in `logs/access.log`
- **Database Logs**: MongoDB connection status

## Future Architecture Considerations

See [Roadmap](../planning/roadmap.md) and [Backlog](../planning/backlog.md) for planned improvements:
- Email verification
- Two-factor authentication
- Admin dashboard
- Metrics and monitoring
- Redis for caching (+ Redis-backed rate limit store for horizontal scaling)
- Nginx reverse proxy rate limiting

---

**Last Updated:** 2026-03-01  
**Author:** Development Team
