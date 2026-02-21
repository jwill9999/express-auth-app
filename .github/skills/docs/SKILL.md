---
name: docs
description: Update, create, or maintain project documentation in the docs/ folder. Use this skill when writing or editing README files, API endpoint docs, architecture docs, changelog entries, setup guides, troubleshooting guides, backlog items, planning indexes, or any markdown documentation. Triggers on tasks involving docs, documentation, changelog, backlog, roadmap, guides, API reference, or endpoint examples.
---

# Documentation Instructions

## Purpose

Maintain comprehensive, up-to-date documentation for the Express Auth API project.

## Documentation Structure

The `docs/` folder is organized as follows:

```
docs/
├── README.md                 # Documentation index and overview
├── architecture/             # System design and architecture
│   ├── overview.md          # High-level architecture
│   ├── database-schema.md   # MongoDB schema design
│   ├── authentication.md    # Auth flow and JWT strategy
│   └── api-design.md        # API design principles
├── planning/                 # Project planning and tracking
│   ├── index.md             # Completed features and additions
│   ├── backlog.md           # Planned features and improvements
│   └── roadmap.md           # Long-term vision
├── api/                      # API documentation
│   ├── endpoints.md         # Endpoint reference
│   ├── authentication.md    # Auth endpoints
│   └── examples.md          # Request/response examples
├── guides/                   # How-to guides
│   ├── setup.md             # Getting started
│   ├── deployment.md        # Deployment guides
│   ├── development.md       # Development workflow
│   └── troubleshooting.md   # Common issues
└── changelog/                # Change history
    └── YYYY-MM.md           # Monthly changelog entries
```

## Guidelines for Maintaining Documentation

### 1. **Always Update When:**

- Adding new features
- Modifying existing functionality
- Changing API endpoints
- Updating dependencies
- Fixing significant bugs
- Refactoring architecture

### 2. **Documentation Standards:**

- Use clear, concise language
- Include code examples where relevant
- Date all entries in ISO format (YYYY-MM-DD)
- Keep index.md and backlog.md current
- Link between related documents

### 3. **Format for Index Entries:**

```markdown
### [Feature Name] - YYYY-MM-DD

**Status:** ✅ Completed | 🚧 In Progress | ⏸️ Paused
**Author:** [Name/Team]
**Description:** Brief description of what was added
**Files Changed:** List of key files
**Related Docs:** Links to related documentation
```

### 4. **Format for Backlog Entries:**

```markdown
### [Feature Name]

**Priority:** 🔴 High | 🟡 Medium | 🟢 Low
**Effort:** Small | Medium | Large
**Description:** What needs to be done
**Dependencies:** Any blockers or prerequisites
**Acceptance Criteria:** What defines "done"
```

### 5. **Changelog Format:**

Follow Keep a Changelog format:

- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for removed features
- `Fixed` for bug fixes
- `Security` for security-related changes

### 6. **When to Create New Documents:**

- New major feature requires dedicated architecture doc
- Complex process needs step-by-step guide
- Significant refactoring needs planning document
- New integration requires setup guide

### 7. **AI Assistant Responsibilities:**

When working on this project, you should:

- Update relevant documentation automatically
- Suggest new documentation when gaps are identified
- Keep index.md and backlog.md in sync with code changes
- Create changelog entries for significant changes
- Maintain consistency in formatting and structure
- Cross-reference related documentation
- Update timestamps and version information

### 8. **Review Checklist:**

Before completing any task, verify:

- [ ] Updated index.md if feature was added
- [ ] Moved items from backlog.md if completed
- [ ] Added changelog entry if significant
- [ ] Updated architecture docs if design changed
- [ ] Added/updated API docs if endpoints changed
- [ ] Updated guides if setup/deployment changed
- [ ] Added troubleshooting entries if bugs were fixed

## Examples

### Good Index Entry:

```markdown
### TypeScript Migration - 2026-02-15

**Status:** ✅ Completed
**Author:** Development Team
**Description:** Converted entire codebase from JavaScript to TypeScript with strict mode
**Files Changed:** All .js files → .ts in src/, updated tsconfig.json, package.json
**Related Docs:**

- [Architecture: Type System](architecture/typescript.md)
- [Guide: TypeScript Development](guides/development.md#typescript)
  **Impact:** Improved type safety, better IDE support, caught 15+ potential runtime errors
```

### Good Backlog Entry:

```markdown
### Rate Limiting Middleware

**Priority:** 🟡 Medium
**Effort:** Small
**Description:** Add rate limiting to prevent API abuse (e.g., 100 requests per 15 minutes)
**Dependencies:** None
**Acceptance Criteria:**

- [ ] Implement rate limiting middleware using express-rate-limit
- [ ] Configure different limits for auth vs. data endpoints
- [ ] Return proper 429 status with retry-after header
- [ ] Add rate limit documentation to API docs
- [ ] Add integration tests
```

---

**Last Updated:** 2026-02-15
**Maintained By:** Development Team
