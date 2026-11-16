---
name: jira-decompose-v4-config
description: Environment & business constants for jira-decompose-v4 skill. Single source of truth for all hardcoded values (Jira URL, assignee, project custom fields, thresholds, complexity weights).
type: reference
version: 5.0.0
---

# Config — jira-decompose (v5.0.0)

All hardcoded values used by the decompose workflow live here. When any of these change, update this file ONLY — every process/template reads from here.

---

## 1. Jira Connection

| Key                        | Value                                                         | Used by                      |
| -------------------------- | ------------------------------------------------------------- | ---------------------------- |
| `jira.baseUrl`             | `{env:JIRA_URL}` (fallback: `https://task.ascvn.com.vn`)     | Parent-story link in desc    |
| `jira.browsePath`          | `/browse/{KEY}`                                               | Template link construction   |
| `jira.mcpServer`           | `jira-server`                                                 | MCP tool prefix              |

**Full link pattern**: `{jira.baseUrl}{jira.browsePath}` -> `{env:JIRA_URL}/browse/EMSPRO2-800`

**Runtime resolution**: Read `JIRA_URL` from MCP environment config. If not set, fall back to `https://task.ascvn.com.vn`. This ensures the skill works across different Jira instances without file edits.

---

## 2. Issue Creation Defaults

| Key                        | Value        | Rationale                                          |
| -------------------------- | ------------ | -------------------------------------------------- |
| `defaultAssignee`          | *(not set)*  | Set to your Jira username to always assign to yourself. If empty, inherits from parent assignee. If parent also has no assignee, Jira uses project default. |
| `create.issueType`         | `Sub-task`   | **ALWAYS**. Never use `suggestedSubTaskType` here  |
| `create.defaultSubTaskType`| `Developing` | Fallback when slice type undeterminable            |
| `create.inheritPriority`   | `true`       | Copy priority from parent task                     |
| `create.dependencyOrder`   | `true`       | Create no-dependency slices first                  |

**Assignee resolution order** (v3.2 — no hardcoding):
1. `defaultAssignee` in this config (if set)
2. `draft.parentAssignee` from Jira parent task (if parent has one)
3. Omit -> Jira project default applies

**To configure**: Set `defaultAssignee: your-jira-username` below:

```yaml
defaultAssignee:
```

*(Leave blank to use parent assignee / project default)*

**CRITICAL DISTINCTION**:
- `issueType` = Jira system field (always `"Sub-task"`)
- `subTaskType` = customfield_10214 value (work classification: `Developing`, `Fixing bug`, ...)

Violating this -> HTTP 400 "issuetype: issue type is required".

---

## 3. Sub-Task Type Mapping (customfield_10214)

Mandatory for project `EMSPRO2`. Omission causes HTTP 400.

| Slice content                          | `subTaskType` value            |
| -------------------------------------- | ------------------------------ |
| Building UI screens, components, forms | `Developing`                   |
| Fixing a bug or regression             | `Fixing bug`                   |
| Architecture decision, HITL slice      | `Investigate`                  |
| Excel import / data processing         | `Data Processing`              |
| Writing test cases                     | `Test case: Create / Review`   |
| Reviewing code, PR review              | `Review Code`                  |
| Writing BA / spec documents            | `Create Document`              |
| *(fallback)*                           | `Developing`                   |

---

## 4. Project-Specific Requirements

| Project Key | Requires `subTaskType`? | Notes                                  |
| ----------- | ----------------------- | -------------------------------------- |
| `EMSPRO2`   | Yes (customfield_10214) | Fails with 400 if omitted              |
| *(other)*   | Optional                | Safe to include anyway                 |

---

## 5. Attachment Handling

| Key                            | Value                                        |
| ------------------------------ | -------------------------------------------- |
| `attachments.imageExtensions`  | `.png, .jpg, .jpeg, .gif, .webp`             |
| `attachments.docExtensions`    | `.pdf, .docx, .doc, .xlsx, .txt, .md`        |
| `attachments.maxSizeBytes`     | `10485760` (10 MB per file)                  |
| `attachments.maxSizeMB`        | `10` (human-readable alias — same limit)     |
| `attachments.maxDocSizeBytes`  | `5242880` (5 MB) — skip docs larger in subagent |
| `attachments.maxDocSizeMB`     | `5` (human-readable alias — same limit)      |
| `attachments.maxTotalDocBytes` | `15728640` (15 MB) — warn if total exceeds   |
| `attachments.readConsent`      | `ask` — prompt user before fetching content  |

---

## 6. Visual Asset Pipeline

| Key                                    | Value                                           |
| -------------------------------------- | ----------------------------------------------- |
| `visual.rootDir`                       | `workflow/{KEY}/assets`                       |
| `visual.subdirs`                       | `.`                                           |
| `visual.matchConfidenceThreshold`      | `30`
| `visual.matchHighConfidence`           | `70` — auto-check checkbox in quiz              |
| `visual.maxImagesPerSlice`             | `3` — top-N matches displayed                   |
| `visual.figmaUrlPattern`               | `https://www.figma.com/file/{fileKey}[?node-id={nodeId}]` |
| `visual.synonymMapPath`                | `references/visual-synonyms.md`                |
| `visual.entityNormalization`           | `true` — strip diacritics, lowercase, split camelCase |
| `visual.entityMatchWeight`             | `40` (increased from 20 for stronger signal)   |

---

## 7. Slicing Rules

| Key                          | Value                                     |
| ---------------------------- | ----------------------------------------- |
| `slicing.preferredCount`     | `4-8` slices for typical Story            |
| `slicing.minSlices`          | `1` — fewer than this triggers a warning  |
| `slicing.maxSlices`          | `20` — hard cap (schema validation limit) |
| `slicing.minBaDocLength`     | `50` words — warn below this              |
| `slicing.baseSummaryPrefix`  | `[Sub] `                                  |
| `slicing.strategy`           | `vertical` — NEVER horizontal (UI-only, API-only forbidden) |
| `slicing.language`           | `vi` — slice summaries in Vietnamese      |

---

## 8. Decomposition Loop Limits

| Key                             | Value              |
| ------------------------------- | ------------------ |
| `loop.maxQuizIterations`        | `5`                |
| `loop.maxRetryOnCreateFailure`  | `3`                |
| `loop.subagentTimeoutSeconds`   | `180`              |
| `loop.editIterationsMax`        | `3` per edit session (Gate 2b) |
| `loop.editSessionTimeoutSec`    | `600` (10 minutes) |

---

## 8b. Slice Complexity Estimation

Weights used by `processes/3-draft-slices.md` to compute per-slice complexity.

| Key                                      | Value                          | Rationale                              |
| ---------------------------------------- | ------------------------------ | -------------------------------------- |
| `complexity.fieldWeight`                 | `2` per input field            | Each field adds form/grid work         |
| `complexity.apiWeight`                   | `3` per API endpoint           | Each endpoint needs impl + testing     |
| `complexity.integrationWeight`           | `5` if external API call       | External deps add uncertainty          |
| `complexity.validationWeight`            | `2` per validation rule        | Each rule needs impl + test            |
| `complexity.hitlBonus`                   | `3` if HITL type               | Human-in-loop adds coordination cost   |
| `complexity.TRIVIAL.threshold`           | `<= 5`                         | Story points: 1                        |
| `complexity.SIMPLE.threshold`            | `6-12`                         | Story points: 3                        |
| `complexity.MEDIUM.threshold`            | `13-25`                        | Story points: 5                        |
| `complexity.COMPLEX.threshold`           | `> 25`                         | Story points: 8                        |
| `complexity.EPIC.threshold`              | `> 40`                         | Story points: 13 — flag for splitting  |

---

## 10. Source Code Paths (Optional)

| Key                    | Value    | Notes                                                                             |
| ---------------------- | -------- | --------------------------------------------------------------------------------- |
| `sources.fePath`       | *(null)* | Đường dẫn tới FE source. Null = bỏ qua codebase scan, dùng CWD fallback          |
| `sources.bePath`       | *(null)* | Đường dẫn tới BE source. Null = bỏ qua BE cross-validation                       |
| `sources.feFramework`  | `auto`   | `angular` / `react` / `vue` / `auto` — ảnh hưởng glob patterns trong wisdom scan |
| `sources.beFramework`  | `auto`   | `spring` / `nodejs` / `laravel` / `auto` — ảnh hưởng grep patterns               |

**Override order** (ưu tiên từ cao đến thấp):
1. Flag `--fe-path / --be-path` (per-run, override tất cả)
2. `config.sources.fePath / bePath` (set một lần cho project)
3. Interactive prompt tại Step 1b (nếu cả hai đều null)

**Cấu hình nhanh** — chỉnh ngay bên dưới:

```yaml
sources:
  fePath:       # vd: ./frontend  hoặc  C:/projects/my-app/ui
  bePath:       # vd: ./backend   hoặc  C:/projects/my-app/server
  feFramework:  auto
  beFramework:  auto
```

*(Để trống = tự động hỏi người dùng trước Phase A)*

---

## 9. Output Contract

Final command output string (parsed by chaining commands like `/extractor`):

```
[DECOMPOSE_DONE] | Parent: {KEY} | SubTasks: {N} | Keys: {KEY1,KEY2,...} | DryRun: {true|false}
```

**Rules**: single line, exact tags, comma-separated keys (no spaces).
