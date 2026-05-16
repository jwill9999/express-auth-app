# Layer 3 --- Session Continuity Layer Specification

## Purpose

The **Session Continuity Layer** preserves short‑term working context
between AI sessions.

Its purpose is to allow a new AI session to quickly reconstruct:

-   the current objective
-   the active task (if any)
-   progress from the previous session
-   unresolved issues
-   next actions

without requiring the full conversation history.

This mechanism enables reliable **session handoff** across tools such
as:

-   VS Code agents
-   CLI agents
-   ChatGPT
-   Claude
-   future automation tools

------------------------------------------------------------------------

# Specification vs Runtime Artifact

This document is an **architecture specification**.

It defines how the system manages a runtime file called:

    SESSION.md

Relationship:

    session_continuity_layer_spec.md  → defines behaviour
    SESSION.md                        → runtime session state

The runtime file **SESSION.md** is generated and updated during
development workflows.

This specification should **not be confused with the runtime file**.

------------------------------------------------------------------------

# Runtime Artifact

The session continuity system stores working state in:

    SESSION.md

Location:

    repo root

Example:

    repo/
      SESSION.md
      SUMMARY.md
      docs/
      .beads/
      services/

The file acts as an **AI session handoff document**.

------------------------------------------------------------------------

# SESSION.md Structure

The runtime file must follow a **short structured format**.

Recommended template:

``` markdown
# Session Context

## Current Objective
The main feature or goal currently being worked on.

## Active Task
Beads task ID and title (if a task is active).

## Progress Since Last Session
Summary of completed work.

## Decisions Made
Important technical or architectural decisions.

## Open Issues
Unresolved problems or blockers.

## Next Steps
Immediate actions to take when work resumes.

## References
Links to specs, tasks, or relevant files.
```

Target size:

    150–400 words

The goal is to capture **signal**, not the entire conversation.

------------------------------------------------------------------------

# Example Generated SESSION.md

Example runtime file:

``` markdown
# Session Context

## Current Objective
Implement JWT middleware for the auth service.

## Active Task
task-auth-001
feature: add jwt middleware

## Progress Since Last Session
Created middleware structure and integrated JWKS key loader.

## Decisions Made
Using RS256 verification through JWKS endpoint.

## Open Issues
Token expiration edge cases still need testing.

## Next Steps
Write unit tests and update API documentation.

## References
Spec: docs/specs/auth/add-jwt-middleware.md
```

------------------------------------------------------------------------

# When SESSION.md Must Be Updated

The file must be updated at defined workflow checkpoints.

## 1. End of Implementation Session

When an implementation session finishes:

    in_progress → session end

The agent must summarise:

-   progress
-   decisions
-   next steps

and update `SESSION.md`.

------------------------------------------------------------------------

## 2. Task State Transition

When a Beads task changes to:

    review
    blocked
    done

SESSION.md should be refreshed.

------------------------------------------------------------------------

## 3. Major Architectural Decision

When a significant technical decision is made:

    architecture change

the session summary must be updated.

------------------------------------------------------------------------

## 4. Explicit Session Closure

When the agent intentionally ends a session:

    session end

the session context must be written to SESSION.md.

------------------------------------------------------------------------

# Updating SESSION.md During Implementation

During implementation workflows the file should update when:

    task started
    task partially completed
    session ending

Example trigger:

    bd update task-104 --status in_progress

The agent updates:

-   Active Task
-   Progress
-   Next Steps

------------------------------------------------------------------------

# Updating SESSION.md Outside Implementation

Session continuity must also work when no implementation task is active.

Examples:

-   planning architecture
-   investigating bugs
-   design discussions
-   exploratory analysis

In these situations the file should capture:

    current topic
    investigation progress
    pending decisions

Example:

``` markdown
## Current Objective
Investigating CI pipeline failures.

## Progress Since Last Session
Identified ESLint failures in auth middleware tests.

## Next Steps
Fix ESLint configuration and rerun pipeline.
```

------------------------------------------------------------------------

# Injecting SESSION.md at Session Start

When a new agent session begins the system must load context in this
order.

Step 1 --- Load skills and instruction files.

    skills
    instructions

Step 2 --- Load session continuity file.

    SESSION.md

Step 3 --- Load conversation summary.

    SUMMARY.md

Step 4 --- If a task is active:

    bd show <task-id>

Step 5 --- Load the task specification.

------------------------------------------------------------------------

# Session Start Injection Order

The correct context order is:

    skills / instructions
            ↓
    SESSION.md
            ↓
    SUMMARY.md
            ↓
    beads task
            ↓
    specification

This ensures deterministic reasoning context.

------------------------------------------------------------------------

# Relationship with Other Architecture Layers

Session continuity interacts with other layers.

### Beads (Execution Layer)

Provides:

    active task
    task metadata

SESSION.md references the active task.

------------------------------------------------------------------------

### Conversation Summarisation Layer

    SUMMARY.md

Stores condensed conversation history.

SESSION.md stores **work state**, not conversation memory.

------------------------------------------------------------------------

### Skills / Instruction Layer

Skills define **rules and workflows**.

SESSION.md defines **current project state**.

------------------------------------------------------------------------

# File Lifecycle

SESSION.md behaves as a rolling working document.

Lifecycle:

    SESSION.md
        ↓
    updated each session
        ↓
    overwritten as work progresses

Optional archival system:

    session-history/
      2026-03-07.md

This is optional and not required for the initial system.

------------------------------------------------------------------------

# Validation Rules

SESSION.md must remain:

-   concise
-   structured
-   under 500 words

It must **not include**:

-   full conversation logs
-   large code blocks
-   duplicated documentation
-   long architectural explanations

------------------------------------------------------------------------

# Key Principle

SESSION.md represents **short‑term project memory**.

It answers:

    Where did we leave off?

It does **not** store:

    full conversation history

------------------------------------------------------------------------

# Architecture Position

The session continuity layer sits in the architecture here:

    Skills / Instructions
            ↓
    Session Continuity (SESSION.md)
            ↓
    Conversation Summary (SUMMARY.md)
            ↓
    Beads Task
            ↓
    Specification
            ↓
    Implementation

------------------------------------------------------------------------

# Summary

The Session Continuity Layer allows AI development workflows to resume
reliably between sessions.

The system:

-   writes structured session context to `SESSION.md`
-   updates the file during key workflow events
-   injects the file at session start
-   keeps the file concise and structured

This enables agents to continue work without depending on full
conversation history.
