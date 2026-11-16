---
description: Stage 2 — Decompose requirement into vertical-slice sub-tasks with Given-When-Then Acceptance Criteria.
argument-hint: "<KEY>"
---

# /decompose — Task & Slice Decomposition

Execute Stage 2 Decompose for requirement: `${1:-$ARGUMENTS}`.

## Execution Steps

1. **Load Context**:
   - Read `workflow/${1:-$ARGUMENTS}/context.json` and blueprint reports (`workflow/${1:-$ARGUMENTS}/blueprint-*.md`).
   - If missing, ask user for required paths.

2. **Vertical-Slice Analysis**:
   - Load skill `jira-decompose`.
   - Break down requirement into independent vertical slices (each slicing UI $\rightarrow$ API $\rightarrow$ Database).
   - Estimate complexity points (Trivial=1, Simple=3, Medium=5, Complex=8).
   - Draft Acceptance Criteria (AC) in formal Given-When-Then format.

3. **Generate Output Artifacts**:
   - Create `workflow/${1:-$ARGUMENTS}/slices/` directory.
   - For each slice, write `workflow/${1:-$ARGUMENTS}/slices/{XX}_{slice-name}.md` containing:
     - Slice objective & scope.
     - Touched layers (UI component, service, backend controller, query/SP).
     - Testable AC checklist (Given-When-Then).
   - Update `workflow/${1:-$ARGUMENTS}/context.json` with `slices` array.
   - Update `workflow/${1:-$ARGUMENTS}/summary.md` with Stage 2 status: COMPLETE.
   - Display slice summary to user and suggest proceeding to `/analyze`.
