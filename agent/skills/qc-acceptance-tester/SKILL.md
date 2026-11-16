---
name: qc-acceptance-tester
description: Full-stack autonomous QC and E2E Acceptance Testing engine. Masters module domain business flows, drives live headed Chrome via OMP browser, performs 3-way triangulation (UI == API == SQL Server), collects video/annotated evidence, builds interactive QC dashboards, and distills reusable qa-flows playbooks. Use when running /qc or verifying acceptance criteria on live/local web environments.
compatibility: pi
---

# SKILL: qc-acceptance-tester (OMP Full-Stack Autonomous QC Engine)

**PURPOSE**: Hướng dẫn AI đóng vai trò Kỹ sư QC/QA Senior kiểm thử tự động toàn diện: Khảo sát nghiệp vụ động theo từng ticket, trực tiếp điều khiển trình duyệt Chrome hiển thị trước mắt người dùng (`headed: true`), đối soát dữ liệu 3 tầng (**Giao diện UI $\equiv$ Gói tin API $\equiv$ Database SQL Server**), thu thập bằng chứng đa phương tiện (Ảnh chụp annotate, Video `.webm`, Network HAR), chẩn đoán Root-cause bằng LSP khi có lỗi, và đóng gói tri thức thành playbook nghiệp vụ sống (`workflow/knowledge/qa-flows/`).

---

## 1. NGUYÊN TẮC BẤT BIẾN (THE 5 QC IRON LAWS)

1. **Không Hardcode — Khám Phá Động 100% (Zero-Hardcode Rule)**:
   - **TUYỆT ĐỐI KHÔNG hardcode** bất kỳ URL màn hình, mã dữ liệu (ID/mã số), tên combobox (`formControlName`), giá trị text option, hay mật khẩu nào vào kịch bản kiểm thử.
   - Mọi thông tin (URL route, selectors, test data, tài khoản) bắt buộc phải được **truy xuất động** từ:
     1. Hồ sơ ticket (`workflow/{KEY}/context.json`, `blueprint-fe.md`, `slices/*-description.md`).
     2. Cấu hình môi trường dự án (`<project_root>/.omp/qc-accounts.json`).
     3. Khảo sát DOM thực tế (`tab.observe()`, template `.component.html`).
     4. Truy vấn CSDL SQL Server của dự án (`execute_sql`).
2. **Hành Động Kiểm Thử Thực Tế — Cấm Thuyết Trình Git**:
   - **CẤM CHẠY LỆNH `git log`, `git show`, `git diff` trong suốt quá trình chạy `/qc`**. Toàn bộ AC và yêu cầu giao diện đã nằm trong `workflow/{KEY}/blueprint-fe.md` và `slices/*-description.md`.
   - **CẤM in các bài luận tóm tắt commit dài dòng** cho người dùng. Nhiệm vụ duy nhất của QC là: Đăng nhập $\rightarrow$ Điều hướng chức năng $\rightarrow$ Thao tác kiểm thử từng AC $\rightarrow$ Chụp ảnh bằng chứng $\rightarrow$ Đối soát số liệu $\rightarrow$ Báo cáo PASS/FAIL.
   - Sau khi lập nhanh `qc-test-plan.md`, **PHẢI MỞ TRÌNH DUYỆT NGAY LẬP TỨC** và tiến hành kiểm thử trên Chrome.
3. **Kỷ Luật Tự Phục Hồi Bằng Thị Giác (Visual Self-Correction)**:
   - Khi gặp khó khăn trên UI (click không ăn, dropdown không mở, bị modal đè): **CHỤP ẢNH NGAY `await tab.screenshot({ annotate: true })`** để nhìn màn hình thực tế. Tuyệt đối không đoán mò selector và không fallback sang lệnh Git hay chat lý thuyết.
4. **Đối Soát Tam Giác (3-Way Triangulation)**:
   - Tiêu chí AC về dữ liệu chỉ được tính là **PASS** khi cả 3 nguồn khớp nhau 100%:
     $$\text{Giá trị hiển thị trên DOM/Grid} \equiv \text{Payload JSON từ API Response} \equiv \text{Kết quả câu lệnh SELECT trên SQL Server}$$
5. **Trực Quan Hóa Trực Tiếp (`headed: true`) & An Toàn Dữ Liệu**:
   - Luôn mở trình duyệt ở chế độ `app: "chromium", headed: true, persist: true` để người dùng quan sát trực tiếp từng thao tác trên màn hình.
   - Mọi bản ghi tạo mới phải gắn tiền tố `[QC-AUTO-{KEY}]`. Các thao tác phá hủy (xóa dữ liệu gốc, duyệt chính thức) bắt buộc dừng lại hỏi người dùng qua `ask`.

---

## 2. QUẢN LÝ TÀI KHOẢN ĐỘNG (`.omp/qc-accounts.json`)

Mỗi dự án lưu thông tin môi trường và tài khoản riêng tại `<project_root>/.omp/qc-accounts.json` (được bảo vệ bởi `.gitignore`):

```json
{
  "defaultEnv": "local",
  "environments": {
    "local": "http://localhost:8089",
    "test": "https://..."
  },
  "defaultPolicy": "safe-write",
  "accounts": {
    "master": {
      "username": "...",
      "password": "...",
      "role": "Super Admin / Toàn quyền",
      "defaultEntryUrl": "..."
    }
  }
}
```

- Khi khởi chạy `/qc`, đọc động file này và dùng form `ask` để người dùng xác nhận môi trường và tài khoản.
- Lấy `username` và `password` trực tiếp từ object JSON đã đọc, tuyệt đối không hardcode mật khẩu vào code script.

---

## 3. NGUYÊN TẮC THAO TÁC GIAO DIỆN BẰNG SEMANTIC ACCESSIBILITY (OMP NATIVE)

Harness OMP sử dụng mô hình tương tác hướng ngữ nghĩa (Accessibility Tree) thông qua công cụ `tab.observe()` và `tab.id(n)`. **Tuyệt đối không đoán mò hoặc hardcode các class CSS của thư viện cụ thể** (như Ant Design, Kendo UI, Angular Material, Bootstrap...).

### 3.1 Khám Phá Phần Tử Động Bằng `tab.observe()`
Trước khi thực hiện bất kỳ thao tác nào trên trang:
```javascript
// 1. Lấy toàn bộ phần tử tương tác đang hiển thị thực tế trên màn hình
const obs = await tab.observe();
// obs.elements trả về danh sách các phần tử thực tế:
// [ { id: 1, role: "combobox", name: "Cơ sở", value: "Cơ sở 1", expanded: false },
//   { id: 2, role: "textbox", name: "Nhập từ khóa", value: "" },
//   { id: 3, role: "button", name: "Tìm kiếm" }, ... ]
```
Thao tác trực tiếp qua ID quan sát được:
- Click phần tử: `await tab.id(elementId).click();`
- Điền dữ liệu: `await tab.id(elementId).fill(value);`
- Chọn thẻ select: `await tab.id(elementId).select(value);`

### 3.2 Tương Tác Combobox / Dropdown Động Bằng Accessibility Tree (100% Framework-Agnostic)
Bất kể ứng dụng dùng thư viện UI nào (HTML5 `<select>`, Kendo DropDown, AntD Select, Angular Material, hay Custom Web Component), quy trình tương tác chuẩn ngữ nghĩa là:
```javascript
// Bước 1: Quan sát trang tìm combobox theo nhãn hiển thị hoặc vai trò (role)
const obs = await tab.observe();
const targetCombo = obs.elements.find(e =>
  e.role === "combobox" && (e.name.toLowerCase().includes(fieldLabel.toLowerCase()) || e.id === targetId)
);

if (targetCombo) {
  // Bước 2: Click mở dropdown bằng ID quan sát được
  await tab.id(targetCombo.id).click();

  // Bước 3: Quan sát lại DOM ngay sau khi mở để lấy danh sách option vừa hiển thị
  const openedObs = await tab.observe();
  const targetOption = openedObs.elements.find(e =>
    e.role === "option" && (e.name.toLowerCase().includes(targetOptionText.toLowerCase()) || e.selected === false)
  );

  // Bước 4: Click chọn option tìm được
  if (targetOption) {
    await tab.id(targetOption.id).click();
  }
}
// Hoặc đối với thẻ <select> chuẩn HTML:
// await tab.id(targetCombo.id).select(targetValue);
```

### 3.3 Tự Động Xử Lý Dialog / Modal Che Khuất Bằng Semantic Role
Khi có dialog hoặc modal popup che khuất màn hình:
```javascript
const obs = await tab.observe();
const dialog = obs.elements.find(e => e.role === "dialog" || e.role === "alertdialog");
if (dialog) {
  // Tìm nút đóng ngữ nghĩa (Close, Đóng, Hủy, Dismiss)
  const closeBtn = obs.elements.find(e =>
    e.role === "button" && /close|đóng|hủy|bỏ qua|xác nhận|ok/i.test(e.name)
  );
  if (closeBtn) {
    await tab.id(closeBtn.id).click();
  } else {
    await tab.press("Escape");
  }
  await new Promise(r => setTimeout(r, 500));
}
```

### 3.4 Nhập Liệu & Tìm Kiếm Động Bằng Semantic Role
```javascript
const obs = await tab.observe();
// Tìm ô nhập liệu theo role textbox hoặc label
const input = obs.elements.find(e =>
  e.role === "textbox" && (e.name.toLowerCase().includes(searchLabel.toLowerCase()) || e.value === "")
);
if (input) {
  await tab.id(input.id).fill(sampleDataFromDb);
  await tab.press("Enter");
}

// Tìm và bấm nút hành động (Tìm kiếm, Lọc, Áp dụng)
const actionBtn = obs.elements.find(e =>
  e.role === "button" && /tìm kiếm|search|lọc|filter/i.test(e.name)
);
if (actionBtn) {
  await tab.id(actionBtn.id).click();
}
```

### 3.5 Tương Tác Bảng & Danh Sách Dữ Liệu Động
```javascript
// Trích xuất dữ liệu bảng có cấu trúc
const tableData = await tab.extract("text", { outline: true });

// Tìm nút thao tác trên hàng dữ liệu (Menu, Thao tác, Chi tiết, Action)
const obs = await tab.observe();
const rowActionBtn = obs.elements.find(e =>
  e.role === "button" && /thao tác|action|chi tiết|more|menu/i.test(e.name)
);
if (rowActionBtn) {
  await tab.id(rowActionBtn.id).click();
}
```
---

## 4. QUY TRÌNH THỰC THI 5 PHA ĐỘNG

### PHA 1: Tiếp Nhận Môi Trường & Tài Khoản qua `ask`
- Đọc `<project_root>/.omp/qc-accounts.json` lấy danh sách URL môi trường và tài khoản cấu hình.
- Dùng `ask` để người dùng xác nhận môi trường chạy test, tài khoản sử dụng, và chính sách ghi dữ liệu (`Safe-Write` / `Read-Only`).

### PHA 2: Khám Phá Nghiệp Vụ & Dữ Liệu Mẫu Động (KHÔNG chạy Git)
1. Đọc `workflow/{KEY}/blueprint-fe.md` và `slices/*-description.md` để trích xuất:
   - Danh sách AC cần kiểm thử.
   - Các Business Rules và điều kiện ràng buộc.
   - Route URL dẫn vào chức năng.
2. Dùng MCP `sqlserver` (`execute_sql`) truy vấn tìm **1-2 bản ghi mẫu thực tế trong Database** thỏa mãn điều kiện AC (không đoán mò dữ liệu).
3. Ghi file `workflow/{KEY}/qc-test-plan.md` liệt kê chi tiết các Test Cases (`TC01` $\rightarrow$ `TCn`).
4. Khởi tạo danh sách `todo`.
5. **CHUYỂN NGAY SANG PHA 3 — MỞ TRÌNH DUYỆT (KHÔNG DỪNG LẠI THUYẾT TRÌNH)**.

### PHA 3: Mở Chrome Trực Tiếp (`headed: true`) & Thực Thi Từng TC
1. **Khởi chạy trình duyệt**:
   ```javascript
   const tab = await browser.open({
     name: "qc-live",
     url: baseUrl,
     app: "chromium",
     headed: true,
     persist: true,
     viewport: { width: 1440, height: 900 }
   });
   await tab.recordStart(`workflow/${KEY}/evidence/qc-session-walkthrough.webm`);
   await tab.harStart();
   ```
2. **Đăng nhập & Điều hướng**:
   - Điền username/password lấy từ config $\rightarrow$ Click đăng nhập $\rightarrow$ Chụp ảnh `evidence/00-login.annotated.png`.
   - Điều hướng trực tiếp đến route mục tiêu đã trích xuất ở Pha 2.
   - Tự động đóng modal che khuất nếu có.
3. **Thực thi lần lượt từng Test Case**:
   - Cập nhật tiến độ `todo`.
   - Thao tác theo đúng các bước AC.
   - **Chụp ảnh có đánh dấu phần tử**: `await tab.screenshot({ path: `workflow/${KEY}/evidence/${tcId}.annotated.png`, annotate: true })`.
   - **Thực hiện Đối Soát Tam Giác**:
     - Lấy text hiển thị thực tế trên UI.
     - Lấy response JSON API qua `await tab.requests()`.
     - Chạy câu lệnh `SELECT` kiểm tra DB qua `sqlserver`.
     - Lưu kết quả so sánh vào `workflow/${KEY}/evidence/db-ui-reconciliation.json`.
   - Bắt lỗi runtime: `await tab.errors()`, `await tab.console({ level: "error" })`.
4. **Dừng ghi hình**:
   ```javascript
   await tab.recordStop();
   await tab.harStop(`workflow/${KEY}/evidence/network-trace.har`);
   ```

### PHA 4: Chẩn Đoán Lỗi Bằng LSP (Nếu có TC FAIL)
Nếu có lỗi UI hoặc API 500:
- Sử dụng `xd://lsp` (`definition`, `references`, `diagnostics`) định vị chính xác vị trí file và dòng code gây lỗi.
- Ghi rõ Root-cause và đề xuất đoạn code sửa chữa cụ thể ngay trong báo cáo.

### PHA 5: Xuất Đầy Đủ 5 Đầu Ra & Mở Dashboard
1. **`workflow/{KEY}/qc-report.md`**: Báo cáo nghiệm thu chi tiết từng AC, bảng đối soát UI–API–DB, danh sách bug P0–P3.
2. **`workflow/{KEY}/qc-dashboard.html`**: Dashboard đồ họa tương tác (tự động mở bằng `start ""`).
3. **`workflow/{KEY}/diagrams/qc-business-flow.html`**: Sơ đồ luồng nghiệp vụ Archify HTML.
4. **`workflow/knowledge/qa-flows/{module-slug}.md`**: Tài liệu nghiệp vụ sống cho team.
5. **`workflow/knowledge/qa-flows/specs/{KEY}.spec.ts`**: Script hồi quy Playwright tự động.
6. Cập nhật `workflow/{KEY}/summary.md`.
