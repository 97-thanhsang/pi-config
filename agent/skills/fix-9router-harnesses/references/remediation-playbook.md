# Remediation Playbook — 9Router & Harness Self-Healing

Tài liệu hướng dẫn quy trình tự phục hồi và khắc phục lỗi khi 9Router hoặc các harness gặp sự cố bare-429, pool locks, hoặc mất kết nối shim.

## 1. Cơ chế bare-429 và ag-prompt-shim

- **Vấn đề**: Google Antigravity kiểm duyệt nội dung `systemInstruction`. Các harness AI như `omp`, `pi`, `opencode`, `codex`, `claude` gửi system prompt mặc định sẽ bị Google nhận diện fingerprint và trả về mã lỗi 429 giả (`RESOURCE_EXHAUSTED` không có `details`).
- **Hậu quả**: 9Router hiểu nhầm tài khoản hết quota và tự động đặt `modelLock_*` (thời hạn 5-15 phút) lên tài khoản đó, sau đó chuyển trạng thái sang `unavailable`. Khi nhiều account bị khóa, pool sập và toàn bộ request bị 503 hoặc TIMEOUT.
- **Giải pháp**: `ag-prompt-shim` lắng nghe trên cổng `20129`:
  - Đọc 51 combos từ database `data.sqlite`.
  - Nhận diện các request gửi tới model `ag/*`, `antigravity/*` hoặc các combo name (`conductor`, `deliberate`, `courier`,...).
  - Chuyển `system` / `developer` message thành user turn đầu tiên trước khi chuyển tiếp tới 9Router cổng `20128`.
  - Giúp request lọt qua Google Antigravity hoàn toàn trơn tru mà không làm hỏng pool.

## 2. Các bước tự động của Skill

Khi người dùng chạy `fix-9router-harnesses`:
1. **Kiểm tra & Bật Shim**: Gửi ping tới `http://127.0.0.1:20129/health`. Nếu DOWN, tự động chạy lệnh nền `node.exe --experimental-sqlite ag-prompt-shim.mjs`.
2. **Khởi động cùng Windows**: Đảm bảo file `ag-prompt-shim.vbs` tồn tại trong thư mục Startup.
3. **Hiệu chỉnh Base URL**: Kiểm tra các file cấu hình `models.yml` (omp), `models.json` (pi), `opencode.json` (opencode), `config.toml` (codex), `settings.json` (claude). Nếu bất kỳ harness nào còn trỏ 20128, tự động tạo file `.bak` và đổi sang 20129.
4. **Dọn sạch Database Pool**: Truy cập `data.sqlite`, xóa bỏ mọi `modelLock_*` đã quá hạn hoặc kẹt, phục hồi `testStatus: active` và `backoffLevel: 0`.
5. **Chạy Live Probes**: Bắn 5 probe (có system prompt) kiểm chứng khả năng phục hồi thật qua cổng 20129.
6. **Cảnh báo PID cũ**: Quét danh sách tiến trình Windows đang chạy, thông báo các PID nào đang nạp config cũ cần restart.

## 3. Lệnh thủ công dự phòng

Nếu muốn chạy trực tiếp bằng terminal:
```bash
node --experimental-sqlite ~/.omp/agent/skills/fix-9router-harnesses/scripts/fix.js
```
Hoặc với cờ tùy chọn:
```bash
# Xem trước các thay đổi mà không ghi file/database:
node --experimental-sqlite ~/.omp/agent/skills/fix-9router-harnesses/scripts/fix.js --dry-run

# Chạy và xuất kết quả định dạng JSON:
node --experimental-sqlite ~/.omp/agent/skills/fix-9router-harnesses/scripts/fix.js --json
```
