---
description: Stage 4 — Design technical solution with Architectural Decision Records (ADRs) and Task 1..N breakdown.
argument-hint: "<KEY>"
---

# /solution — Technical Solution Designer

Execute Stage 4 Solution for requirement: `${1:-$ARGUMENTS}`.

## Execution Steps

1. **Synthesize Inputs**:
   - Read `workflow/${1:-$ARGUMENTS}/blueprint-*.md`, `slices/*.md`, and `analysis.md`.
   - Load skill `design-solution`.

2. **Formulate Architectural Decisions**:
   - Apply the **Solution Ladder** (KISS/YAGNI):
     - Can existing helpers/services be reused?
     - Can platform/stdlib features solve it?
     - Avoid premature abstractions for single-use code.
   - For every non-trivial design choice, write a structured ADR:
     - Context & Problem.
     - Decision & Solution Ladder rung chosen.
     - Consequences & Trade-offs.

3. **Break Down into Sequential Task N**:
   - Divide implementation into discrete, verifiable units: `Task 1` through `Task N`.
   - Each Task MUST specify:
     - Target file paths.
     - Concrete change description.
     - Verification criteria (test command or assertion).

4. **Generate Output Artifacts**:
   - Write: `workflow/${1:-$ARGUMENTS}/solution.md`.
   - Update: `workflow/${1:-$ARGUMENTS}/summary.md` with Stage 4 status: COMPLETE.
   - **Present Task breakdown to user and ask for explicit confirmation before `/execute`**.
