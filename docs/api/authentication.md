# Authentication API

Detailed documentation for all `/auth/*` endpoints.

> 💡 See [Authentication Architecture](../architecture/authentication.md) for the full token lifecycle and security design.

---

## Rate Limiting

All `/auth/*` endpoints are limited to **5 requests per 15 minutes per IP**. Exceeding the limit returns `429 Too Many Requests`.

---

## POST `/auth/register`

Register a new user account.

**Request body**
```json
{
  "email": "user@example.com",
  "password": "Password1!",
  "name": "Jane Doe"
}
```

Password must contain: uppercase, lowercase, digit, and special character (`!@#$%^&*(),.?":{}|<>`).

**Response `201`**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "<access-token>",
  "user": { "id": "...", "email": "user@example.com", "name": "Jane Doe" }
}
```
Sets `refreshToken` httpOnly cookie.

**Errors:** `400` validation error · `400` user already exists · `429` rate limit

---

## POST `/auth/login`

Login with email and password.

**Request body**
```json
{ "email": "user@example.com", "password": "Password1!" }
```

**Response `200`**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "<access-token>",
  "user": { "id": "...", "email": "user@example.com", "name": "Jane Doe" }
}
```
Sets `refreshToken` httpOnly cookie.

**Errors:** `401` invalid credentials · `429` rate limit

---

## POST `/auth/refresh`

Exchange a refresh token for a new access token. The refresh token is rotated on every call.

**Cookie required:** `refreshToken` (set automatically on login/register)

**Response `200`**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "token": "<new-access-token>",
  "user": { "id": "...", "email": "user@example.com", "name": "Jane Doe" }
}
```
Sets a new `refreshToken` httpOnly cookie (old one is invalidated).

**Errors:** `401` invalid/expired/revoked token · `401` reuse detected (entire family revoked)

---

## POST `/auth/logout`

Logout the current session. Clears the refresh token cookie.

**Cookie optional:** `refreshToken`

**Response `200`**
```json
{ "success": true, "message": "Logged out successfully" }
```

---

## POST `/auth/logout-all`

Logout all sessions for the authenticated user.

**Headers:** `Authorization: Bearer <access-token>`

**Response `200`**
```json
{ "success": true, "message": "All sessions revoked" }
```

**Errors:** `401` missing/invalid token

---

## POST `/auth/admin/revoke`

Admin: revoke all sessions for a specific user.

**Headers:** `Authorization: Bearer <access-token>` (must be an admin user ID)

**Request body**
```json
{ "userId": "<target-user-id>" }
```

**Response `200`**
```json
{ "success": true, "message": "User sessions revoked" }
```

**Errors:** `401` missing/invalid token · `403` not an admin · `400` missing userId

---

## GET `/auth/google`

Initiate Google OAuth 2.0 login. Redirects to Google consent screen.

---

## GET `/auth/google/callback`

Google OAuth callback. On success returns the same response shape as login and sets the refresh cookie.

---

**Last Updated:** 2026-03-01
