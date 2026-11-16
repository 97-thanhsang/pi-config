---
name: extractor-config
description: Paths and defaults for extractor-to-knowledge skill (v5.0.0).
type: reference
version: 5.0.0
---

# Config — extractor-to-knowledge

## Output Paths

| Key | Value |
|-----|-------|
| `knowledgeRoot` | `workflow/knowledge/` |
| `knowledgeIndexPath` | `workflow/knowledge/INDEX.md` |
| `sharedPath` | `workflow/knowledge/shared/{domain}/` |
| `featurePath` | `workflow/knowledge/{domain}/{feature}/` |
| `decomposeContextPath` | `workflow/reports/decompose/{KEY}-context.json` |

## Knowledge Format

| Key | Value |
|-----|-------|
| `descriptionMinChars` | 100 |
| `descriptionMaxChars` | 300 |
| `maxTriggers` | 5 |
| `versionNew` | `1.0.0` |

## Constraints

| Key | Value |
|-----|-------|
| `shared.domain.exclude` | `core, shared` (manually curated) |
