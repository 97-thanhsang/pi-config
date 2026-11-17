---
description: Stage 0 — Intake a Jira ticket, freeze context.json, scaffold project .pi/mcp.json, and recommend Git branch name.
argument-hint: "<KEY>"
---

# /intake — Ticket Intake & Context Bootstrap

Execute Stage 0 Intake for requirement: `${1:-$ARGUMENTS}`.

## Execution Steps

1. **Intake Requirement Context**:
   - Determine `KEY` from argument `${1:-$ARGUMENTS}`.
   - If not provided, fetch recent issues assigned to current user via MCP `jira-server` (`jira_get_my_issues`) and prompt user.
   - Fetch ticket details via MCP `jira-server` (`jira_get_issue(issueKey=KEY)`): Summary, Description, Acceptance Criteria, Attachments.

2. **Initialize Workspace Context**:
   - Ensure directory `workflow/${1:-$ARGUMENTS}/` exists.
   - Check if `workflow/${1:-$ARGUMENTS}/context.json` exists. If not, determine or ask user for:
     - `fePath`: Frontend project directory (e.g., `D:/SROUCE/EMS/ems.cdr.fe`).
     - `bePath`: Backend project directory (e.g., `D:/SROUCE/EMS/ems.cdr.be`).
     - `dbName`: Database name associated with the ticket (e.g., `EDU_HPMU`, `WEB_HIU_STUDENTCARE`).
   - Write/Update `workflow/${1:-$ARGUMENTS}/context.json` containing: `key`, `summary`, `fePath`, `bePath`, `dbName`, `createdAt`.

3. **Scaffold Project-Local Database MCP Configuration**:
   - For `fePath` and `bePath`, check if `.pi/mcp.json` exists.
   - If not, scaffold project-local database connection:
     - Create directory `<project>/.pi/`
     - Create `<project>/.pi/mcp.json` with the configured SQL Server DSN for the selected `dbName`.
     - Ensure `.pi/` is present in `<project>/.gitignore` to protect credentials.

4. **Recommend Standard Git Branch Name**:
   - Call MCP `jira-server` (`jira_create_branch_name(issueKey=KEY)`) to generate conventional branch name: `feature/${1:-$ARGUMENTS}-{slug}`.
   - Output recommended checkout commands for both frontend and backend repos:
     ```bash
     git checkout -b feature/${1:-$ARGUMENTS}-{slug}
     ```

5. **Initialize Project Summary Dashboard**:
   - Create or reset `workflow/${1:-$ARGUMENTS}/summary.md`:
     - Ticket metadata (Key, Summary, Assignee, Database, Repositories).
     - Execution Stage Checklist (Stage 0 Intake: COMPLETE, Stage 1 Blueprint: PENDING, ...).

6. **Hand-Off**:
   - Output a clear summary of initialized context.
   - Suggest next step: Run `/blueprint ${1:-$ARGUMENTS}` to begin technical design and ERD diagram generation.
