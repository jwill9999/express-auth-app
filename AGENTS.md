# Agent Instructions

## Project Overview

- Project: express-auth-app
- Profile: Mixed
- Onboarding status: in_progress
- Summary: No root AGENTS.md was found. Detected mixed Project with 80 relevant evidence files.

## User Workflow Notes

- What kind of work should this Project support: code changes, docs/content, research, automation, or a mix?
  - code changes
- Should I draft root Project instructions before enabling write-capable work?
  - yes

## Project Structure

- Dockerfile (config)
- README.md (docs)
- docker-compose.prod.yml (config)
- docker-compose.yml (config)
- docs/README.md (docs)
- docs/api/authentication.md (docs)
- docs/api/endpoints.md (docs)
- docs/api/examples.md (docs)
- docs/api/index.md (docs)
- docs/architecture/api-design.md (docs)
- docs/architecture/authentication.md (docs)
- docs/architecture/clean-architecture-guidelines.md (docs)

## Apps, Packages, And Services

- No separate app, package, or service scopes were discovered.

## Architecture Overview

- Use the files listed above as read-only evidence until the Project instructions are approved.
- Ask the user before assuming an active subproject, service boundary, or non-code workflow.

## Commands

- pnpm build
- pnpm start
- pnpm dev
- pnpm test
- pnpm test:watch
- pnpm test:coverage
- pnpm lint
- pnpm lint:fix
- pnpm lint:deps

## Docker And Containers

- Use discovered Docker or compose files only after confirming the intended workflow.
- Do not start, rebuild, or remove containers until Project onboarding is approved.

## Environment And Secrets

- Never print, persist, or expose secret values.
- Ask before creating or changing environment files.

## Coding And Content Conventions

- Follow existing files and local project conventions first.
- For mixed or non-code Projects, confirm whether the task is code, docs, research, automation, or another workflow before applying coding assumptions.

## Agent Safety Rules

- Read-only inspection and planning are allowed during onboarding.
- Code writes, commits, installs, migrations, destructive commands, and approval of generated instructions remain blocked until human approval.
- If project scope or commands are ambiguous, ask a focused question instead of guessing.

## Open Questions

- No open onboarding questions remain.
