## 3. BE Technical Design Template

```markdown
---
key: "{KEY}"
type: BE_TECHNICAL_DESIGN
risk_score: {riskScore}
risk_level: {riskLevel}
estimated_hours: {estHours}
jira_sync:
  field: customfield_11002
  auto_update: true
quality_gates:
  section_d_complete: false
  section_e_complete: false
  erd_generated: false
  sequence_generated: ${(beData.controllers?.length ?? 0) > 0 || (beData.queries?.length ?? 0) > 0}
  checklist_all_pass: ${(beData.queries?.length ?? 0) > 0 && (beData.controllers?.length ?? 0) > 0}
approved: false
---

# BE TECHNICAL DESIGN: {KEY}
Parent: {parent} | Project: {project} | Date: {date}
Risk: {riskLevel} | Score: {riskScore} | Est.Hours: {estHours}
Pipeline Stage: BLUEPRINT | Next: /decompose {KEY}

## 0. Scope Summary
**Muc tieu:** {summary}
**Modules affected:** {modules}
**Loai thay doi:** {changeType}

| Metric | Count | Source |
|:-------|:-----:|:-------|
| SP changes (NEW) | {N} | Codebase scan |
| SP changes (MODIFY) | {M} | Codebase scan |
| Table changes (CREATE) | {K} | Codebase scan |
| Table changes (ALTER) | {L} | Codebase scan |
| API endpoints (NEW) | {P} | Codebase scan |
| API endpoints (MODIFY) | {Q} | Codebase scan |

> **Risk Formula:** ({N}*1 + {M}*2 + {L}*3 + {P}*1 + {Q}*1) = {riskScore} → {riskLevel}

## A. Tenant & Gating
**Logic tenant:** {tenantLogic}
**Affected tenants:** {tenants}
**Gating implementation:** {gateType}

## B. Current State (Files Found)
| File Path | Module | Type | Existing Logic | Legacy? | Section Ref |
|:----------|:-------|:----:|:---------------|:-------:|:-----------:|

## C. Repos & Branch
| Repo | Branch | Base Branch |
|:-----|:-------|:------------|

## D. Database Changes
### Stored Procedures
| SP Name | Action | Parameters | Return Type | Risk |
|:--------|:------:|:-----------|:------------|:----:|

### Table / Column Changes
| Table | Action | New Columns | Modified | Migration |
|:------|:------:|:------------|:---------|:----------|

### ERD Diagram
<!-- mermaid-generator → ERD if >= 1 DB change -->

### Migration Strategy
Rollback: {strategy} | Estimated rows: {N} | ETA: {time}

## E. Service / Controller
### Endpoints
| Method | Endpoint | Request DTO | Response | SP Called |
|:------:|:---------|:------------|:---------|:----------|

### DTOs
```csharp
// Request + Response DTOs
```

### Error Codes
| HTTP | Condition | Response |
|:----:|:----------|:---------|

### Sequence Diagram
<!-- mermaid-generator → Sequence if >= 1 API change -->

## F. ACL & Menu
| Action | Required Role | Permission Key | Menu Path |
|:-------|:-------------|:---------------|:----------|

## G. Impact Analysis
| Affected Module | Impact Type | Risk | Mitigation | Blocking? |
|:----------------|:-----------|:----:|:-----------|:---------:|

## H. Task Breakdown
| # | Task | Files | AC | SP | Depends | Section Ref |
|:-:|:-----|:------|:---|:--:|:-------:|:-----------:|

## I. Constraints for Coder
| # | Constraint | Reason | Source |
|:-:|:-----------|:-------|:-------|

## J. Questions to Resolve
| # | Question | Assignee | Severity | Status |
|:-:|:---------|:---------|:---------:|:------|

## K. Review Checklist
| # | Item | Source | Auto-Pass? | Status |
|:-:|:-----|:-------|:----------:|:------|
| 1 | Section D: >=1 SP row defined | D.SP | ✅ | Auto |
| 2 | Section D: ERD diagram generated | D.ERD | ✅ | Auto |
| 3 | Section D: Migration + rollback | D.Migration | ⚠️ | Pending |
| 4 | Section E: >=1 endpoint row | E.Endpoint | ✅ | Auto |
| 5 | Section E: DTOs defined | E.DTOs | ✅ | Auto |
| 6 | Section E: Error codes documented | E.Error | ⚠️ | Pending |
| 7 | Section E: Sequence diagram | E.Sequence | ✅ | Auto |
| 8 | Section F: ACL permissions mapped | F.ACL | ⚠️ | Pending |
| 9 | Section G: Blocking imp. mitigated | G.Mitigation | ✅ | Auto |
| 10 | Section H: All tasks have AC | H.AC | ✅ | Auto |
| 11 | Section H: Acyclic deps | H.Depends | ✅ | Auto |
| 12 | Section J: BLOCKER resolved | J.Status | ⚠️ | Pending |
```

---


