# ──────────────────────────────────────────────
#  Express Auth API — Makefile
# ──────────────────────────────────────────────

.PHONY: help install dev start build test test-watch test-coverage \
        lint lint-fix lint-deps format format-check typecheck validate \
        docker-up docker-down docker-logs docker-prod-up docker-prod-down docker-prod-logs \
        clean

# ── Default ──────────────────────────────────

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ── Setup ────────────────────────────────────

install: ## Install dependencies
	npm ci

# ── Development ──────────────────────────────

dev: ## Start dev server with hot reload
	npm run dev

start: ## Run production build
	npm start

build: ## Compile TypeScript to dist/
	npm run build

# ── Quality ──────────────────────────────────

lint: ## Run ESLint on src/
	npm run lint

lint-fix: ## Run ESLint with auto-fix
	npm run lint:fix

lint-deps: ## Check architecture boundary rules
	npm run lint:deps

format: ## Format all source files with Prettier
	npm run format

format-check: ## Check formatting without writing
	npm run format:check

typecheck: ## Type-check without emitting (tsc --noEmit)
	npm run typecheck

test: ## Run test suite
	npm test

test-watch: ## Run tests in watch mode
	npm run test:watch

test-coverage: ## Run tests with coverage report
	npm run test:coverage

validate: ## Run all checks (typecheck + lint + boundaries + format)
	npm run validate

# ── Docker (Development) ─────────────────────

docker-up: ## Start dev containers
	docker compose up -d

docker-down: ## Stop dev containers
	docker compose down

docker-logs: ## Tail dev container logs
	docker compose logs -f

# ── Docker (Production) ─────────────────────

docker-prod-up: ## Start production containers
	docker compose -f docker-compose.prod.yml up -d

docker-prod-down: ## Stop production containers
	docker compose -f docker-compose.prod.yml down

docker-prod-logs: ## Tail production container logs
	docker compose -f docker-compose.prod.yml logs -f

# ── Cleanup ──────────────────────────────────

clean: ## Remove dist/ and node_modules/
	rm -rf dist node_modules
