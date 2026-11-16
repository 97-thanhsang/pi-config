---
name: extractor-to-knowledge
description: Extract shared domain patterns, project rules, and reusable skills from completed pipeline outputs into workflow/knowledge/. Use when distilling completed feature implementations.
compatibility: pi
version: 5.1.0
---

# SKILL: extractor-to-knowledge (v5.1.0)

**PURPOSE**: Read decompose `context.json` + ALL pipeline reports (blueprint, analyze, solution, execute) -> synthesize shared patterns + rules + skills. Runs last after all features complete.

---

## 0. SKILL_METADATA

- **ID**: `workflow/extractor-to-knowledge`
- **Version**: 5.1.0
- **Role**: Knowledge transformer — pipeline outputs -> structured knowledge
- **Prerequisites**: `workflow/reports/decompose/{KEY}-context.json`
- **Input**: Parent key (Story key)
- **Output root**: `workflow/knowledge/`

---

## 1. HARD CONSTRAINTS

| # | Rule | Violation |
|---|------|:--------:|
| 1 | NEVER extract without decompose context.json | Source missing |
| 2 | NEVER write outside `workflow/knowledge/` | Blocked by permission |
| 3 | NEVER modify `core/` or `shared/` manually curated dirs | Manually curated |
| 4 | Shared patterns MUST be domain-generic, NOT tied to Jira key | Wrong bucket |
| 5 | Description 100-300 chars, ≤5 triggers | Reject invalid entry |
| 6 | Shared knowledge comes from CROSS-SLICE analysis, not single slice | Too narrow |

---

## 2. FILE MAP

| File | Purpose |
|------|---------|
| `commands/extractor/extractor.md` | All logic — 5 steps, single file |
| `config.md` | Paths, thresholds, defaults |

## 3. OUTPUT STRUCTURE & FORMAT STANDARDS

```
workflow/knowledge/
├── INDEX.md
├── GLOSSARY.md                  # Shared Domain Glossary (Ubiquitous Language)
└── shared/{domain}/{pattern}.md

workflow/rules/angular12-{pattern}.md

workflow/skills/{name}/SKILL.md
```

### Format Standards (MUST follow)

**Rules** (`workflow/rules/angular12-{pattern}.md`):
```markdown
---
paths: **/*.component.ts, **/*.service.ts        # CSV string, NOT YAML array
alwaysApply: false                                 # false for lazy loading
description: "Angular 12 {Pattern} conventions"   # include triggers
---
```

**Skills** (`workflow/skills/{name}/SKILL.md`):
```markdown
---
name: {name}              # lowercase-hyphens, matches dir name
description: "..."        # 1-1024 chars, include "Use when..."
license: MIT              # recommended
compatibility: pi   # recommended
---
```

**Knowledge** (`workflow/knowledge/shared/{domain}/{pattern}.md`):
```markdown
---
domain: {domain}
name: {pattern-name}      # snake_case, ≤60 chars
description: "..."        # 100-300 chars, "Use when..."
triggers: [kw1, kw2]      # ≤5 keywords
---
```

### Rule: `paths` format — CSV string is REQUIRED
✅ Correct: `paths: **/*.component.ts, **/*.service.ts`
❌ Wrong: `paths: ['**/*.component.ts', '**/*.service.ts']`
The YAML array format is known to cause issues with OpenCode's path matching.

## 4. FLOW

```
Step 0: Parse + CONFIG_ROOT + load skill
Step 1: Read ALL pipeline outputs (decompose, blueprint, analyze, solution, execute)
Step 2: Knowledge extraction (cross-slice shared patterns)
Step 3: Generate knowledge files + update INDEX.md
Step 4: Generate project rules + skills
Step G: GC audit
```

## 5. PIPELINE INPUTS

| Source | Purpose |
|--------|---------|
| blueprint | API endpoints, DB changes, impacted modules |
| decompose (primary) | Slices, businessRules, fePath/bePath |
| analyze | Data models, risks, cross-reference |
| solution | ADRs, patterns, Task N |
| execute | Code changes, files, quality gates |
| codegraph | Codebase pattern and symbol verification |
websearch_web_search_exa + webfetch | External best practices enrichment |

---

## 6. DOMAIN GLOSSARY EXTRACTION (GLOSSARY.md)

Trích xuất ngôn ngữ chung (Ubiquitous Language / Shared Language) từ pipeline reports:
- **Mục đích**: Chuẩn hóa thuật ngữ giữa domain nghiệp vụ, database entities, biến/hàm trong code. Giúp agent ở các phiên sau hiểu ngay ngữ cảnh, tiết kiệm token giải thích lan man.
- **Vị trí**: `workflow/knowledge/GLOSSARY.md`
- **Cấu trúc**:
  - Thuật ngữ (Term) | Định nghĩa (Definition) | Tương ứng trong Code (FE/BE/DB Entity) | Ngữ cảnh sử dụng
- **Quy tắc**: Cập nhật append-only, chuẩn hóa viết hoa/thường, không trùng lặp.

---

## 7. HIERARCHY OF MISTAKE ELIMINATION (Pstack Correct Discipline)

Khi trích xuất bài học từ các lỗi lặp lại trong quá trình `execute` và `verify`:
Agent **BẮT BUỘC** phân loại và đề xuất biện pháp ngăn chặn theo thang 4 cấp độ (từ gốc rễ đến ngọn):
1. **Cấp 1 — Khóa bằng Kiến trúc & Tinh gọn Code (Cao nhất)**: Đóng gói API nội bộ, thu gọn về một nguồn chân lý (Single Source of Truth), xóa code cũ hỏng để agent không bắt chước ví dụ xấu.
2. **Cấp 2 — Khóa bằng Hệ thống Kiểu & Linter**: Dùng TypeScript Types, C# DTOs, Discriminated Unions để trình biên dịch từ chối code sai ngay từ đầu.
3. **Cấp 3 — Khóa bằng Test Tự Động**: Thêm bài test hồi quy bắt chết lỗi trong suite.
4. **Cấp 4 — Khóa bằng Quy ước Text / Markdown (Thấp nhất)**: Chỉ áp dụng khi 3 cấp trên không thể tự động hóa; ghi vào `workflow/rules/` hoặc bổ sung vào Anti-Rationalization Table.

---

## 8. ENCODE-THEN-DELETE (Pstack Discipline)

Khi rà soát mã nguồn hoặc tái cấu trúc:
- **Phát hiện comment ràng buộc**: Các chú thích như `// IMPORTANT: do not remove`, `// CHÚ Ý KHÔNG SỬA`, `// do not change wording` là tín hiệu của ràng buộc chưa được máy móc hóa.
- **Hành động**:
  1. *Encode (Chuyển hóa)*: Biến ràng buộc thành Type check, Unit Test, hoặc Linter rule.
  2. *Delete (Xóa bỏ)*: Xóa comment cảnh báo sau khi đã có code/test bảo vệ tự động. Cấm để sự an toàn phụ thuộc vào việc agent có nhớ đọc comment hay không.

