---
name: subtask-type-mapping-v4
description: Authoritative mapping of slice content -> Jira customfield_10214 value. Referenced by config.md, processes/3-draft-slices.md, processes/7-create-subtasks.md.
type: reference
version: 4.0.0
---

# Sub-Task Type Mapping (customfield_10214) — v4.0.0

**Authoritative table** for mapping slice nature -> `subTaskType` value.

**Required** for project `EMSPRO2` — omission causes HTTP 400 "issuetype: issue type is required".

---

## Mapping Table

| Slice content                          | `subTaskType` value              | `issueType` |
| -------------------------------------- | -------------------------------- | ----------- |
| Building UI screens, components, forms | `Developing`                     | `Sub-task`  |
| Report / Export / Download features   | `Developing`                     | `Sub-task`  |
| Fixing a bug or regression             | `Fixing bug`                     | `Sub-task`  |
| Architecture decision, HITL slice         | `Investigate`                      | `Sub-task`  |
| Excel import / data processing          | `Data Processing`                 | `Sub-task`  |
| Writing test cases                      | `Test case: Create / Review`     | `Sub-task`  |
| Reviewing code, PR review               | `Review Code`                     | `Sub-task`  |
| Writing BA / spec documents             | `Create Document`                 | `Sub-task`  |
| Meeting / coordination                  | `Meeting`                        | `Sub-task`  |
| Self-learning / research                | `Seft-learning`                  | `Sub-task`  |
| Environment setup                      | `Setup Environment`              | `Sub-task`  |
| *(fallback when unclear)*              | `Developing`                      | `Sub-task`  |

---

## The Two-Field Rule

Jira has **two separate fields** — do NOT conflate them:

| Field          | Purpose                     | Value                                     |
| -------------- | --------------------------- | ----------------------------------------- |
| `issueType`    | Jira system issue type      | **ALWAYS** `"Sub-task"` for /decompose    |
| `subTaskType`  | Custom work classification  | One of the values above (`customfield_10214`) |

### Wrong

```javascript
jira_create_issue({
  issueType: "Developing",    // Causes HTTP 400
  // ...
});
```

### Correct

```javascript
jira_create_issue({
  issueType: "Sub-task",      // System type
  subTaskType: "Developing",  // Work type (customfield_10214)
  // ...
});
```

---

## Decision Heuristics (for `processes/3-draft-slices.md`)

```
if slice.summary matches /UI|form|grid|screen|component|button|input/i:
    return "Developing"

if parent.issueType == "Bug" OR slice.summary matches /fix|bug|regression|hotfix/i:
    return "Fixing bug"

if slice.type == "HITL" AND slice.summary matches /arch|design|unclear|investigate|TBD/i:
    return "Investigate"

if slice.summary matches /report|export|download|bao cao|bao-cao|xuat|tai xuong/i:
    return "Developing"  // Reports and exports are UI features, not data processing

if slice.summary matches /import|excel|upload.*file|data.*process|batch/i:
    return "Data Processing"

if slice.summary matches /test.*case|viết.*test|kiểm thử/i:
    return "Test case: Create / Review"

if slice.summary matches /review.*code|PR.*review/i:
    return "Review Code"

if slice.summary matches /BA|spec|document|tài liệu/i:
    return "Create Document"

if slice.summary matches /meeting|họp|coordination/i:
    return "Meeting"

if slice.summary matches /learn|research|nghiên cứu|tự học/i:
    return "Seft-learning"

if slice.summary matches /setup|environment|môi trường/i:
    return "Setup Environment"

return "Developing"  // default
```

---

## Cross-References

- `config.md` S3 — project-level requirements table
- `processes/3-draft-slices.md` S5 — applies this mapping during slice generation
- `processes/7-create-subtasks.md` S3 — uses in `jira_create_issue` payload
