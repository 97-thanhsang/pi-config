---
description: Stage 6 — Verification and acceptance testing gate. Executes fresh test suites, reviews staged diffs, and validates AC.
argument-hint: "<KEY>"
---

# /verify — Verification & Quality Gate

Execute Stage 6 Verification for requirement: `${1:-$ARGUMENTS}`.

## Execution Steps

1. **Load Context & Staged Changes**:
   - Read Acceptance Criteria from `workflow/${1:-$ARGUMENTS}/slices/*.md` and `solution.md`.
   - Inspect staged modifications: `git diff --staged`.

2. **Dual-Review Inspection**:
   - Dispatch subagent `reviewer`:
     `subagent(agent="reviewer", task="Review staged changes for ${1:-$ARGUMENTS} against smell baseline and anti-suppression...")`
   - Verify code is clean, cohesive, well-named, and free of security risks or memory leaks.

3. **Fresh Verification & Evidence Gate**:
   - Dispatch subagent `verifier` or execute test commands freshly in session:
     - Run full test suite for modified modules.
     - Verify actual exit code is 0 and 0 failures.
   - If tests fail: Load skill `asc-systematic-debugging` to isolate root cause. Fix implementation, not tests.

4. **Line-by-Line AC Validation**:
   - Check every Acceptance Criterion against actual behavior.
   - Mark as `[PASS]` or `[FAIL]` with direct evidence.

5. **Generate Output Artifacts**:
   - Write: `workflow/${1:-$ARGUMENTS}/verify-report.md`:
     - Test run output & exit codes.
     - Dual-Review findings & resolution.
     - Line-by-line Acceptance Criteria verdict.
     - Final Gate Verdict: `PASS` or `FAIL`.
   - Update: `workflow/${1:-$ARGUMENTS}/summary.md` with Stage 6 status: VERIFIED.
   - Suggest proceeding to `/extractor` to close the pipeline loop.
