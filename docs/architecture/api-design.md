# API Design Principles

Design guidelines for the Express Auth API.

## RESTful Conventions

- Resources are nouns, actions are HTTP verbs
- Use standard HTTP status codes (`200`, `201`, `400`, `401`, `403`, `429`, `500`)
- All responses follow a consistent shape: `{ success, message, ...data }`

## Response Shape

**Success:**
```json
{ "success": true, "message": "...", "token": "...", "user": { ... } }
```

**Error:**
```json
{ "success": false, "message": "Descriptive error message" }
```

## Error → HTTP Mapping

| Domain Error | Status |
|---|---|
| `ValidationError` | 400 |
| `UserAlreadyExistsError` | 400 |
| `InvalidCredentialsError` | 401 |
| `SessionNotFoundError` | 401 |
| `SessionExpiredError` | 401 |
| `SessionRevokedError` | 401 |
| `TokenReuseDetectedError` | 401 |
| Rate limit exceeded | 429 |
| Unhandled / unexpected | 500 |

## Versioning

API versioning is planned — see [Backlog: API Versioning](../planning/backlog.md#api-versioning).

---

**Last Updated:** 2026-03-01
