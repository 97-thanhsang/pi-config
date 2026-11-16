---
name: blueprint-writer
description: Create 11-section technical design reports for BE and FE from Jira requirements with risk scoring and quality gates. Use when generating technical blueprints for features.
compatibility: pi
---

# SKILL: blueprint-writer (v1.1.0)

**PURPOSE**: Authoritative 11-section technical design template and risk evaluation for Backend and Frontend. Replaces arbitrary formatting with standardized design documents.

**Load**: `await skill({ name: "blueprint-writer" })`

---

## 1. Template Structure (11 Sections A-K)

Both BE and FE design reports strictly follow the 11-section structure:

| Section | BE Document Focus | FE Document Focus |
|:-------:|:------------------|:------------------|
| **0** | **Scope Summary** & Metrics | **Scope Summary** & Metrics |
| **A** | **Tenant & Gating** | **Tenant & Gating** |
| **B** | **Current State** (Existing Files Found) | **Current State** (Existing Components/Views) |
| **C** | **Repos & Target Branches** | **Repos & Target Branches** |
| **D** | **Database Changes** (Tables, SPs, Migrations) | **View/Routing Changes** (Routes, Menus, Dialogs) |
| **E** | **Services & Controllers** (WebAPI, CQRS) | **Components & Stores** (State, Subscriptions) |
| **F** | **ACL & Permissions** (Policies, Roles) | **Language Resources** (i18n keys) |
| **G** | **System Impact Analysis** (Blast Radius) | **System Impact Analysis** (Component Tree) |
| **H** | **Task Breakdown** (Numbered Implementation Slices)| **Task Breakdown** (Numbered Implementation Slices)|
| **I** | **Constraints for Coder** (Strict Rules) | **Constraints for Coder** (Strict Rules) |
| **J** | **Unresolved Questions** | **Unresolved Questions** |
| **K** | **Quality Review Checklist** | **Quality Review Checklist** |

---

## 2. Risk Scoring & Hour Estimation

```javascript
function calcRiskScore(spNew, spModify, tableAlter, newApi, legacySp) {
  // Formula: (SP_NEW*1 + SP_MODIFY*2 + TABLE_ALTER*3 + NEW_API*1 + LEGACY_SP*1)
  return (spNew * 1) + (spModify * 2) + (tableAlter * 3) + (newApi * 1) + (legacySp * 1);
}

function riskLevel(score) {
  if (score < 5) return 'LOW';
  if (score <= 10) return 'MEDIUM';
  return 'HIGH';
}

function estimateHours(type, data) {
  if (type === 'BE') {
    const spCount = data.queries?.length ?? 0;
    const ctrlCount = data.controllers?.length ?? 0;
    const svcCount = data.services?.length ?? 0;
    return Math.max(spCount * 2 + ctrlCount * 3 + svcCount * 2, 2);
  }
  if (type === 'FE') {
    const compCount = data.components?.length ?? 0;
    const svcCount = data.services?.length ?? 0;
    return Math.max(compCount * 4 + svcCount * 2, 2);
  }
  return 0;
}
```

---

## 3. Template References

Full raw markdown templates with exact section boilerplate and quality gates are stored in:
- **Backend Design Template**: `templates/be-template.md`
- **Frontend Design Template**: `templates/fe-template.md`

### 4. Database Diagram Integration
Khi Section D phát hiện có thay đổi DB hoặc Stored Procedures:
1. Nhúng sơ đồ quan hệ Mermaid ERD trực tiếp vào file thiết kế.
2. Sinh sơ đồ tương tác HTML độc lập qua `architecture-diagram-generator` lưu tại: `workflow/{KEY}/diagrams/database-erd.html` (sidecars đặt trong `.sidecars/`).

Output destination: `workflow/{KEY}/blueprint-be.md` và `workflow/{KEY}/blueprint-fe.md`.
