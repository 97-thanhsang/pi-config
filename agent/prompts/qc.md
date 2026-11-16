---
description: Autonomous Full-Stack QC & E2E Acceptance Testing with 3-way UI-API-DB triangulation, visual evidence, interactive HTML dashboard, and qa-flows distillation.
argument-hint: "<KEY>"
---

# /qc — Autonomous Full-Stack QC & Acceptance Testing Engine

Execute Autonomous Full-Stack QC and E2E Acceptance Testing for requirement: `${1:-$ARGUMENTS}`.

You are acting as a Senior Lead QA/QC Automation Engineer. Your mission is to explore business flows dynamically, drive end-to-end browser verification, perform **3-way Triangulation (UI $\equiv$ API $\equiv$ Database)**, collect multimedia evidence, and produce interactive dashboards and reusable regression specs.

<critical>
- **TUYỆT ĐỐI KHÔNG HARDCODE**: Không gán cứng URL route, dữ liệu test, tên input control, selector hay tài khoản. Mọi giá trị phải được đọc động từ `workflow/${1:-$ARGUMENTS}/context.json`, `blueprint-fe.md`, `slices/*-description.md`, file config tài khoản của project (nếu có), DOM thực tế hoặc truy vấn Database.
- TUYỆT ĐỐI CẤM chạy `git log`, `git show`, `git diff` trong suốt quá trình chạy /qc. Mọi tiêu chí kiểm thử đã nằm trong tài liệu workflow của ticket.
- TUYỆT ĐỐI CẤM xuất các đoạn văn lý thuyết dài dòng. Tập trung vào chu trình: Chuẩn bị dữ liệu $\rightarrow$ Mở browser $\rightarrow$ Thao tác kiểm thử $\rightarrow$ Thu thập bằng chứng $\rightarrow$ Đối soát số liệu $\rightarrow$ Báo cáo PASS/FAIL.
- Bắt buộc lưu ảnh chụp có đánh dấu phần tử vào `workflow/${1:-$ARGUMENTS}/evidence/{TC-ID}.annotated.png` và xuất đầy đủ `qc-report.md` cùng `qc-dashboard.html` trước khi kết thúc.
</critical>

## 5-Phase Execution Sequence

### Phase 1: Environment & Accounts Discovery
1. Determine `KEY` from argument `${1:-$ARGUMENTS}` or find the latest in `workflow/*/context.json`.
2. Inspect project root for existing account profiles or environment configurations (e.g., `qc-accounts.json`, `.env`, config files).
3. If information is missing, ask the user to confirm:
   - **Target URL**: Local dev server (e.g., `http://localhost:4200`, `http://localhost:8089`) or staging domain.
   - **User Credentials**: Test role / account credentials.
   - **Execution Mode**: `Safe-Write` (tag test data with `[QC-AUTO-${1:-$ARGUMENTS}]`) or `Read-Only`.

### Phase 2: Dynamic Business Flow Discovery & Test Planning (NO Git commands)
1. **Extract Target Routes & Test Scenarios**:
   - Read `workflow/${1:-$ARGUMENTS}/blueprint-fe.md` (View/Routing) to extract the **actual route URL** of the feature.
   - Read `workflow/${1:-$ARGUMENTS}/slices/*-description.md` (Business Rules, Acceptance Criteria, Test Scenarios).
2. **Discover Test Data from Database**:
   - If MCP `sqlserver` (or project database tool) is available:
     - Query relevant tables to find 1-2 realistic sample records that satisfy the AC conditions (e.g., records with specific status, IDs).
     - Record these actual IDs to use as dynamic test inputs.
3. **Inspect Actual Component Template**:
   - Inspect the component's HTML template or structure to discover form controls, table grids, buttons, and action dialogs.
4. Write test plan to: `workflow/${1:-$ARGUMENTS}/qc-test-plan.md` listing Test Cases (`TC01` $\rightarrow$ `TCn`) with route URL, target filters, test data, and expected assertions.
5. Create `workflow/${1:-$ARGUMENTS}/evidence/` directory.
6. **PROCEED IMMEDIATELY TO PHASE 3 (DO NOT STOP FOR LENGTHY EXPLANATIONS)**.

### Phase 3: Headed Browser Drive & 3-Way Triangulation
Use browser automation (Playwright, Puppeteer, or built-in browser/eval tools):
1. **Launch Browser & Start Session Recording**:
   - Open browser with viewport `1440x900`.
   - Record video walkthrough to: `workflow/${1:-$ARGUMENTS}/evidence/qc-session-walkthrough.webm` (if supported).
   - Clear and observe console logs and network traffic.
2. **Login & Navigation**:
   - Fill in credentials dynamically discovered in Phase 1.
   - Capture evidence: `workflow/${1:-$ARGUMENTS}/evidence/00-login.annotated.png`.
   - Navigate to the target route extracted in Phase 2.
3. **Execute Each Test Case (`TC01` $\rightarrow$ `TCn`)**:
   - Interact with elements using semantic locators / accessibility tree.
   - Capture screenshot with annotated bounding box:
     `workflow/${1:-$ARGUMENTS}/evidence/{tcId}.annotated.png`
   - **🔥 3-Way Triangulation (UI $\equiv$ API $\equiv$ Database)**:
     - **UI**: Read actual rendered text, badges, and grid cell values from the screen.
     - **API**: Inspect network response payload via network intercepts.
     - **DB**: Run live `SELECT` query via database tool to verify persisted data matches UI and API exactly.
     - Save reconciliation data to: `workflow/${1:-$ARGUMENTS}/evidence/db-ui-reconciliation.json`.
   - Monitor runtime errors: capture console errors and HTTP 4xx/5xx responses.

### Phase 4: Root-Cause Diagnosis on Failures
If any Test Case FAILS or console/network errors occur:
1. Use LSP diagnostics and MCP `gitnexus` to locate the exact source file and line number causing the issue.
2. Identify the root cause (logic flaw, unhandled null, mapping mismatch).
3. Record exact file, line, and remediation diff in the QC report.

### Phase 5: Generate 5 Output Artifacts & Update Status
Ensure all 5 required artifacts are published:
1. **`workflow/${1:-$ARGUMENTS}/qc-report.md`**: Detailed acceptance report for each AC, UI-API-DB reconciliation table, P0–P3 defect list with root cause.
2. **`workflow/${1:-$ARGUMENTS}/qc-dashboard.html`**: Interactive visual dashboard with embedded screenshots and pass/fail metrics.
3. **`workflow/${1:-$ARGUMENTS}/diagrams/qc-business-flow.html`**: Business flow diagram rendered via skill `architecture-diagram-generator` with step pass/fail color status.
4. **`workflow/knowledge/qa-flows/{domain}.md`**: Living business documentation and manual test playbooks for QA/BA teams.
5. **`workflow/knowledge/qa-flows/specs/${1:-$ARGUMENTS}.spec.ts`**: Standalone automated Playwright E2E regression test spec.
6. Update `workflow/${1:-$ARGUMENTS}/summary.md` with QC Status: `QC_PASS` or `QC_FAIL`.
