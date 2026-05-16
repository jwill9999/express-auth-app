# Layer 2 --- Mulch Experience Layer Specification

## Purpose

The **Mulch Experience Layer** stores engineering experience discovered
during development workflows.

It captures knowledge such as:

-   debugging discoveries
-   tooling pitfalls
-   architecture mistakes
-   workflow improvements

This prevents agents and engineers from **repeating solved problems**.\
Mulch becomes the system's **experience memory**.

------------------------------------------------------------------------

# Architecture Improvement --- Dual Mulch Stores

For multi‑service or multi‑repository environments, Mulch should support
two scopes.

## 1. Project Mulch

Stored inside the repository.

    repo/
      .mulch/
          mulch.jsonl

Stores:

-   service‑specific lessons
-   repository tooling issues
-   project architecture quirks

Example:

    Nx path mapping breaks when moving libraries unless path mappings are regenerated

------------------------------------------------------------------------

## 2. Global Mulch

Stored on the developer machine.

Example:

    ~/.mulch/
       mulch.jsonl

Stores:

-   general engineering lessons
-   platform quirks
-   tooling issues

Example:

    macOS TCC blocks writes to the .github directory from some tools

------------------------------------------------------------------------

# Query Order

Agents should search Mulch in the following order:

    project mulch
    ↓
    global mulch

This ensures **local knowledge takes priority**.

------------------------------------------------------------------------

# Storage Format

Mulch uses **JSONL (JSON Lines)** format.

Example file:

    .mulch/mulch.jsonl

JSONL format means:

    one JSON object per line

Example entry:

``` json
{
  "id": "lesson-docker-001",
  "topic": "docker",
  "summary": "Docker containers cannot access localhost of the host machine",
  "recommendation": "Use host.docker.internal or service names instead",
  "created": "2026-03-07"
}
```

------------------------------------------------------------------------

# Required Fields

  Field            Description
  ---------------- ----------------------------
  id               unique lesson identifier
  topic            category or tool name
  summary          description of the problem
  recommendation   recommended solution
  created          timestamp

Optional fields:

    task_id
    files
    tags
    service

------------------------------------------------------------------------

# Installation

Mulch can be installed globally via npm.

    npm install -g mulch-cli

Verify installation:

    mulch --version

------------------------------------------------------------------------

# Repository Initialisation

Inside a repository:

    mulch init

This creates:

    .mulch/
       mulch.jsonl

------------------------------------------------------------------------

# Mulch CLI Commands

## Add Lesson

    mulch add

Example:

    mulch add   --topic docker   --summary "Containers cannot access localhost"   --recommendation "Use service name instead"

Result:

    Appends entry to mulch.jsonl

------------------------------------------------------------------------

## Search Lessons

    mulch search <topic>

Example:

    mulch search docker

Returns relevant experience entries.

------------------------------------------------------------------------

## List Lessons

    mulch list

Displays stored knowledge entries.

------------------------------------------------------------------------

## Remove Lesson

    mulch remove <id>

Removes incorrect or outdated entries.

------------------------------------------------------------------------

# When Agents Should Use Mulch

## 1. Before Debugging

Agents should search Mulch first.

Example:

    mulch search docker

Purpose:

    avoid rediscovering solved problems

------------------------------------------------------------------------

## 2. After Solving a New Problem

Agents record the discovery.

    mulch add

------------------------------------------------------------------------

## 3. During Implementation

If tooling or environment errors occur:

    mulch search <tool>

Example:

    mulch search eslint

------------------------------------------------------------------------

## 4. During Architecture Work

When discovering patterns:

Example:

    middleware ordering affects authentication validation

Agents should record the lesson.

------------------------------------------------------------------------

# Integration with Other Layers

## Beads

Lessons may reference tasks.

Example:

    task_id: auth-104

------------------------------------------------------------------------

## SESSION.md

Important discoveries may be summarised in session continuity.

------------------------------------------------------------------------

## Skills / Instructions

If a lesson becomes broadly useful it may evolve into:

    updated instruction files
    updated reusable skills

------------------------------------------------------------------------

# Context Injection

Mulch should **not inject the entire lesson database**.

Instead agents should search dynamically:

    mulch search <topic>

Only relevant lessons are injected into the context.

------------------------------------------------------------------------

# Example Workflow

    agent debugging docker issue
    ↓
    mulch search docker
    ↓
    lesson found
    ↓
    apply recommendation

If the solution was newly discovered:

    mulch add

------------------------------------------------------------------------

# Architecture Position

Mulch sits after execution as **experience memory**.

    skills / instructions
            ↓
    SESSION.md
            ↓
    SUMMARY.md
            ↓
    Beads Task
            ↓
    Implementation
            ↓
    Mulch Lessons

Mulch captures **experience from execution**.

------------------------------------------------------------------------

# Summary

Mulch provides:

    experience memory

Benefits:

-   faster debugging
-   reusable engineering insights
-   cross‑session learning
-   knowledge accumulation across services
