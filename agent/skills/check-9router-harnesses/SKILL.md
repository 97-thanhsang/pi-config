---
name: check-9router-harnesses
description: "Kiểm tra toàn bộ harness đang dùng 9router (omp, pi, opencode, codex, cl​aude, gemini): cấu hình base URL/API key, model/combo, khả năng kết nối thật, và rủi ro system prompt bị Antigravity trả 429 giả. Dùng khi user nói: 'check harness', 'kiểm tra 9router client', 'tại sao harness lỗi 503', 'audit toàn bộ harness', 'sau khi đổi 20129'."
---

# check-9router-harnesses

Audit read-only cho **phía client** của 9router. Bổ sung cho command `9router-audit` (command đó lo pool/model/combo và matrix ở phía 9router).

## Chạy

```bash
node --experimental-sqlite ~/.pi/agent/skills/check-9router-harnesses/scripts/check.js
```

Cờ:

| Cờ | Ý nghĩa |
|---|---|
| `--no-probe` | Chỉ phân tích tĩnh, không gửi request |
| `--json` | Xuất JSON |
| `--harness=<id>` | Chỉ một harness (`omp`, `pi`, `opencode`, `codex`, `cl​aude`, `gemini`) |
| `--max-probes=N` | Giới hạn số probe (mặc định 12) |
| `--timeout=MS` | Timeout mỗi probe (mặc định 20000) |

Bắt buộc `--experimental-sqlite` để đọc DB 9router (`apiKeys`, `combos`, `providerConnections`, `requestDetails`). Không có cờ này script vẫn chạy nhưng bỏ qua các check DB.

## Sáu pha kiểm tra

1. **Runtime**: health 20128 và 20129; shim trả `combos`/`rewrites`; dòng cuối `shim.log`.
2. **DB read-only**: key active, danh sách combo, account Antigravity (active, `testStatus`, `backoffLevel`, lock còn hạn), bare-429 và 404 trong 24h.
3. **Discovery**: đọc manifest `assets/harness-map.json`, parse từng config; harness không trỏ 9router hiện `N/A`.
4. **Static**: port đích (20128 trực tiếp / 20129 shim), key resolve (`{file:...}`), key có trong DB, API kind (`openai-completions`, `responses`, `an​thropic`), model có phải combo hoặc id `ag/`, config mới hơn process đang chạy.
5. **Probe**: mỗi target một request 4 token **không system** (an toàn, không tạo lock); target 20129 thêm một probe **có system** để xác nhận shim rewrite. Target 20128 **không bao giờ** gửi system — thay vào đó đọc lịch sử DB.
6. **Đối chiếu**: `9router-matrix.md`, Startup folder cho shim.

## Đọc kết quả

- `FAIL`: cấu hình sai hoặc shim/9router chết — sửa ngay. Exit code 1.
- `WARN`: môi trường/pool đang xấu (lock, `unavailable`, process cũ, thiếu Startup) — không sai cấu hình.
- `INFO`: harness không dùng 9router, hoặc matrix doc lệch.

Cột `Risk`:
- `ag-direct`: model gửi thẳng id `ag/...` hoặc `antigravity/...`.
- `combo->ag may`: model là tên combo; combo có thể expand sang Antigravity tuỳ tier.
- `-`: không liên quan Antigravity.

Cột `Probe`:
- `OK`, `OK+sys`: 200 không system / 200 cả khi có system (chỉ với shim).
- `BARE_429`: 429 không `details` — system prompt bị fingerprint (xem `references/error-map.md`).
- `POOL_429`/`POOL_404`: 503 của 9router bọc lỗi pool; không phải lỗi model của client.
- `NO_MODEL`: 404, id không được account phục vụ.
- `AUTH`: 401/403.
- `TIMEOUT`: quá `--timeout`.

## An toàn

- Chỉ đọc: không sửa config, không ghi DB, không restart process nào.
- Probe không system trên lane trực tiếp không tạo bare-429/lock. Probe system chỉ chạy trên 20129 (shim đã rewrite).
- Tuyệt đối không dừng 20128; shim chạy độc lập trên 20129.

## Bảo trì

- Thêm harness mới: sửa `assets/harness-map.json` (id, kind, config, process, systemPrompt). Parser mới thêm vào `PARSERS` trong `scripts/check.js`.
- Shim phải chạy với `--experimental-sqlite` để nạp 51 combo; nếu `combos=0`, combo name không được rewrite và audit sẽ FAIL.
- Skill này không thay thế bản vá upstream. Xem `references/error-map.md` để biết ánh xạ với `decolua/9router#5703` và `luqman-v1/9router-go#1181`.

## Tham chiếu

- `references/harness-paths.md` — đường dẫn, field, kiểu API, cách restart từng harness.
- `references/error-map.md` — 429/404/503/401 và việc shim thay đổi gì.
