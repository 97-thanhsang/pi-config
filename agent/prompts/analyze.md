---
description: Stage 3 — Deep system-wide impact and blast radius analysis using GitNexus and LSP call graphs.
argument-hint: "<KEY>"
---

# /analyze — System-Wide Blast Radius Analysis

Execute Stage 3 Analyze for requirement: `${1:-$ARGUMENTS}`.

## Execution Steps

1. **Load Context**:
   - Read `workflow/${1:-$ARGUMENTS}/context.json` and slice definitions.
   - Extract all target symbols, classes, interfaces, and database objects to be touched.

2. **Call-Graph & Blast Radius Analysis**:
   - Use MCP `gitnexus`:
     - Run `gitnexus_context(name=symbol)` for each touched symbol.
     - Run `gitnexus_impact(target=symbol, direction="upstream")` to find all callers and dependent modules.
   - Use LSP / AST tools to inspect compile-time references and type safety across modules.
   - Assess risk level: `CRITICAL` (public API / shared base class), `HIGH` (cross-module consumer), `MEDIUM` (local service), or `LOW` (leaf component).

3. **Generate Output Artifacts**:
   - Write comprehensive report to: `workflow/${1:-$ARGUMENTS}/analysis.md`:
     - Executive summary & overall risk score.
     - Upstream and downstream impact table.
     - Affected file inventory (files that MUST be edited concurrently).
     - Recommended mitigation patterns (e.g., Expand-Contract pattern for shared contracts).
   - Update `workflow/${1:-$ARGUMENTS}/summary.md` with Stage 3 status: COMPLETE.
   - Suggest proceeding to `/solution`.
