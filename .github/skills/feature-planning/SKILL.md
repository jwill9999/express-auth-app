---
name: feature-planning
description: Break down feature requirements into trackable sub-tasks linked to documentation. Use this skill when planning new features, decomposing requirements, creating feature plans, or organizing implementation work into actionable steps. Triggers on tasks involving feature planning, requirement breakdown, task decomposition, implementation planning, or sprint planning.
---

# Feature Planning Skill

## Purpose

Provide a structured workflow for breaking down feature requirements into trackable sub-tasks, each linked to relevant project documentation. This ensures features are well-planned before implementation begins.

## When to Use

- Planning a new feature from the backlog
- Breaking down a large requirement into smaller tasks
- Creating an implementation plan for a feature
- Organizing work for a sprint or milestone
- Decomposing a user story into technical tasks

## Workflow

### Step 1: Understand the Requirement

1. Read the feature description from `docs/planning/backlog.md` (if it exists there)
2. Review related architecture docs in `docs/architecture/`
3. Check for dependencies on other backlog items
4. Identify the affected layers (domain, application, infrastructure, interface) per `architecture.instructions.md`

### Step 2: Create a Feature Plan

1. Create a new file at `docs/planning/features/<feature-name>.md` using the template below
2. Break the feature into sub-tasks with clear acceptance criteria
3. Link each sub-task to the documentation it will affect
4. Estimate effort for each sub-task
5. Identify dependencies between sub-tasks and order them

### Step 3: Update Planning Docs

1. Update `docs/planning/backlog.md` — set status to `🚧 In Planning` and link to the feature plan
2. If the feature is new (not in backlog), add it to `docs/planning/backlog.md` first
3. Cross-reference related features or documentation

### Step 4: After Implementation

1. Check off completed sub-tasks in the feature plan
2. When all sub-tasks are done, move the feature to `docs/planning/index.md`
3. Update `docs/planning/backlog.md` — remove or mark as `✅ Complete`
4. Add a changelog entry in `docs/changelog/`

## Feature Plan Template

Use this structure when creating `docs/planning/features/<feature-name>.md`:

```markdown
# Feature: [Feature Name]

**Created:** YYYY-MM-DD
**Status:** 📋 Planning | 🚧 In Progress | ✅ Complete
**Priority:** 🔴 High | 🟡 Medium | 🟢 Low
**Effort:** Small | Medium | Large
**Backlog Ref:** [Link to backlog entry](../backlog.md#feature-anchor)

## Overview

Brief description of the feature and its business value.

## Sub-Tasks

### 1. [Task Name]
- **Layer:** Domain | Application | Infrastructure | Interface
- **Effort:** Small
- **Status:** ⬜ Not Started | 🚧 In Progress | ✅ Done
- **Description:** What needs to be done
- **Files to Create/Modify:**
  - `src/domain/...`
  - `src/application/...`
- **Docs to Update:**
  - `docs/architecture/...`
  - `docs/api/...`
- **Acceptance Criteria:**
  - [ ] Criterion 1
  - [ ] Criterion 2

### 2. [Task Name]
...

## Dependencies

- **Requires:** List features or tasks that must be completed first
- **Blocks:** List features or tasks that depend on this

## Architecture Notes

Any design decisions, diagrams, or technical considerations.

## Documentation Impact

| Document | Change Required |
|----------|----------------|
| `docs/api/endpoints.md` | Add new endpoint docs |
| `docs/architecture/overview.md` | Update architecture diagram |
| `docs/guides/setup.md` | Update setup instructions |

## Testing Strategy

- Unit tests: ...
- Integration tests: ...
- E2E tests: ...
```

## Conventions

- **File naming:** Use kebab-case for feature plan files (e.g., `refresh-token.md`, `rate-limiting.md`)
- **Sub-task ordering:** Order by dependency — tasks that others depend on come first
- **Layer tagging:** Always tag which architecture layer each sub-task belongs to
- **Doc linking:** Every sub-task must reference which docs it will affect
- **Status tracking:** Keep sub-task statuses current as implementation progresses

## Integration with Other Skills

- **docs skill:** Feature plans follow the same formatting conventions as `docs/planning/` documents
- After completing a feature plan, use the `docs` skill to update index, backlog, and changelog

## Examples

### Planning a Backlog Feature

When asked to plan "Refresh Token Implementation" from the backlog:

1. Read the backlog entry at `docs/planning/backlog.md#refresh-token-implementation`
2. Create `docs/planning/features/refresh-token.md`
3. Break into sub-tasks:
   - Domain: Create `RefreshToken` entity and value objects
   - Application: Define `RefreshTokenRepository` port, create use cases
   - Infrastructure: Implement Mongo repository, update JWT provider
   - Interface: Add `/auth/refresh` and `/auth/logout` endpoints
   - Testing: Unit + integration tests
   - Documentation: Update API docs, architecture docs
4. Update backlog status to `🚧 In Planning`

### Planning a New Feature

When asked to plan a feature not yet in the backlog:

1. Add the feature to `docs/planning/backlog.md` with priority and effort
2. Create the feature plan file in `docs/planning/features/`
3. Follow the same sub-task breakdown process

---

**Last Updated:** 2026-02-21
**Maintained By:** Development Team
