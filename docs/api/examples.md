# API Examples

Common request/response examples using `curl`.

> See [Authentication](./authentication.md) for full endpoint reference.

---

## Register

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password1!","name":"Jane Doe"}'
```

---

## Login

```bash
curl -c cookies.txt -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password1!"}'
```

---

## Access a Protected Route

```bash
curl http://localhost:3000/api/data \
  -H "Authorization: Bearer <access-token>"
```

---

## Refresh Token

```bash
curl -b cookies.txt -c cookies.txt -X POST http://localhost:3000/auth/refresh
```

---

## Logout

```bash
curl -b cookies.txt -X POST http://localhost:3000/auth/logout
```

---

## Rate Limit Response (`429`)

```json
{
  "success": false,
  "message": "Too many requests, please try again after 15 minutes."
}
```
Headers included: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`.

---

**Last Updated:** 2026-03-01
