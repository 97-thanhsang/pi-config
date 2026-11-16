---
description: Stage 7 — Distill completed pipeline outputs into shared knowledge, update glossary/schema map, and sync to claude-mem.
argument-hint: "<KEY>"
---

# /extractor — Knowledge Builder & Memory Sync

Execute Stage 7 Knowledge Extraction for requirement: `${1:-$ARGUMENTS}`.

## Execution Steps

1. **Synthesize Pipeline Outputs**:
   - Verify that Stages 1–6 have completed (`workflow/${1:-$ARGUMENTS}/verify-report.md` shows PASS).
   - Read all reports: `blueprint-*.md`, `slices/*.md`, `analysis.md`, `solution.md`, `progress.md`, `verify-report.md`, and `git diff --staged`.
   - Load skill `extractor-to-knowledge`.

2. **Extract Project Knowledge**:
   - Ensure directory `workflow/knowledge/` exists.
   - **Business Terms**: If new business terms or domain vocabulary were introduced, update or create `workflow/knowledge/GLOSSARY.md`.
   - **Database Architecture**: If database tables, views, or stored procedures were added/modified, update `workflow/knowledge/DB_SCHEMA_MAP.md`.
   - **Shared Patterns**: If reusable patterns or solutions were formulated, write to `workflow/knowledge/shared/{domain}/{pattern}.md`.

3. **Sync to Long-Term Memory (`claude-mem`)**:
   - Extract key architectural takeaways, decisions, and endpoints.
   - Call MCP `claude-mem` (`save_memory`):
     - `title`: `[${1:-$ARGUMENTS}] Architecture & Decision Summary`
     - `text`: Key decisions, patterns applied, modified entities/SPs, lessons learned.
     - `project`: domain or project identifier.

4. **Generate Output Artifacts**:
   - Commit knowledge files if project tracks them.
   - Update: `workflow/${1:-$ARGUMENTS}/summary.md` with Stage 7 status: COMPLETE, Pipeline: FINISHED.
   - Report a concise closing summary of artifacts saved and memories synced.
