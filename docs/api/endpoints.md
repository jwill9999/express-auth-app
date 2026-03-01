# API Endpoints

Complete reference for all available endpoints.

> 💡 **Interactive docs:** Run the server and visit [`http://localhost:3000/api-docs`](http://localhost:3000/api-docs) for the full Swagger UI.

---

## Base URL

```
http://localhost:3000   # Development
https://yourdomain.com  # Production
```

---

## Rate Limits

| Route group | Limit | Window | Response when exceeded |
|---|---|---|---|
| `/auth/*` | 5 requests | 15 minutes | `429 Too Many Requests` |
| `/api/*` | 100 requests | 15 minutes | `429 Too Many Requests` |
| `/` (health) | Unlimited | — | — |

All rate-limited responses include `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset` headers.

Disable rate limiting in development by setting `RATE_LIMIT_ENABLED=false` in `.env.development`.

---

## Health Check

### `GET /`

Returns API status and available endpoints. Not rate limited.

**Response `200`**
```json
{
  "success": true,
  "message": "Auth API is running",
  "documentation": "http://localhost:3000/api-docs"
}
```

---

## Authentication Endpoints

See [Authentication](./authentication.md) for full details on each endpoint.

| Method | Path | Description | Auth required |
|---|---|---|---|
| `POST` | `/auth/register` | Register new user | No |
| `POST` | `/auth/login` | Login with email/password | No |
| `POST` | `/auth/refresh` | Refresh access token | No (cookie) |
| `POST` | `/auth/logout` | Logout current session | No (cookie) |
| `POST` | `/auth/logout-all` | Logout all sessions | Yes (Bearer) |
| `POST` | `/auth/admin/revoke` | Admin: revoke user sessions | Yes (Bearer, admin) |
| `GET` | `/auth/google` | Initiate Google OAuth | No |
| `GET` | `/auth/google/callback` | Google OAuth callback | No |

---

## Protected Endpoints

| Method | Path | Description | Auth required |
|---|---|---|---|
| `GET` | `/api/data` | Sample protected data | Yes (Bearer) |
| `GET` | `/api/profile` | User profile | Yes (Bearer) |

---

## Error Responses

| Status | When |
|---|---|
| `400` | Validation error, user already exists |
| `401` | Invalid credentials, expired/invalid token |
| `403` | Forbidden (insufficient permissions) |
| `429` | Rate limit exceeded |
| `500` | Unexpected server error |

**Standard error body:**
```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

---

**Last Updated:** 2026-03-01
