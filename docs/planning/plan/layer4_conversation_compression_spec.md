# Layer 4 --- Conversation Compression Layer Specification

## Purpose

The **Conversation Compression Layer** prevents context window bloat
during a long-running AI conversation.

Instead of passing the full accumulated conversation history to the
model, the system replaces older conversation segments with structured
summaries while keeping the most recent messages intact.

The prompt context sent to the model becomes:

    compression summaries
    +
    recent conversation turns

This preserves reasoning continuity while dramatically reducing token
usage.

------------------------------------------------------------------------

# Key Design Principle

The Conversation Compression Layer is **ephemeral**.

It does **not write files to the repository**.

Unlike other architecture layers:

  Layer                      Persistence
  -------------------------- -------------
  Beads execution layer      persistent
  Mulch experience layer     persistent
  SESSION.md                 persistent
  Skills / instructions      persistent
  Conversation compression   ephemeral

The compression summaries exist **only inside the running agent
session**.

------------------------------------------------------------------------

# Trigger Conditions

Compression should trigger when conversation length exceeds a threshold.

Recommended threshold:

    30–40 messages

When the threshold is reached:

    summarise older conversation segments
    replace earlier messages
    retain most recent messages

------------------------------------------------------------------------

# Segmented Compression Strategy

Rather than compressing the entire conversation at once, the system
groups messages into **logical segments** based on topic or reasoning
phase.

Example conversation segments:

    Segment 1 — Architecture overview
    Segment 2 — Beads execution layer
    Segment 3 — Session continuity layer
    Segment 4 — Conversation compression discussion

When compression runs:

    summarise older segments
    keep the most recent segment intact

Final prompt context becomes:

    segment summaries
    +
    recent messages from active segment

------------------------------------------------------------------------

# Segment Summary Structure

Each compressed segment should follow a consistent structure.

Example format:

    Segment Summary

    Topic
    High-level subject of the discussion.

    Key Decisions
    Important architectural or technical decisions.

    Constraints
    Technical or environmental limitations.

    Outcome
    Result of the discussion or conclusion reached.

Recommended length per segment:

    100–200 words

------------------------------------------------------------------------

# Compression Algorithm

1.  Monitor conversation message count.

2.  If conversation length is below threshold:

```{=html}
<!-- -->
```
    send full conversation history

3.  If threshold is exceeded:

```{=html}
<!-- -->
```
    identify logical conversation segments
    summarise older segments
    retain most recent messages

4.  Replace earlier conversation turns with the segment summaries.

------------------------------------------------------------------------

# Resulting Prompt Context

Instead of sending:

    entire conversation history

The context builder injects:

    skills / instructions
    SESSION.md
    segment summaries
    recent conversation messages
    beads task context
    specification

------------------------------------------------------------------------

# Token Efficiency

Without compression:

    100 messages
    ≈ 20k–40k tokens

With compression:

    segment summaries ≈ 300–800 tokens
    recent messages ≈ 500–1000 tokens

Expected reduction:

    >90% token savings

------------------------------------------------------------------------

# Relationship to Other Layers

The Conversation Compression Layer operates between **session
continuity** and **execution context**.

Architecture position:

    Skills / Instructions
            ↓
    Session Continuity (SESSION.md)
            ↓
    Conversation Compression (ephemeral)
            ↓
    Recent Conversation Turns
            ↓
    Beads Task Context
            ↓
    Specification
            ↓
    Implementation

------------------------------------------------------------------------

# When Compression Should Run

Compression should occur during the following events:

### Conversation Length Threshold

    conversation > 30 messages

### Topic Shift

Example:

    architecture design → implementation debugging

### Before Prompt Construction

Compression should always run before assembling the final prompt for the
LLM.

------------------------------------------------------------------------

# Implementation Location

This logic belongs inside the **Context Builder** of the agent runtime.

Example runtime flow:

    conversation history
            ↓
    context builder
            ↓
    compression logic
            ↓
    final prompt assembly
            ↓
    LLM request

------------------------------------------------------------------------

# Context Builder Responsibilities

The context builder performs the following steps:

1.  Load skills / instruction files.
2.  Load SESSION.md.
3.  Evaluate conversation length.
4.  Run compression if threshold exceeded.
5.  Attach recent conversation turns.
6.  Load Beads task context.
7.  Load specification file.
8.  Construct final prompt.

------------------------------------------------------------------------

# Benefits

### Context Efficiency

Prevents runaway token usage in long conversations.

### Reasoning Stability

Preserves key architectural decisions and discussion outcomes.

### Tool Independence

Works with:

    VSCode agents
    CLI agents
    ChatGPT
    Claude
    custom LLM runtimes

------------------------------------------------------------------------

# Summary

The Conversation Compression Layer ensures long conversations remain
manageable by replacing older discussion segments with structured
summaries.

Key characteristics:

    ephemeral
    runtime-only
    segmented summaries
    token-efficient
    framework-independent

This layer complements:

    SESSION.md for cross-session continuity
    Mulch for lessons learned
    Beads for execution workflow
    Skills for reusable knowledge
