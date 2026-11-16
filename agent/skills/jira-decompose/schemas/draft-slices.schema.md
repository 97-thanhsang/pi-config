---
name: draft-slices-schema-v5
description: JSON contract for slice data used during /decompose. No longer emitted as DRAFT_SLICES_JSON marker — stored only in context.json.
type: schema
version: 5.0.0
---

# Slice Data Schema (v5.0.0)

This schema defines the structure of each slice in the `slices[]` array, which is stored in `context.json` and used throughout the decompose flow. No `[DRAFT_SLICES_JSON]` marker is emitted — only final `context.json`.

---

## 1. Slice Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `summary` | string | Yes | `[FE]`/`[BE]` prefix + Vietnamese description |
| `purpose` | string | Yes | Business value — what problem this slice solves |
| `steps` | string[] | Yes | Implementation steps (user/developer flow) |
| `data` | array | No | Fields `{field, type, required, notes}` |
| `apis` | array | No | `{endpoint, method, description}` |
| `ui` | array | No | `{name, type, path}` for components |
| `businessRules` | array | No | `{field, rules: [{type, value, message}]}` |
| `implementationNotes` | object | No | `{filesToModify, pattern, state, rxjs, changeDetection, whatNotToDo}` |
| `acceptanceCriteria` | string[] | Yes | Checklist items |
| `testScenarios` | string[] | Yes | Min 2 per slice |
| `category` | string | No | `feature` / `ui` / `bug-fix` / `refactor` / `config` |
| `complexity` | enum | Yes | `TRIVIAL` / `SIMPLE` / `MEDIUM` / `COMPLEX` / `EPIC` |
| `estimatedStoryPoints` | number | Yes | 1, 3, 5, 8, 13 |
| `dependsOn` | string | Yes | `None` or comma-separated keys |
| `suggestedSubTaskType` | string | Yes | `Developing` / `Fixing bug` / etc. |

## 2. Full Example

```json
{
  "summary": "[FE] FormThongKeGioTheoDonViComponent — popup cấu hình xuất",
  "purpose": "Tạo popup modal với 3 trường Năm học, Khoa, Tổ bộ môn",
  "steps": [
    "Tạo component mới trong community-service/ui",
    "Build reactive form với controls namHocId, khoaId, boMonId",
    "Tích hợp select-control cho dropdowns",
    "Implement dependent loading TBM theo Khoa (switchMap)",
    "Register module + export index.ts"
  ],
  "data": [
    {"field":"namHocId","type":"FormControl","required":true,"notes":"select-control NAM_HOC"},
    {"field":"khoaId","type":"FormControl","required":true,"notes":"select-control KHOA"}
  ],
  "apis": [
    {"endpoint":"DataControls (KHOA)","method":"GET","description":"Danh mục Khoa"}
  ],
  "ui": [
    {"name":"FormThongKeGioTheoDonViComponent","type":"New","path":"libs/features/community-service/ui/"}
  ],
  "businessRules": [],
  "implementationNotes": {
    "filesToModify": ["form-thong-ke-gio-theo-don-vi.component.ts"],
    "pattern": "NzModalService.create + reactive form",
    "state": "local state",
    "rxjs": "takeUntil(this.destroyed$)",
    "changeDetection": "OnPush",
    "whatNotToDo": ["Không dùng <nz-modal> tag"]
  },
  "acceptanceCriteria": [
    "Popup NzModalService.create width 780px",
    "Form 3 trường với select-control"
  ],
  "testScenarios": [
    "Mở popup — verify title và 3 trường",
    "Chưa chọn Năm + Khoa → disabled"
  ],
  "category": "ui",
  "complexity": "MEDIUM",
  "estimatedStoryPoints": 5,
  "dependsOn": "HPMUON2-1669",
  "suggestedSubTaskType": "Developing"
}
```

## 3. Validation Rules

1. `slices[]` length between 1 and 20.
2. `estimatedStoryPoints` in `{1, 3, 5, 8, 13}`.
3. `complexity` in `{TRIVIAL, SIMPLE, MEDIUM, COMPLEX, EPIC}`.
4. Sum of all `estimatedStoryPoints` ≤ 50.
5. Each slice has min 2 `testScenarios`.
6. `dependsOn` DAG must be acyclic (no circular dependencies).
