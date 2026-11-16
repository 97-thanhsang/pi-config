---
name: jira-decompose
description: Decompose large Jira parent tasks into vertical-slice sub-tasks with enriched metadata, complexity estimation, and visual routing. Use when breaking down epics or stories into implementable slices.
license: MIT
compatibility: pi
metadata:
  audience: opencode-agents
version: 5.0.0
---

# SKILL: jira-decompose (v5.0.0)

**PURPOSE**: Break a large Jira task into independently-implementable sub-tasks using vertical slice methodology. Each sub-task gets a 10-section enriched description with image references, complexity estimates, and per-slice .md reports.

Runs directly in OMP session or via subagent `task`. All logic inline with Jira MCP tools.
---

## 0. Skill Metadata

- **ID**: `workflow/jira-decompose`
- **Version**: 5.0.0
- **MCP Tools Required**: `jira_parse_url`, `jira_get_issue`, `jira_search_issues`, `jira_create_issue`, `jira_add_comment`, `jira_add_attachment`, `jira_save_attachment`
- **Trigger**: `/decompose [KEY]`
- **Assignee**: Hardcoded `SangNT` (command-level default)
- **Language**: English

---

## 1. Output Contract

Final machine-parseable line:
```
[DECOMPOSE_DONE] | Parent: {KEY} | SubTasks: {N} | Keys: {K1,K2,...} | DryRun: {true|false}
```

---

## 2. Hard Constraints

1. Do NOT create sub-tasks until user approval.
2. Each slice MUST be a vertical cut (data + service + UI), never split by layer — EXCEPT wide refactors, which follow expand–contract (see 6.5).
3. `issueType` is ALWAYS `"Sub-task"`. NEVER conflate with `subTaskType`.
4. Do NOT emit `[DRAFT_SLICES_JSON]` markers — removed.
5. Do NOT write `draft.json` — only `context.json` at the end.
6. Assignee always `SangNT`, priority always `Medium` — no questions.
7. All output in **English only**.
8. Image download uses `jira_save_attachment` ONLY — never `jira_get_attachment_content` (avoids base64 truncation).
9. Per-slice .md files go to `workflow/{KEY}/slices/`, and downloaded assets go to `workflow/{KEY}/assets/`.
10. Each slice must have `section` and `matchedSliceIndex` for image routing.

---

## 3. Architecture

All logic runs inline in a single DECOMPOSE agent session:

```
Step 0: Parse input + load context.json + load skill
Step 1: Resolve context + FE/BE paths + idempotency
Step 2: Memory recall
Step 3: Codebase discovery (gitnexus/glob/grep)
Step 4: Create working directory + early context.json
Step 5: Analyze BA + extract specs
Step 6: Draft slices → edit loop → user approval via native tool `ask` (APPROVE/EDIT/CANCEL)
Step 7: Download images + create sub-tasks + per-slice .md + context.json
Step 8: Handoff → [DECOMPOSE_DONE]
```

---

## 4. Pipeline Position

```
/blueprint → /decompose  (THIS)
                → /extractor → /analyze → /solution → /execute
```

---

## 5. File Map

### 5.1 Command (single source of execution)

| File | Purpose |
|------|---------|
| `commands/decompose/decompose.md` | All logic inline — 8 steps, 0 process files |

### 5.2 Config & Schemas

| File | Purpose |
|------|---------|
| `config.md` | All hardcoded values (thresholds, complexity weights, paths) |
| `schemas/draft-slices.schema.md` | JSON contract for slice data structure |
| `templates/enriched-description-v6.md` | **10-section Jira wiki template (current)** |

### 5.3 References

| File | Purpose |
|------|---------|
| `references/subtask-type-mapping.md` | customfield_10214 values + keyword mapping |
| `references/privacy-patterns.md` | Sensitive-data regex patterns |
| `references/visual-synonyms.md` | UI term synonym map |

---

## 6. Key Algorithms (inline reference)

### 6.1 Complexity Estimation

| Complexity | Story Points | Criteria |
|------------|-------------|----------|
| TRIVIAL | 1 | Single field change, config update, text fix |
| SIMPLE | 3 | Standard CRUD, reuses existing patterns |
| MEDIUM | 5 | Multiple components, moderate business logic |
| COMPLEX | 8 | New architecture, many integrations |
| EPIC | 13 | Exceeds 1 sprint — flag for splitting |

**Scoring formula**: `fieldCount*2 + apiCount*3 + integration*5 + validation*2 + hitl*3`
**Thresholds**: <=5 → TRIVIAL, 6-12 → SIMPLE, 13-25 → MEDIUM, >25 → COMPLEX/EPIC

### 6.2 Image Section Routing

Images are placed in the correct template section based on `img.section`:
- `6` → Section 6 (UI) — UI mockups, Figma screenshots
- `10` → Section 10 (Test Scenarios) — expected outputs, Excel samples

Agent sets `img.section` from BA context during drafting. Fallback: section 6.

### 6.3 Image Download Flow

```
jira_save_attachment({ url, outputPath })
  → MCP server downloads + writes to disk directly
  → Returns { saved, path, size } — tiny response, never truncated
  → Then jira_add_attachment uploads to sub-task
  → Image refs:
      - Local Markdown preview (ngoài khối wiki): `**Local Preview**: [Xem ảnh](../assets/{filename})`
      - Jira markup (trong khối wiki): `!{filename}!`
```

### 6.4 Edit Loop

Step 6 uses native tool `ask`:
```javascript
ask(questions=[{
  id: "approval",
  question: `Phê duyệt danh sách ${slices.length} Sub-tasks cho ${KEY}?`,
  options: [
    { label: "APPROVE", description: "Tạo chính thức sub-tasks trên Jira và lưu báo cáo" },
    { label: "EDIT", description: "Mô tả điều chỉnh lát cắt cần thay đổi" },
    { label: "CANCEL", description: "Hủy bỏ thao tác" }
  ],
  recommended: 0
}])
```

### 6.5 Wide Refactor — Expand–Contract (ngoại lệ của vertical slicing)

Vertical slicing là mặc định. **Ngoại lệ: refactor trải rộng** (rename/retype/đổi signature lan ra toàn codebase) — khi đó KHÔNG vertical-slice; sequence thành **expand–contract**:
1. **Expand:** thêm dạng mới BÊN CẠNH dạng cũ, không vỡ gì.
2. **Migrate:** chuyển dần caller sang dạng mới (theo batch/nhóm).
3. **Contract:** xoá dạng cũ khi không còn caller.

Mỗi bước là một sub-task riêng, có blocking edge rõ.

### 6.6 Agent Brief — Durability over Precision

Sub-task description phải bền: mô tả **interface/type/hành vi** (ổn định), KHÔNG phụ thuộc **file path/line number** (trôi). Nêu **blocking edges** (sub-task nào phải xong trước). Brief tốt implement được ngay cả khi cấu trúc file đã đổi.
