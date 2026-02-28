# Copilot Instructions

## Commands

```bash
npm run dev              # Start dev server with hot reload (tsx watch)
npm run build            # Compile TypeScript to dist/
npm run test             # Run all tests once (vitest run)
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report

# Run a single test file
npx vitest run tests/application/auth/LoginUser.test.ts

npm run lint             # ESLint on src/
npm run lint:deps        # Enforce architecture boundaries (dependency-cruiser)
npm run typecheck        # Type-check without emitting
npm run validate         # typecheck + lint + lint:deps + format:check (runs on pre-push)
```

Pre-commit hook: runs `lint-staged` (prettier + eslint on staged files), `typecheck`, and `lint:deps`.

## Architecture

This project follows **Clean Architecture (Hexagonal / Ports & Adapters)** with four layers:

```
src/domain/          → Entities, value objects, domain errors — no npm imports
src/application/     → Use cases, port interfaces (abstractions), DTOs
src/infrastructure/  → Implementations: MongoUserRepository, JwtTokenProvider, BcryptPasswordHasher, Passport
src/interfaces/      → Express controllers, middleware, routes, Swagger
src/config/env.ts    → Reads process.env, exports typed config
src/server.ts        → Composition root: wires all layers together
```

**Dependency rule:** dependencies point inward only. `domain` ← `application` ← `infrastructure` / `interfaces`. `src/server.ts` is the only file that imports from all layers.

**`lint:deps` enforces this mechanically** via `.dependency-cruiser.cjs`. Always run it after adding imports across layers.

### Wiring pattern (in `server.ts`)

```ts
const userRepo = new MongoUserRepository();
const tokenProvider = new JwtTokenProvider(config.jwtSecret, config.jwtExpiresIn);
const passwordHasher = new BcryptPasswordHasher();
const registerUser = new RegisterUser(userRepo, passwordHasher, tokenProvider);
const authController = new AuthController(registerUser, loginUser, tokenProvider);
```

All dependencies are injected via constructors. No singletons or service locators.

### Adding a new endpoint

1. Add domain types/errors in `src/domain/<context>/`
2. Define port interface in `src/application/<context>/ports/`
3. Implement use case in `src/application/<context>/use-cases/`
4. Implement infrastructure adapter in `src/infrastructure/<context>/`
5. Add handler to a controller in `src/interfaces/http/controllers/`; add Swagger JSDoc there
6. Register route in `src/interfaces/http/routes.ts`
7. Wire in `src/server.ts`

## Key Conventions

### ESM + TypeScript
All imports use `.js` extensions (even for `.ts` source files): `import { Foo } from './Foo.js'`. This is required by the ESM module system (`"type": "module"` in package.json).

### Error → HTTP mapping
Controllers catch domain errors and map them to status codes. Unhandled errors fall through to `next(error)` → 500.

| Error | Status |
|---|---|
| `ValidationError` | 400 |
| `UserAlreadyExistsError` | 400 |
| `InvalidCredentialsError` | 401 |

### Testing
Tests mirror the `src/` structure under `tests/`. Integration tests use `createApp(deps)` from `src/interfaces/http/app.ts` with mocked use cases injected as `vi.fn()` — no database required.

```ts
const mockRegisterUser = { execute: vi.fn().mockResolvedValue({ token: '...', user: {...} }) };
const app = createApp({ registerUser: mockRegisterUser, loginUser: mockLoginUser, tokenProvider: mockTokenProvider });
const res = await request(app).post('/auth/register').send({...});
```

Unit tests for use cases mock the port interfaces (`UserRepository`, `PasswordHasher`, `TokenProvider`) directly.

### Swagger
API docs live at `/api-docs`. Swagger JSDoc comments belong on the route registration call inside `setupRoutes()` in each controller, not on the handler methods.

### Password validation
`RegisterUser` enforces: uppercase, lowercase, digit, and special character (`!@#$%^&*(),.?":{}|<>`). Validation lives in the use case, not the controller.

### Documentation
Update `docs/planning/index.md` when adding features, `docs/planning/backlog.md` when removing planned items, and `docs/changelog/YYYY-MM.md` for significant changes. See `.github/instructions/docs.instructions.md` for format details.
