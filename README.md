# Express Authentication API

[![CI](https://github.com/jwill9999/express-auth-app/actions/workflows/ci.yml/badge.svg)](https://github.com/jwill9999/express-auth-app/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/jwill9999/express-auth-app/branch/main/graph/badge.svg)](https://codecov.io/gh/jwill9999/express-auth-app)
[![Dependency Review](https://github.com/jwill9999/express-auth-app/actions/workflows/pr-checks.yml/badge.svg)](https://github.com/jwill9999/express-auth-app/actions/workflows/pr-checks.yml)
[![Docker](https://github.com/jwill9999/express-auth-app/actions/workflows/docker.yml/badge.svg)](https://github.com/jwill9999/express-auth-app/actions/workflows/docker.yml)

A **TypeScript** Node.js Express application with email/password authentication, Google SSO, JWT tokens, and protected routes.

## Architecture

This service uses **Clean Architecture** with strict layer boundaries enforced by tooling.

| Document | Description |
|----------|-------------|
| [Architecture Overview](docs/architecture/overview.md) | High-level system design and technology stack |
| [Clean Architecture Guidelines](docs/architecture/clean-architecture-guidelines.md) | **Layer rules, file placement, dependency direction, and enforcement** |
| [Database Schema](docs/architecture/database-schema.md) | MongoDB collections and data model |

Run `npm run lint:deps` to verify no architectural boundaries are violated.

## Features

- ✅ **Full TypeScript** with strict mode and no `any` types
- ✅ Email/Password authentication with bcrypt hashing
- ✅ Google OAuth 2.0 SSO
- ✅ JWT token-based authentication
- ✅ MongoDB database with Mongoose
- ✅ Protected API endpoints
- ✅ Error handling
- ✅ Docker support with Docker Compose
- ✅ Swagger API documentation
- ✅ Request logging with Morgan
- ✅ **≥ 90% unit test coverage** across all layers (domain, application, infrastructure, interfaces)
- ✅ **CI/CD pipelines** — automated testing, linting, dependency review, container scanning on every PR
- ✅ **Codecov** integration with coverage badge
- ✅ **Dependabot** — automated weekly dependency and action-pin updates
- ✅ **CodeQL SAST** — static analysis for JavaScript/TypeScript (enabled via GitHub Settings)
- ✅ **Secret Scanning** with push protection (enabled via GitHub Settings)
- ✅ **Trivy container CVE scanning** on every PR and post-merge to main

## Tech Stack

- **TypeScript 5.9+** - Strict typing, no `any` types
- **Node.js 20+** - Runtime
- **Express 5** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication tokens
- **Passport.js** - OAuth strategy
- **Docker** - Containerization

## Prerequisites

### Option 1: Docker (Recommended)
- Docker
- Docker Compose

### Option 2: Local Development
- Node.js (v14 or higher)
- MongoDB (running locally or MongoDB Atlas)
- Google OAuth credentials (for Google SSO)

## Installation

### Environment Configuration

This project uses different environment files for different environments:
- `.env.development` - Development settings (used by default)
- `.env.production` - Production settings
- `.env.local` - Local overrides (optional, gitignored)

### Option 1: Docker Setup (Recommended)

**Development:**
```bash
# Copy and configure development environment
cp .env.development .env.development.local  # Optional: for local overrides

# Start development services
docker-compose up -d

# View logs
docker-compose logs -f app
```

**Production:**
```bash
# Configure production environment
# IMPORTANT: Update .env.production with strong secrets before deploying!
nano .env.production

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
```

The application will be available at `http://localhost:3000`

### Option 2: Local Development

**Prerequisites:**
- Node.js 20+
- MongoDB (or use Docker)

**Steps:**
1. Install dependencies:
```bash
npm install
```

2. Configure environment (uses `.env.development` by default):
```bash
# Development mode with TypeScript watch
npm run dev

# Build TypeScript
npm run build

# Run production build
NODE_ENV=production npm start
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
6. Copy Client ID and Client Secret to `.env` file

## Running the Application

### With Docker

**Development Mode (default):**
```bash
docker-compose up -d
```

**Production Mode:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Stop Services:**
```bash
# Development
docker-compose down

# Production
docker-compose -f docker-compose.prod.yml down

# Stop and remove all data
docker-compose down -v
```

Access the app at `http://localhost:3000` and API docs at `http://localhost:3000/api-docs`

### Without Docker

**Development:**
```bash
npm run dev
```

**Production:**
```bash
NODE_ENV=production npm start
```

The server will run on `http://localhost:3000`

## API Endpoints

### Public Endpoints

#### Register
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### Google OAuth Login
```bash
GET /auth/google
```
Opens Google OAuth consent screen. After successful authentication, redirects to callback.

### Protected Endpoints

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

#### Get Dummy Data
```bash
GET /api/data
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "message": "Protected data accessed successfully",
  "user": {
    "id": "123",
    "email": "user@example.com"
  },
  "data": {
    "items": [
      { "id": 1, "name": "Item 1", "value": 100 },
      { "id": 2, "name": "Item 2", "value": 200 },
      { "id": 3, "name": "Item 3", "value": 300 }
    ],
    "statistics": {
      "totalItems": 3,
      "totalValue": 600,
      "averageValue": 200
    },
    "timestamp": "2026-02-14T23:50:00.000Z"
  }
}
```

#### Get Profile
```bash
GET /api/profile
Authorization: Bearer <token>
```

## Testing with cURL

Register:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

Login:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

Access protected endpoint:
```bash
curl http://localhost:3000/api/data \
  -H "Authorization: Bearer <your-token>"
```

## API Documentation

Once the server is running, visit `http://localhost:3000/api-docs` for interactive Swagger API documentation.

## Project Structure

This project follows **Clean Architecture (Hexagonal / Ports & Adapters)**. See the [Architecture Guidelines](docs/architecture/clean-architecture-guidelines.md) for full rules.

```
src/
├── domain/auth/                # Pure business core — entities, errors
│   ├── User.ts
│   ├── AuthToken.ts
│   └── errors.ts
├── application/auth/           # Use cases & port interfaces
│   ├── ports/                  #   UserRepository, TokenProvider, PasswordHasher
│   ├── use-cases/              #   RegisterUser, LoginUser
│   └── dtos/                   #   RegisterDTO, LoginDTO
├── infrastructure/auth/        # Adapter implementations
│   ├── database/               #   MongoDB connection
│   ├── repositories/           #   MongoUserRepository
│   └── providers/              #   JwtTokenProvider, BcryptPasswordHasher, Passport
├── interfaces/http/            # Express HTTP layer
│   ├── controllers/            #   AuthController, ProtectedController
│   ├── middleware/             #   AuthMiddleware, logger
│   ├── routes.ts
│   └── swagger.ts
├── config/
│   └── env.ts                  # Centralized env config
└── server.ts                   # Composition root — wires all layers
```

## Docker Services

### Development (`docker-compose.yml`)
- Uses `.env.development` file
- MongoDB with default dev credentials
- Hot-reload enabled with volume mounting
- Container names: `express-auth-app-dev`, `express-auth-mongodb-dev`

### Production (`docker-compose.prod.yml`)
- Uses `.env.production` file
- MongoDB with configurable secure credentials
- Optimized for production (no hot-reload)
- Container names: `express-auth-app-prod`, `express-auth-mongodb-prod`

**MongoDB Configuration:**
- Port: 27017
- Data persistence with volumes
- Development credentials: admin/password123
- Production credentials: Set via environment variables

**App Configuration:**
- Port: 3000
- Automatically waits for MongoDB to be healthy
- Environment-specific configuration loaded from respective `.env` files

## CI/CD Pipelines

Every push and pull request targeting `main` runs the following automated checks. **All four gates must pass before a PR can be merged.**

### Workflow overview

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| [CI](.github/workflows/ci.yml) | push + PR → main | Typecheck, lint, architecture boundary check, format check, tests, coverage upload to Codecov |
| [PR Checks](.github/workflows/pr-checks.yml) | PR → main | Dependency Review — blocks PRs that introduce HIGH/CRITICAL CVE dependencies |
| [Docker](.github/workflows/docker.yml) | push + PR → main | Docker image build verification + Trivy container CVE scan |
| [Dependabot](.github/dependabot.yml) | weekly (Monday) | Automated PRs to update npm deps and pin GitHub Actions to latest SHAs |

### CI (`ci.yml`)

Runs on every push to `main` and every PR targeting `main`.

Steps in order:
1. **Typecheck** — `tsc --noEmit`
2. **Lint** — ESLint over `src/`
3. **Architecture boundaries** — `dependency-cruiser` enforces Clean Architecture layer rules
4. **Format check** — Prettier consistency check
5. **Tests with coverage** — Vitest; ≥ 90% coverage enforced across all layers
6. **Codecov upload** — Coverage report published; badge kept current on `main`

### PR Checks (`pr-checks.yml`)

Runs only on PRs targeting `main`.

- **Dependency Review** — compares the dependency graph before and after the PR; fails on any new HIGH or CRITICAL severity CVE being introduced.
- Comments a summary on non-fork PRs (fork PRs use a read-only token so commenting is skipped).

### Docker (`docker.yml`)

Runs on every push to `main` and every PR targeting `main`.

Two jobs:

| Job | When | What it does |
|-----|------|--------------|
| **Docker Build** | always | Builds the production image to confirm the `Dockerfile` is healthy |
| **Trivy CVE Scan** | always | Scans the built image for HIGH/CRITICAL CVEs; results visible in Actions log on PRs, uploaded to the GitHub Security tab on push to main |

> **Note:** `exit-code: 0` is set so existing base-image CVEs don't block every PR. Raise to `1` once the image is fully clean.

### Dependabot (`.github/dependabot.yml`)

Automated weekly pull requests (Mondays 09:00 UTC+0 London) for:
- **`github-actions`** — keeps all action SHA pins current
- **`npm`** — keeps application dependencies up to date; `@types/*` and `eslint*` packages are batched into grouped PRs to reduce noise

### Security features (enabled in GitHub Settings)

These run outside of workflow files and are configured directly in the repository:

| Feature | Location |
|---------|---------|
| **CodeQL SAST** | Settings → Code security → Code scanning → Default setup |
| **Secret Scanning + Push Protection** | Settings → Code security → Secret scanning |
| **Dependency Graph** | Settings → Code security → Dependency graph |
| **Dependabot Alerts** | Enabled automatically once Dependency Graph is on |

### Branch protection (`main`)

The following rules are enforced on `main`:

- ✅ All four required status checks must pass: `Test & Coverage`, `Dependency Review`, `Docker Build`, `Analyze (javascript-typescript)`
- ✅ Branch must be up to date with `main` before merging
- ✅ At least 1 approving review required; stale reviews dismissed on new commits
- ✅ Force pushes and branch deletion are blocked
- ✅ Rules apply to administrators

## Security Notes

- Passwords are hashed using bcrypt with salt rounds of 10
- JWT tokens expire in 24 hours (configurable)
- Always use HTTPS in production
- **IMPORTANT**: Change all default secrets in `.env.production` before deploying
- Never commit `.env`, `.env.development`, or `.env.production` to version control
- Use `.env.*.local` files for local overrides (automatically gitignored)
- Production MongoDB credentials should be strong and unique
- Rotate secrets regularly in production

## Environment Variables

| Variable | Description | Development Default | Production |
|----------|-------------|---------------------|------------|
| `NODE_ENV` | Environment mode | `development` | `production` |
| `PORT` | Server port | `3000` | `3000` |
| `MONGODB_URI` | MongoDB connection string | Uses Docker service | Must be configured |
| `JWT_SECRET` | JWT signing secret | Dev placeholder | **Must change** |
| `JWT_EXPIRES_IN` | Token expiration | `24h` | `24h` |
| `SESSION_SECRET` | Session signing secret | Dev placeholder | **Must change** |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Optional | Optional |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | Optional | Optional |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | `localhost:3000` | Your domain |

## License

ISC
