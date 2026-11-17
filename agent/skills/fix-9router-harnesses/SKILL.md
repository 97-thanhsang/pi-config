---
name: fix-9router-harnesses
description: "Tự động khắc phục toàn diện mọi sự cố liên quan đến 9Router và các harness kết nối (omp, pi, opencode, codex, claude): bật lại shim 20129, đổi base URL sang cổng 20129, đảm bảo Windows Startup, dọn sạch model locks/unavailable trong Antigravity pool, và kiểm chứng bằng live probes. Dùng khi user nói: 'fix 9router', 'khắc phục 9router', 'harness bị lỗi 503/429', 'sửa lỗi kết nối 9router', 'tự chữa lỗi harness', 'heal 9router'."
compatibility: opencode, omp, pi
---

# fix-9router-harnesses

Skill tự động chuẩn đoán, sửa chữa và phục hồi trạng thái hoạt động (Self-Healing & Remediation Engine) cho 9Router và toàn bộ các client harness (`omp`, `pi`, `opencode`, `codex`, `claude`).

## Khi nào sử dụng?

- Khi kết quả kiểm tra `check-9router-harnesses` báo `FAIL`, `WARN`, `TIMEOUT`, hoặc `shim 20129: DOWN`.
- Khi các agent gặp lỗi `503 [model] [429]`, `bare-429 RESOURCE_EXHAUSTED`, hoặc `Unavailable`.
- Khi máy tính vừa khởi động lại và các harness không kết nối được tới 9Router.
- Khi người dùng yêu cầu: *"fix 9router"*, *"khắc phục lỗi harness"*, *"sửa lỗi kết nối 9router"*, *"chữa lỗi 9router"*.

## Lệnh thực thi

Chạy script tự động với Node.js:

```bash
node --experimental-sqlite ~/.omp/agent/skills/fix-9router-harnesses/scripts/fix.js
```

*(Hoặc chạy từ `~/.config/opencode/skills/fix-9router-harnesses/scripts/fix.js` hoặc `~/.pi/agent/skills/...`).*

### Các cờ hỗ trợ:
| Cờ | Chức năng |
|---|---|
| `--dry-run` | Kiểm tra và lập danh sách các mục cần sửa nhưng không ghi file / DB |
| `--json` | Xuất toàn bộ báo cáo xử lý dưới dạng JSON |
| `--skip-pool` | Không can thiệp dọn dẹp model locks trong SQLite database |
| `--skip-probes` | Bỏ qua bước bắn request kiểm chứng sau khi hoàn tất sửa |

## 5 Bước Tự Động Phục Hồi

1. **Khởi động `ag-prompt-shim` (Cổng 20129)**:
   - Ping kiểm tra `http://127.0.0.1:20129/health`.
   - Nếu DOWN: Tự động khởi động `node.exe --experimental-sqlite ag-prompt-shim.mjs` chạy ngầm.
   - Chờ đến khi shim sẵn sàng và nạp đủ 51 combos.
2. **Đảm bảo tự khởi động cùng Windows**:
   - Kiểm tra `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\ag-prompt-shim.vbs`.
   - Nếu chưa có, tự động tạo file script VBScript chạy ngầm để đảm bảo sau khi reboot máy, shim vẫn tự động chạy.
3. **Hiệu chỉnh Base URL cho 5 Harness**:
   - Tự động sao lưu timestamped `.bak` trước khi sửa.
   - Cập nhật `omp` (`~/.omp/agent/models.yml`) $\rightarrow$ `http://127.0.0.1:20129/v1`
   - Cập nhật `pi` (`~/.pi/agent/models.json`) $\rightarrow$ `http://127.0.0.1:20129/v1`
   - Cập nhật `opencode` (`~/.config/opencode/opencode.json`) $\rightarrow$ `http://127.0.0.1:20129/v1`
   - Cập nhật `codex` (`~/.codex/config.toml`) $\rightarrow$ `http://127.0.0.1:20129/v1`
   - Cập nhật `claude` (`~/.claude/settings.json`) $\rightarrow$ `http://127.0.0.1:20129`
4. **Xoay Vòng & Giới Hạn 2-3 Tài Khoản An Toàn (Anti-Ban Pool Rotation)**:
   - Quét toàn bộ kết nối Antigravity trong database `%APPDATA%\9router\db\data.sqlite`.
   - Xóa bỏ các `modelLock_*` đã quá hạn.
   - **Cơ chế giới hạn trần an toàn**: Luôn duy trì **chính xác 2 đến 3 tài khoản ở trạng thái `isActive: 1`** để tránh bị Google Antigravity quét chùm (correlated ban/flagging).
   - **Xoay vòng thông minh (Smart Rotation)**: Nếu tài khoản đang active bị dính lock quota, script tự động tắt (`isActive: 0`) cho account đó nghỉ ngơi, đồng thời kích hoạt một account dự phòng khỏe mạnh (`testStatus: active`, 0 lock) lên thay thế.
   - Đưa các account vượt quá giới hạn 3 về trạng thái nghỉ (`isActive: 0`).
5. **Nghiệm thu Evidence Gate & Cảnh báo Stale Processes**:
   - Bắn 5 live probes (kèm system prompt) qua shim để kiểm chứng thực tế (`OK+sys`).
   - Kiểm tra các tiến trình đang chạy và liệt kê PID cần restart nếu khởi động trước thời điểm sửa config.

## Nguyên tắc An Toàn
- Luôn tạo file backup `.bak-<timestamp>` trước khi sửa bất kỳ file config nào.
- Chỉ can thiệp database 9router bằng SQLite native transactions, không làm hỏng schema.
- Tuyệt đối không tự ý ngắt (kill) tiến trình của người dùng; chỉ đưa ra cảnh báo PID để người dùng chủ động khởi động lại.
