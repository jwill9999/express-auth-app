# Deployment Guide

Production deployment for the Express Auth API.

## Docker Compose (Production)

```bash
cp .env.example .env.production
# Fill in all required secrets
docker compose -f docker-compose.prod.yml up -d
```

## Environment

Set all required variables in `.env.production`. Never commit secrets.

Key production settings:

```
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
SESSION_SECRET=<strong-random-secret>
RATE_LIMIT_ENABLED=true
```

## Rate Limiting

Rate limiting is enabled by default in production (`RATE_LIMIT_ENABLED=true`).

Current limits (app-level, in-memory store):

| Route | Limit | Window |
|---|---|---|
| `/auth/*` | 5 req | 15 min |
| `/api/*` | 100 req | 15 min |

> **Scaling note:** The in-memory store means each Node.js instance maintains independent counters. Before running multiple instances, upgrade to a Redis-backed store — see [Backlog: Redis Rate Limit Store](../planning/backlog.md#redis-rate-limit-store).

> **Future:** Move primary rate limiting to Nginx reverse proxy. See [Backlog: Nginx Rate Limiting](../planning/backlog.md#nginx-reverse-proxy-rate-limiting).

## HTTPS

Terminate TLS at the load balancer or reverse proxy. Set `secure: true` on cookies in production (already handled via `NODE_ENV=production` check in `server.ts`).

---

**Last Updated:** 2026-03-01
