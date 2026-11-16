---
description: Master End-to-End Orchestrator running the complete 7-stage pipeline sequentially with human gate before execution.
argument-hint: "<KEY>"
---

# Master Pipeline Orchestrator — End-to-End Workflow

You are orchestrating the complete 7-stage engineering pipeline for requirement: `${1:-$ARGUMENTS}`.

## Execution Sequence

Follow these 7 stages in strict sequence, ensuring all output artifacts are generated under `workflow/${1:-$ARGUMENTS}/`:

### Stage 1: Blueprint
1. Extract requirement context from Jira (via MCP `jira-server`) or project issue tracker.
2. Initialize `workflow/${1:-$ARGUMENTS}/context.json` with project paths (`fePath`, `bePath`, `dbName`).
3. Dispatch subagent `scout` to survey codebase touchpoints.
4. If database changes are needed, extract schema and generate `workflow/${1:-$ARGUMENTS}/diagrams/database-erd.html` using skill `architecture-diagram-generator`.
5. Write 11-section design reports using skill `blueprint-writer`:
   - `workflow/${1:-$ARGUMENTS}/blueprint-be.md`
   - `workflow/${1:-$ARGUMENTS}/blueprint-fe.md`
   - `workflow/${1:-$ARGUMENTS}/summary.md` (Stage 1: Complete)

### Stage 2: Decompose
1. Load skill `jira-decompose`.
2. Break down requirement into vertical-slice sub-tasks (UI + Service + Database).
3. Write slice definitions to `workflow/${1:-$ARGUMENTS}/slices/*-description.md` with Given-When-Then Acceptance Criteria and complexity points.
4. Update `workflow/${1:-$ARGUMENTS}/context.json` with slice metadata.
5. Update `workflow/${1:-$ARGUMENTS}/summary.md` (Stage 2: Complete).

### Stage 3: Analyze
1. Use MCP `gitnexus` (`impact()`, `context()`) and LSP to analyze blast radius for all touched symbols.
2. Check upstream callers and downstream dependencies.
3. Write `workflow/${1:-$ARGUMENTS}/analysis.md` assessing risk level (CRITICAL / HIGH / MEDIUM / LOW) and list of files requiring modification.
4. Update `workflow/${1:-$ARGUMENTS}/summary.md` (Stage 3: Complete).

### Stage 4: Solution
1. Load skill `design-solution`.
2. Formulate Architectural Decision Records (ADRs) following the Solution Ladder (KISS/YAGNI).
3. Break down implementation into sequential, testable `Task 1` through `Task N`.
4. Write `workflow/${1:-$ARGUMENTS}/solution.md`.
5. Update `workflow/${1:-$ARGUMENTS}/summary.md` (Stage 4: Complete).

---
### 🛑 HUMAN APPROVAL GATE
**STOP HERE**: Present the solution summary and Task breakdown to the user. Ask for user approval before modifying any code.
Once user confirms, proceed to Stage 5.
---

### Stage 5: Execute
1. Implement each task in `solution.md` using TDD (Red-Green-Refactor).
2. Dispatch subagent `worker` for heavy tasks or execute surgical changes directly.
3. Enforce 4 QA Gates: Linter, Type-check, Unit tests, Build (respect project runtime flags).
4. Enforce Anti-suppression guard: No `@ts-ignore`, no empty catch, no disabled tests.
5. Stage modified files with `git add <files>`. Do NOT commit.
6. Write execution log to `workflow/${1:-$ARGUMENTS}/progress.md`.
7. Update `workflow/${1:-$ARGUMENTS}/summary.md` (Stage 5: Complete).

### Stage 6: Verify & QC (Acceptance Testing)
1. Run acceptance verification using `/qc ${1:-$ARGUMENTS}` or `/verify ${1:-$ARGUMENTS}`:
   - Execute full test suite and verify every AC line-by-line via subagent `verifier`.
   - Dispatch subagent `reviewer` to inspect `git diff --staged` for code quality, smells, and safety.
   - For UI/full-stack features, execute headed browser acceptance testing: 3-way Triangulation (UI $\equiv$ API $\equiv$ Database) using skill `qc-acceptance-tester`.
   - If tests fail, investigate root cause using skill `asc-systematic-debugging`.
2. Ensure output artifacts are generated:
   - `workflow/${1:-$ARGUMENTS}/verify-report.md` (or `qc-report.md`)
   - `workflow/${1:-$ARGUMENTS}/evidence/` (annotated screenshots and reconciliation data)
3. Update `workflow/${1:-$ARGUMENTS}/summary.md` (Stage 6: Complete, Status: VERIFIED / QC_PASS).

### Stage 7: Extractor
1. Load skill `extractor-to-knowledge`.
2. Extract newly identified business rules into `workflow/knowledge/GLOSSARY.md`.
3. If database schema was modified, update `workflow/knowledge/DB_SCHEMA_MAP.md`.
4. Save reusable architectural patterns to `workflow/knowledge/shared/{domain}/{pattern}.md`.
5. Sync key decisions to persistent memory via MCP `claude-mem` (`save_memory`).
6. Update `workflow/${1:-$ARGUMENTS}/summary.md` (Stage 7: Complete, Pipeline: FINISHED).
