# Development Workflow

Day-to-day development guide for the Express Auth API.

## Commands

```bash
npm run dev              # Start dev server with hot reload
npm run build            # Compile TypeScript to dist/
npm run test             # Run all tests once
npm run test:watch       # Tests in watch mode
npm run test:coverage    # Tests with coverage report
npm run lint             # ESLint on src/
npm run lint:deps        # Enforce architecture boundaries
npm run typecheck        # Type-check without emitting
npm run validate         # typecheck + lint + lint:deps + format:check
```

## Architecture

Follow Clean Architecture (Hexagonal / Ports & Adapters). See [Architecture Overview](../architecture/overview.md) and [Clean Architecture Guidelines](../architecture/clean-architecture-guidelines.md).

**Adding a new endpoint:**
1. Domain types/errors → `src/domain/<context>/`
2. Port interface → `src/application/<context>/ports/`
3. Use case → `src/application/<context>/use-cases/`
4. Infrastructure adapter → `src/infrastructure/<context>/`
5. Controller handler + Swagger JSDoc → `src/interfaces/http/controllers/`
6. Register route → `src/interfaces/http/routes.ts`
7. Wire → `src/server.ts`

## ESM Import Convention

All imports use `.js` extensions even for `.ts` source files:

```ts
import { Foo } from './Foo.js';
```

## Testing

Tests mirror `src/` under `tests/`. Integration tests use `createApp(deps)` with mocked use cases — no database required.

```ts
const app = createApp({
  registerUser: mockRegisterUser,
  loginUser: mockLoginUser,
  tokenProvider: mockTokenProvider,
  rateLimiting: false,  // always disable in tests
});
```

## Pre-commit Hooks

- `lint-staged` (prettier + eslint on staged files)
- `typecheck`
- `lint:deps`

---

**Last Updated:** 2026-03-01
