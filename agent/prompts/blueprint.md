---
description: Stage 1 — Intake requirement, survey codebase, query database schema, generate ERD diagram and 11-section blueprint reports.
argument-hint: "<KEY>"
---

# /blueprint — Technical Blueprint Designer

Execute Stage 1 Blueprint for requirement: `${1:-$ARGUMENTS}`.

## Execution Steps

1. **Intake & Context Initialization**:
   - Determine `KEY` from argument `${1:-$ARGUMENTS}`.
   - Fetch ticket details via MCP `jira-server` (`jira_get_issue(issueKey=KEY)`).
   - Create directory `workflow/${1:-$ARGUMENTS}/` if it does not exist.
   - Initialize `workflow/${1:-$ARGUMENTS}/context.json` with keys: `key`, `fePath`, `bePath`, `dbName`.

2. **Database Discovery & Visual ERD**:
   - If database interaction is involved and MCP `sqlserver` is configured:
     - Query table/view schemas and stored procedures via SQL queries.
     - Load skill `architecture-diagram-generator`.
     - Generate interactive diagram at `workflow/${1:-$ARGUMENTS}/diagrams/database-erd.html` (Dark Slate `#020617`).

3. **Codebase Reconnaissance**:
   - Dispatch subagent `scout` (read-only) to locate relevant components, controllers, services, and models.
   - Record relative file paths with line ranges.

4. **Generate Output Artifacts**:
   - Load skill `blueprint-writer`.
   - Write 11-section Backend design to: `workflow/${1:-$ARGUMENTS}/blueprint-be.md`.
   - Write 11-section Frontend design to: `workflow/${1:-$ARGUMENTS}/blueprint-fe.md`.
   - Initialize/Update: `workflow/${1:-$ARGUMENTS}/summary.md` with Stage 1 status: COMPLETE.
   - Present summary of findings and prompt user to proceed to `/decompose`.
