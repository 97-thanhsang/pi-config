---
name: design-solution
description: Design technical architecture solutions using analyze, decompose, and blueprint reports with ADRs and Task N structure. Use when designing implementation blueprints for code execution.
compatibility: pi
---

# SKILL: design-solution (v6.1) — Solution Design Reference

**PURPOSE**: Provide reference patterns for the `/solution` command. Pattern decision framework, ADR template, Task N structure reference.

**Load**: `await skill({ name: "design-solution" })` — Step 0 of `/solution`

---

## 1. INPUT PRIORITY

| Priority | Source | What it provides |
|:--------:|--------|-----------------|
| 1st | decompose context.json | `slices[].implementationNotes`, `slices[].businessRules`, fePath, bePath |
| 2nd | extractor knowledge | `workflow/knowledge/shared/{domain}/{pattern}.md` — accumulated patterns |
| 3rd | gitnexus | execution flows, base classes, existing services |
| 4th | lsp / grep | codebase pattern verification |
| 5th | analyze report | affected files, data models, risks |
| 6th | web_search | external best practices (only if needed) |
---

## 2. PATTERN DECISION FRAMEWORK

| Condition | Action |
|-----------|--------|
| Base class found via gitnexus_context/lsp | Extend it |
| Service pattern from decompose implementationNotes | Copy + adapt |
| UI pattern from decompose slices[].ui match codebase | Follow existing |
| Permission pattern from grep | Use it |
| Web research finds better pattern | Propose + ADR |
| No pattern found | Confirm user before creating new |

**Deep modules:** đánh giá mỗi module mới theo *deep-module* vocabulary — interface = bề mặt test; deletion test (complexity biến mất → pass-through); 1 adapter = seam giả định, 2 adapter = seam thật.

---

## 3. ADR TEMPLATE

```markdown
| ADR | Decision | Rationale | Source |
|-----|----------|-----------|--------|
| ADR-001 | {pattern decision} | {why this pattern} | {codebase/external} |
```

---

## 4. TASK N STRUCTURE

For each decompose slice, create:

```markdown
### Task {N}: {name}
**Files:**
- [Create] path - {reason}
- [Modify] path - {change}

**Implementation:**
```typescript
// Code from existing patterns
```

**Verify:**
- [ ] Run: {command}
- [ ] Expected: {result}
```

---

## 5. VERIFICATION GATES

| Gate | Check |
|------|-------|
| Reuse ratio | > 50% — MUST find existing patterns first |
| File paths | MUST be specific, not generic |
| ADRs | MUST document why each pattern was chosen |
| User approval | MUST confirm before creating new patterns |
| No breaking changes | MUST NOT break existing logic |
