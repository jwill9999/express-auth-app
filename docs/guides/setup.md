# Setup Guide

Getting started with the Express Auth API.

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- A MongoDB instance (or use the Docker Compose setup below)

---

## Quick Start (Docker)

```bash
git clone <repo>
cd express-auth-app
cp .env.example .env.development
# Fill in JWT_SECRET, SESSION_SECRET, and any OAuth credentials
docker compose up
```

API available at `http://localhost:3000`. Swagger UI at `http://localhost:3000/api-docs`.

---

## Local Development (no Docker)

```bash
npm install
cp .env.example .env.development
# Set MONGODB_URI=mongodb://localhost:27017/auth-app
npm run dev
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `JWT_SECRET` | ✅ | — | Secret for signing access tokens |
| `SESSION_SECRET` | ✅ | — | Secret for Express sessions (OAuth) |
| `MONGODB_URI` | ✅ | — | MongoDB connection string |
| `PORT` | No | `3000` | HTTP port |
| `JWT_EXPIRES_IN` | No | `5m` | Access token TTL |
| `REFRESH_TOKEN_SECRET` | No | `JWT_SECRET` | Secret for refresh tokens |
| `REFRESH_TOKEN_EXPIRES_IN` | No | `7d` | Refresh token TTL |
| `RATE_LIMIT_ENABLED` | No | `true` | Set to `false` to disable rate limiting |
| `FRONTEND_URL` | No | `http://localhost:5174` | CORS allowed origin |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | — | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | No | — | Google OAuth callback URL |
| `ADMIN_USER_IDS` | No | — | Comma-separated admin user IDs |

---

## Rate Limiting

By default rate limiting is enabled:
- `/auth/*` endpoints: **5 requests per 15 minutes** per IP
- `/api/*` endpoints: **100 requests per 15 minutes** per IP

To disable during local development, set in `.env.development`:

```
RATE_LIMIT_ENABLED=false
```

---

## Running Tests

```bash
npm test                  # Run all tests once
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
```

Tests use mocked dependencies — no database required.

---

**Last Updated:** 2026-03-01
