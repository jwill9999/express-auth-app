# Skills & Instruction Knowledge Layer

*(Lightweight Architectural Guidance for Planning Agents)*

## Purpose

This document provides **lightweight architectural guidance** for AI
planning agents working within this repository.

It intentionally avoids strict procedural rules. Instead, it describes
the **concepts and architectural layers** that the planning agent should
consider when designing or evolving the system.

Planning agents should treat this document as **discussion prompts**,
not rigid instructions.

------------------------------------------------------------------------

# Architectural Context

The system is composed of several cooperating layers designed to support
**agentic software development workflows**.

These layers separate concerns between:

-   execution
-   experience
-   knowledge
-   session continuity
-   conversation management
-   orchestration

Current architecture layers:

    Layer 1 — Beads execution layer
    Layer 2 — Mulch experience layer
    Layer 3 — Skills / instruction knowledge layer
    Layer 4 — Conversation compression layer
    Layer 5 — Session continuity (SESSION.md)
    Layer 6 — Context injection hooks

Planning agents should ensure new designs respect these boundaries.

------------------------------------------------------------------------

# Layer Overview

## Beads --- Execution Layer

Beads manages the **task graph**.

Planning agents should consider:

-   epics
-   tasks
-   sub-tasks
-   dependencies
-   specification linkage

Key questions:

-   What work needs to be executed?
-   What is the correct order?
-   What dependencies exist?

------------------------------------------------------------------------

## Mulch --- Experience Layer

Mulch stores **lessons learned during development**.

Planning agents should consider:

-   recurring problems
-   debugging insights
-   tooling discoveries
-   architecture pitfalls

Important idea:

    Mulch captures discoveries.
    Skills convert discoveries into reusable rules.

------------------------------------------------------------------------

## Skills / Instruction Knowledge Layer

This layer contains **reusable engineering knowledge**.

Examples:

-   planning workflows
-   implementation workflows
-   documentation patterns
-   development conventions

Planning agents should evaluate whether new behaviours belong here.

Questions to consider:

-   Is this knowledge reusable?
-   Should this become a skill?
-   Should the instruction layer evolve?

------------------------------------------------------------------------

## Session Continuity --- SESSION.md

SESSION.md stores **working state between sessions**.

Typical contents:

-   current objective
-   active task
-   progress
-   decisions made
-   next steps

Planning agents should consider whether major decisions should be
reflected in the session summary.

------------------------------------------------------------------------

## Conversation Compression

Long conversations should not expand the context window indefinitely.

Older conversation segments should be summarised so that agents work
with:

    compressed conversation summary
    +
    recent discussion

This mechanism is **runtime only** and does not create repository
artifacts.

------------------------------------------------------------------------

## Context Injection Hooks

Hooks orchestrate how context enters the agent.

Possible events include:

    session start
    task start
    session end
    conversation threshold

Planning agents may propose improvements to how context is injected.

------------------------------------------------------------------------

# Planning Considerations

When planning new work, agents should consider:

### Execution

Does this require new Beads tasks?

### Knowledge

Should a new skill be created?

### Experience

Does Mulch contain lessons related to this work?

### Session continuity

Should SESSION.md capture this decision?

### Context management

Will this increase conversation complexity?

------------------------------------------------------------------------

# Evolving the System

This document is intentionally **open-ended**.

Planning agents are encouraged to propose:

-   improvements to architectural layers
-   new reusable skills
-   new workflow integrations
-   refinements to memory systems

The goal is **continuous evolution of the agent architecture**.

------------------------------------------------------------------------

# Guiding Principle

The system should gradually evolve toward:

    structured execution
    persistent experience
    reusable knowledge
    stable session continuity
    efficient context management

Planning agents should prioritise solutions that improve **autonomy,
clarity, and maintainability**.
