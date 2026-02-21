# Database Schema

## Overview

The application uses MongoDB as its database with Mongoose as the ODM (Object-Document Mapper).

## Collections

### Users Collection

**Collection Name:** `users`

#### Schema Definition

```typescript
interface IUser extends Document {
  email: string;
  password?: string;
  googleId?: string;
  name?: string;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}
```

#### Fields

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `_id` | ObjectId | Yes (auto) | Yes | MongoDB document ID |
| `email` | String | Yes | Yes | User's email address (lowercase, trimmed) |
| `password` | String | Conditional* | No | Bcrypt hashed password |
| `googleId` | String | No | Yes (sparse) | Google OAuth user ID |
| `name` | String | No | No | User's display name |
| `createdAt` | Date | Yes (auto) | No | Account creation timestamp |

\* *Required only if `googleId` is not present*

#### Indexes

- `email`: Unique index (case-insensitive via lowercase)
- `googleId`: Unique sparse index (only indexed when value exists)

#### Validation Rules

**Email:**
- Must be valid email format
- Automatically converted to lowercase
- Whitespace trimmed
- Unique across all users

**Password:**
- Required if not OAuth user
- Minimum 8 characters (enforced by validation middleware)
- Must contain: 1 uppercase, 1 lowercase, 1 number, 1 special character
- Automatically hashed before saving (bcrypt, 10 salt rounds)

**GoogleId:**
- Optional
- Must be unique if provided
- Sparse index (doesn't index null values)

**Name:**
- Optional
- No length restrictions

#### Methods

**`comparePassword(candidatePassword: string): Promise<boolean>`**
- Compares plain text password with stored hash
- Returns `true` if match, `false` otherwise
- Returns `false` if password is undefined (OAuth users)

#### Hooks (Middleware)

**Pre-save Hook:**
```typescript
userSchema.pre('save', async function() {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
```

- Runs before saving document
- Hashes password if modified or new
- Skips if password unchanged or undefined
- Uses bcrypt with 10 salt rounds

## Example Documents

### Email/Password User

```json
{
  "_id": "699116fe380365380f2ac5a6",
  "email": "user@example.com",
  "password": "$2a$10$rK8F3dD.HqN5.Xj7Z2pQyeK3xY...",
  "name": "John Doe",
  "createdAt": "2026-02-15T00:44:34.123Z"
}
```

### OAuth (Google) User

```json
{
  "_id": "699117ab380365380f2ac5b1",
  "email": "user@gmail.com",
  "googleId": "1234567890",
  "name": "Jane Smith",
  "createdAt": "2026-02-15T00:45:10.456Z"
}
```

### Linked Account (Email + Google)

```json
{
  "_id": "699118cd380365380f2ac5c2",
  "email": "user@example.com",
  "password": "$2a$10$rK8F3dD.HqN5.Xj7Z2pQyeK3xY...",
  "googleId": "0987654321",
  "name": "Bob Johnson",
  "createdAt": "2026-02-15T00:46:22.789Z"
}
```

## Data Relationships

The application has two collections:

- **Users** — user accounts (email/password and OAuth)
- **RefreshSessions** — active and revoked refresh token sessions, linked to users by `userId`

See [Authentication Architecture](./authentication.md) for the RefreshSession schema and lifecycle.

## Query Patterns

### Common Queries

**Find by Email:**
```typescript
const user = await User.findOne({ email: 'user@example.com' });
```

**Find by Google ID:**
```typescript
const user = await User.findOne({ googleId: '1234567890' });
```

**Find by ID:**
```typescript
const user = await User.findById(userId);
```

**Create User:**
```typescript
const user = await User.create({
  email: 'user@example.com',
  password: 'plainTextPassword', // Will be hashed automatically
  name: 'John Doe'
});
```

**Update User:**
```typescript
user.googleId = '1234567890';
user.name = 'Updated Name';
await user.save(); // Triggers pre-save hooks
```

## Performance Considerations

### Indexes
- Email and googleId are indexed for fast lookups
- Sparse index on googleId saves space
- Compound queries may need additional indexes as app grows

### Connection Pooling
- Mongoose handles connection pooling automatically
- Default pool size: 5 connections
- Configurable via connection string options

## Security

### Password Storage
- Never store plain text passwords
- Bcrypt with 10 salt rounds
- Salt is unique per password
- One-way hashing (cannot reverse)

### Google ID Storage
- Stored as plain string
- Not sensitive (public identifier from Google)
- Used to link Google account to user

## Migration Notes

### From JavaScript to TypeScript (2026-02-15)
- Added TypeScript interfaces
- Maintained backward compatibility
- No schema changes required
- Data migration: None needed

## Future Schema Changes

See [Backlog](../planning/backlog.md) for planned schema additions:
- Email verification fields (`emailVerified`, `verificationToken`)
- Two-factor authentication (`twoFactorSecret`, `twoFactorEnabled`)
- Password reset fields (`resetToken`, `resetTokenExpiry`)
- Account status (`status`, `lastLogin`, `loginCount`)
- Roles and permissions (`roles`, `permissions`)

---

**Last Updated:** 2026-02-21  
**Schema Version:** 1.1  
**Mongoose Version:** 9.2.1
