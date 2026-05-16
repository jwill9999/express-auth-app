# Beads Task Integration Specification

## Purpose

Define the standard process for integrating **Beads task management**
into the feature planning workflow.

The planning skill must ensure that every planned feature produces:

1.  A **technical specification**
2.  A **feature planning document**
3.  A **Beads task graph**

This allows implementation agents to operate from a **structured task
graph rather than conversational context**.

------------------------------------------------------------------------

# Architectural Principle

The system separates concerns between planning, execution, and
validation.

  Layer           Responsibility
  --------------- --------------------------------
  Beads           execution graph
  Specification   full requirement definition
  Feature Plan    planning and decomposition
  Skills          reusable engineering knowledge
  Tests           validation of requirements

Beads must remain **lightweight and execution-focused**, while the
specification file contains the full context.

------------------------------------------------------------------------

# Repository Structure

The repository must follow this structure.

    repo/
      docs/
        specs/
        planning/
          features/
        architecture/

      .beads/

      services/

Specification files must be located in:

    docs/specs/<domain>/<feature-slug>.md

Feature plans must be located in:

    docs/planning/features/<feature-slug>.md

------------------------------------------------------------------------

# Planning Artefacts

The planning skill must generate three artefacts.

### 1 Feature Specification

Location:

    docs/specs/<domain>/<feature-slug>.md

The specification must include:

-   overview
-   requirements
-   architecture notes
-   API schema references
-   end-to-end test references
-   acceptance criteria

This file is the **authoritative definition of completion**.

------------------------------------------------------------------------

### 2 Feature Plan

Location:

    docs/planning/features/<feature-slug>.md

The feature plan decomposes the specification into tasks.

------------------------------------------------------------------------

### 3 Beads Task Graph

The planning skill must create Beads tasks representing:

-   epics
-   tasks
-   subtasks
-   dependencies

Each task must reference the specification file.

------------------------------------------------------------------------

# Beads Task Schema

Every Beads task created by the planning skill must contain the
following minimum fields.

``` json
{
  "title": "feature: add jwt middleware",
  "type": "task",
  "status": "ready",
  "priority": 2,
  "labels": ["auth", "backend"],
  "spec": "docs/specs/auth/add-jwt-middleware.md"
}
```

### Field Definitions

  Field      Description
  ---------- ----------------------------
  title      canonical task description
  type       epic, task, subtask
  status     workflow state
  priority   execution ordering
  labels     domain classification
  spec       path to specification file

The `spec` field must always reference the specification document.

------------------------------------------------------------------------

# Task Naming Convention

All tasks must follow this format:

    <type>: <description>

Examples:

    feature: add jwt middleware
    feature: implement refresh tokens
    fix: resolve token expiry bug
    refactor: extract auth service
    chore: update docker configuration

### Rules

Task titles must:

-   use lowercase
-   avoid punctuation
-   describe one outcome
-   start with a type prefix

------------------------------------------------------------------------

# Branch Naming Convention

Branches must be derived from the task title.

Format:

    <type>/<feature-slug>

Example:

    feature/add-jwt-middleware

Slug rules:

-   lowercase
-   hyphen separated
-   no special characters

------------------------------------------------------------------------

# Worktree Convention

Each task must run in its own Git worktree.

Worktree directory format:

    worktrees/<type>-<feature-slug>

Example:

    worktrees/feature-add-jwt-middleware

Command example:

    git worktree add worktrees/feature-add-jwt-middleware feature/add-jwt-middleware

------------------------------------------------------------------------

# Mapping Rules

From a single task title the system must derive all related artefacts.

Example task:

    feature: add jwt middleware

Derived artefacts:

  Artefact       Value
  -------------- ----------------------------------------------
  branch         feature/add-jwt-middleware
  worktree       worktrees/feature-add-jwt-middleware
  spec           docs/specs/auth/add-jwt-middleware.md
  feature plan   docs/planning/features/add-jwt-middleware.md

------------------------------------------------------------------------

# Beads CLI Commands

The planning skill must use the Beads CLI to create tasks.

### Create task

    bd create "feature: add jwt middleware"

### Configure task

    bd update <task-id>   --type task   --status ready   --priority 2   --labels auth backend   --spec docs/specs/auth/add-jwt-middleware.md

### Create dependency

    bd link <task-b> depends_on <task-a>

------------------------------------------------------------------------

# Workflow States

The system must use the following task lifecycle.

    open
    ready
    in_progress
    review
    done
    blocked

### State Definitions

  State         Meaning
  ------------- ----------------------------------------------
  open          task created
  ready         ready to implement
  in_progress   agent actively working
  review        implementation complete, validation required
  done          validated and complete
  blocked       requires engineer intervention

------------------------------------------------------------------------

# Planning Skill Behaviour

When planning a feature the skill must execute the following steps.

### Step 1

Understand the requirement from:

    docs/planning/backlog.md
    docs/architecture/

### Step 2

Create specification:

    docs/specs/<domain>/<feature-slug>.md

### Step 3

Create feature plan:

    docs/planning/features/<feature-slug>.md

### Step 4

Generate Beads task graph.

Create:

-   epic
-   tasks
-   subtasks

### Step 5

Link each task to the specification using the `spec` field.

### Step 6

Define dependencies between tasks.

------------------------------------------------------------------------

# Validation Rules

The planning skill must verify:

### Specification Exists

Every task must include a valid spec path.

### Deterministic Slug

The feature slug must be used consistently across:

-   spec
-   feature plan
-   branch
-   worktree

### Task Graph Integrity

Dependencies must not produce cycles.

------------------------------------------------------------------------

# Implementation Handoff

When planning completes the implementation agent will:

1.  Query ready tasks

```{=html}
<!-- -->
```
    bd ready

2.  Inspect task

```{=html}
<!-- -->
```
    bd show <task-id>

3.  Load specification

```{=html}
<!-- -->
```
    docs/specs/<domain>/<feature-slug>.md

4.  Begin implementation.

------------------------------------------------------------------------

# Completion Principle

Tasks are considered complete when:

-   specification acceptance criteria are satisfied
-   validation pipeline passes
-   task state transitions to `done`

The Beads task only tracks execution state.\
The specification file defines the **definition of done**.

------------------------------------------------------------------------

# Summary

The planning skill must ensure every feature produces:

1.  Specification file
2.  Feature planning document
3.  Beads task graph

All implementation work must be executed from the Beads task graph and
validated against the specification.
