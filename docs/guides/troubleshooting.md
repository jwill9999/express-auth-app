# Troubleshooting

Common issues and solutions.

## `JWT_SECRET environment variable is required`

The app fails to start if `JWT_SECRET` or `SESSION_SECRET` are missing. Ensure you have a `.env.development` (or `.env.production`) file with these set. Copy from `.env.example`:

```bash
cp .env.example .env.development
```

## `429 Too Many Requests` during development

Rate limiting is enabled by default. Set `RATE_LIMIT_ENABLED=false` in `.env.development` to disable it locally.

## MongoDB connection errors

Ensure MongoDB is running. With Docker Compose:

```bash
docker compose up mongodb
```

For local (non-Docker) development, set `MONGODB_URI=mongodb://localhost:27017/auth-app` in `.env.development`.

## Google OAuth not working

- Ensure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` are set
- The callback URL registered in Google Cloud Console must match `GOOGLE_CALLBACK_URL` exactly

## Tests failing with `429`

Integration tests must set `rateLimiting: false` in `createApp()`:

```ts
const app = createApp({ ..., rateLimiting: false });
```

---

**Last Updated:** 2026-03-01
