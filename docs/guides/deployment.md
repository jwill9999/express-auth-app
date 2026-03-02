# Deployment Guide

Production deployment for the Express Auth API.

## Docker Compose (Production)

```bash
cp .env.production.example .env.production
# Fill in all required secrets
docker compose -f docker-compose.prod.yml up -d
```

## Environment

Set all required variables in `.env.production`. **Never commit `.env.production` to git.**

Key production settings:

```
NODE_ENV=production
JWT_SECRET=<generate: openssl rand -hex 64>
SESSION_SECRET=<generate: openssl rand -hex 64>
RATE_LIMIT_ENABLED=true

# Traefik / domain
APP_DOMAIN=yourdomain.com
TRAEFIK_ACME_EMAIL=admin@yourdomain.com
```

## Reverse Proxy (Traefik)

The production stack uses **Traefik v3** as a reverse proxy in front of the Express app:

- Listens on port **80** (redirects to HTTPS) and **443** (TLS)
- **Let's Encrypt** certificates are obtained and renewed automatically via HTTP challenge — no manual cert management
- Static config lives in `traefik/traefik.prod.yml`; dynamic config (routing, middlewares) is driven by Docker labels on the `app` service
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, HSTS) are applied at the proxy layer via Traefik middleware labels
- The app container **does not** expose port 3000 directly; only Traefik exposes 80/443

```
Internet → Traefik (:443 TLS) → app:3000 (internal)
```

> **Defense-in-depth:** `helmet` is also applied inside Express so security headers are present in any environment (local dev, test, CI) regardless of whether Traefik is running.

## Rate Limiting

Rate limiting is enabled by default in production (`RATE_LIMIT_ENABLED=true`).

Current limits (app-level, in-memory store):

| Route | Limit | Window |
|---|---|---|
| `/auth/*` | 5 req | 15 min |
| `/api/*` | 100 req | 15 min |

> **Scaling note:** The in-memory store means each Node.js instance maintains independent counters. Before running multiple instances, upgrade to a Redis-backed store — see [Backlog: Redis Rate Limit Store](../planning/backlog.md#redis-rate-limit-store).

## HTTPS

TLS is terminated by Traefik with auto-renewed Let's Encrypt certificates. Cookies are set with `secure: true` in production (handled via `NODE_ENV=production` in `server.ts`).

## Health Check

The app exposes `GET /health` → `{ status: "ok" }`. Both the Dockerfile `HEALTHCHECK` and the compose `healthcheck` use this endpoint. Traefik will only route to the container once it is healthy.

---

**Last Updated:** 2026-03-02
