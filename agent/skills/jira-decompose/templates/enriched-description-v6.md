---
name: enriched-description-template-v6
description: Canonical 10-section template for sub-task descriptions. AI-optimized — compact, engineering-focused, with Figma links, repos, Review Checklist, and Agent Context.
type: template
version: 6.0.0
format: jira-wiki-markup
audience: ai
supersedes: enriched-description-template-v5
---

# Enriched Sub-Task Description Template (v6.0.0)

## 10 Sections

### h2. 1. Context

Parent issue, repos, module paths, category, Jira dependency.

```wiki
h2. 1. Context
*Parent*: {KEY} — {summary}
*Repos*: {FE repo} / {BE repo}
*Branch base*: main
*Module*: {FE path} / {BE path}
*Category*: {category}
*Depends On*: {dependsOn or "None"}
```

### h2. 2. Purpose

One paragraph: business value + what problem this slice solves. NOT technical spec.

```wiki
h2. 2. Purpose
{purpose}
```

### h2. 3. Steps

Numbered list of user-facing steps: precondition → action → expected system response.

```wiki
h2. 3. Steps
# {step 1}
# {step 2}
```

### h2. 4. Data

Request/Response DTO with field types. Columns: `Field`, `Type`, `Required`, `Notes`.

```wiki
h2. 4. Data
|| Field || Type || Required || Notes ||
| {fieldName} | {type} | {Yes/No} | {notes or (empty)} |
```

If no data changes, render `(empty)`.

### h2. 5. APIs

Endpoints consumed or modified. Includes error handling pattern.

```wiki
h2. 5. APIs
|| Endpoint || Method || Description ||
| {endpoint} | {method} | {description} |

Error handling: Nếu API lỗi (400/500) → hiển thị toast "Không thể thực hiện. Vui lòng thử lại sau."
```

If no API changes, render `(empty)`.

### h2. 6. UI

Components with Figma node-id references and module paths.

```wiki
h2. 6. UI
|| Component || Type || Module path || Figma ||
| {componentName} | {page/form/dialog} | {libs/.../path} | {figma-url} |
```

If no UI changes, render `(empty)`.

### h2. 7. Business Rules

Validations, error scenarios, cascading logic, and constraints.

```wiki
h2. 7. Business Rules
|| Rule || Condition || Action || Message ||
| {ruleName} | {whenCondition} | {systemAction} | {userMessage or (empty)} |
```

If none, render `(empty)`.

### h2. 8. Implementation Notes

Files to modify, design patterns, state management, anti-patterns.

```wiki
h2. 8. Implementation Notes
*Files to modify*: {component names or file paths}
*Pattern to follow*: {NzModalService.create() + select-control / Base CRUD}
*Key decisions*: {decision1; decision2}
*What NOT to do*: No hardcoded strings | Use OnPush + takeUntil | No <nz-modal> tag
*State*: local component state + reactive form (không ngRx)
*RxJS*: mọi subscription dùng takeUntil(this.destroyed$)
```

### h2. 9. Acceptance Criteria

Review checklist format. Each item is testable.

```wiki
h2. 9. Acceptance Criteria
- [ ] {testable condition 1}
- [ ] {testable condition 2}
```

Minimum 1 happy path + 1 error path.

### h2. 10. Test Scenarios

Concrete test cases.

```wiki
h2. 10. Test Scenarios
# {Happy: description}
# {Error: description}
```

---

## Rendering Rules

1. Every section MUST be rendered. If no data exists → `(empty)`.
2. Section order is fixed. NEVER reorder.
3. Use ONLY Jira wiki markup: `h2.`, `||table||`, `*bold*`, `# list`.
4. No HTML, no emoji, no `{color:}`.
5. `- [ ]` chỉ dùng trong section 9 (Acceptance Criteria).
6. Pre-validate: all 10 headers present, sections 1-2 not empty, byte length < 32000.
