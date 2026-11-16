---
description: Stage 5 — Implementation engine. Executes Task 1..N checklist with 4 QA Gates and strict git staging.
argument-hint: "<KEY>"
---

# /execute — Implementation Engine

Execute Stage 5 Implementation for requirement: `${1:-$ARGUMENTS}`.

## Execution Steps

1. **Verify Prerequisites**:
   - Locate and read `workflow/${1:-$ARGUMENTS}/solution.md`.
   - If missing, stop and instruct user to run `/solution` first.

2. **Iterative Task Implementation**:
   - Initialize/Clear: `workflow/${1:-$ARGUMENTS}/progress.md`.
   - Loop through each `Task N` in `solution.md`:
     - Apply surgical changes to target files using `edit` or `write`.
     - Dispatch subagent `worker` for heavy tasks if appropriate:
       `subagent(agent="worker", task="Implement Task N for ${1:-$ARGUMENTS}...")`
     - Apply TDD: Red (failing test) $\rightarrow$ Green (minimal working code) $\rightarrow$ Refactor.

3. **Enforce 4 Quality Gates**:
   - For every modified module, run project verification:
     - **Gate 1 - Lint**: Run project linter on modified files.
     - **Gate 2 - Type Check**: Verify compiler/type diagnostics clean.
     - **Gate 3 - Tests**: Run unit and integration tests.
     - **Gate 4 - Build**: Verify clean compilation/build (respect project-specific flags).
   - If any gate fails: Fix code immediately. Never weaken or suppress checks.

4. **Iron Anti-Suppression Guard**:
   - Zero tolerance for `@ts-ignore`, `eslint-disable`, empty `catch (e) {}` blocks, or `.skip` test bypasses.

5. **Git Staging**:
   - Stage modified files: `git add <files>`.
   - **DO NOT commit or push**.

6. **Generate Output Artifacts**:
   - Update: `workflow/${1:-$ARGUMENTS}/progress.md` logging completion status and QA gate evidence for each Task.
   - Update: `workflow/${1:-$ARGUMENTS}/summary.md` with Stage 5 status: COMPLETE.
   - Suggest proceeding to `/verify`.
