# Layer 6 --- Context Injection Hooks Specification

## Purpose

The **Context Injection Hooks Layer** orchestrates how runtime context
is loaded, updated, and injected into the agent during development
workflows.

This layer coordinates interaction between:

-   Skills / instruction knowledge
-   SESSION.md (session continuity)
-   Conversation compression summaries
-   Beads tasks
-   Specification documents
-   Mulch experience entries

Hooks automate lifecycle events so agents receive the correct context
without manual intervention.

------------------------------------------------------------------------

# Design Principles

### Hooks Are Optional

Hooks are **optional orchestration enhancements**.

The architecture must remain compatible with environments that do not
support hooks.

Fallback behaviour should exist via:

    CLI scripts
    manual commands
    agent runtime logic

This ensures compatibility with:

    VSCode agents
    CLI agents
    ChatGPT workflows
    Claude workflows
    custom LLM runtimes

------------------------------------------------------------------------

# Hook Locations

Hooks support **hybrid installation**.

### Repository Hooks

    repo/.agent/hooks/

Used for project-specific automation.

Example:

    repo/.agent/hooks/session-start.sh
    repo/.agent/hooks/task-start.sh

------------------------------------------------------------------------

### Global Hooks

    ~/.agent/hooks/

Used for reusable cross-project automation.

Example:

    ~/.agent/hooks/session-start.sh
    ~/.agent/hooks/task-start.sh

------------------------------------------------------------------------

### Hook Resolution Order

Hooks should execute in the following order:

    repo hooks
    ↓
    global hooks

Repository hooks override global behaviour.

------------------------------------------------------------------------

# Hook Trigger Types

Hooks can be triggered by three categories of events.

------------------------------------------------------------------------

## 1 Command Triggers

Triggered by explicit user or agent commands.

Examples:

    agent start
    agent end
    agent task start

Purpose:

    explicit lifecycle control

------------------------------------------------------------------------

## 2 Task Triggers

Triggered by task management operations.

Examples:

    bd ready
    bd show
    bd update

Purpose:

    load task context
    prepare implementation environment

------------------------------------------------------------------------

## 3 Runtime Triggers

Triggered automatically by the agent runtime.

Examples:

    conversation length threshold
    topic shift
    context rebuild

Purpose:

    maintain prompt context quality

------------------------------------------------------------------------

# Hook Types

## SessionStart Hook

Triggered when a new AI session begins.

### Responsibilities

Load baseline context.

### Injected Context

    skills / instructions
    SESSION.md

Optional:

    recent conversation summary

------------------------------------------------------------------------

## TaskStart Hook

Triggered when a Beads task becomes active.

Examples:

    bd ready
    bd show <task>

### Injected Context

    task metadata
    specification file
    feature plan

Purpose:

    ensure implementation context is available

------------------------------------------------------------------------

## ConversationThreshold Hook

Triggered when conversation length exceeds threshold.

Example threshold:

    30 messages

### Action

    run conversation compression
    replace earlier messages with segment summaries
    retain recent messages

This integrates with **Layer 4 --- Conversation Compression**.

------------------------------------------------------------------------

## SessionEnd Hook

Triggered when a session ends.

### Responsibilities

Persist session progress.

### Allowed Writes

    SESSION.md
    .mulch/mulch.jsonl

Hooks must not modify other repository files.

------------------------------------------------------------------------

# File Write Permissions

Hooks are allowed to write only to the following locations:

    SESSION.md
    .mulch/mulch.jsonl

All other repository files must be treated as **read-only**.

------------------------------------------------------------------------

# First-Run Permission Prompt

If a hook attempts to write to a managed file for the first time, the
system should prompt the user.

Example:

    Allow agent to update SESSION.md? [y/N]

User approval should be stored in:

    .agent/config.json

Subsequent runs should proceed silently.

------------------------------------------------------------------------

# Context Injection Order

When constructing the final prompt, context should be injected in the
following order:

    skills / instructions
    SESSION.md
    conversation compression summary
    recent conversation messages
    beads task context
    specification

This ensures the model sees:

    rules
    session continuity
    conversation reasoning
    execution context

------------------------------------------------------------------------

# Hook Chaining

Hooks may execute sequentially.

Example execution chain:

    SessionStart
       ↓
    load skills
       ↓
    load SESSION.md
       ↓
    check active beads task
       ↓
    load specification

Hook chaining allows modular extension of behaviour.

------------------------------------------------------------------------

# Integration with Other Layers

The Context Injection Hooks Layer coordinates all architecture layers.

    Skills / Instructions
            ↓
    SessionStart Hook
            ↓
    SESSION.md
            ↓
    Conversation Compression
            ↓
    Recent Chat Turns
            ↓
    TaskStart Hook
            ↓
    Beads Task
            ↓
    Specification
            ↓
    Implementation
            ↓
    Mulch Lessons

------------------------------------------------------------------------

# Runtime State

Runtime state should remain **ephemeral**.

Examples:

    conversation segments
    compression summaries
    active runtime context

Persisted artifacts remain limited to:

    SESSION.md
    mulch.jsonl
    beads tasks

------------------------------------------------------------------------

# Benefits

### Automation

Correct context is injected automatically.

### Modular Architecture

Each layer remains independent.

### Tool Independence

Compatible with multiple agent environments.

### Extensibility

Hook chaining allows incremental improvements.

------------------------------------------------------------------------

# Summary

The Context Injection Hooks Layer orchestrates context flow across the
system.

Key characteristics:

    hybrid hook locations
    three trigger types
    controlled file writes
    optional implementation
    hook chaining support
    framework independence

This layer completes the architecture stack:

    Layer 1 — Beads execution layer
    Layer 2 — Mulch experience layer
    Layer 3 — Skills / instruction knowledge layer
    Layer 4 — Conversation compression layer
    Layer 5 — Session continuity (SESSION.md)
    Layer 6 — Context injection hooks
