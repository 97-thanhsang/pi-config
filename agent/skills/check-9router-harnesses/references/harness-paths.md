# Harness paths and fields

Tất cả đường dẫn dưới đây đã được kiểm chứng trên máy này (2026-11-17).

| Harness | Config | Field base URL | Key | API kind | Restart để nạp config |
|---|---|---|---|---|---|
| omp | `~/.omp/agent/models.yml` | `providers.9router.baseUrl` | `apiKey` (inline) | `api: openai-completions` | restart process `omp.exe` |
| pi | `~/.pi/agent/models.json` | `providers["9router"].baseUrl` | `apiKey` | `openai-completions` | restart `pi-coding-agent` |
| opencode | `~/.config/opencode/opencode.json` | `providers["9router"].settings.baseURL` | `{file:.secrets/9router-api-key.txt}` | `aisdk:@ai-sdk/openai-compatible` | restart `opencode.exe` |
| codex | `~/.codex/config.toml` | `[model_providers.9router] base_url` | `http_headers.Authorization` | `wire_api = "responses"` | restart `codex.exe` |
| cl​aude | `~/.cl​aude/settings.json` | `env.AN​THROPIC_BASE_URL` | `env.AN​THROPIC_API_KEY` | Anthropic Messages | restart `cl​aude` session |
| gemini | `~/.gemini/settings.json` | không có base URL | — | — | không đi qua 9router |

## Quy ước

- **Base URL 20129** = đi qua `ag-prompt-shim` rồi mới tới 20128. Dùng cho mọi harness có gửi system prompt và có thể chạm Antigravity.
- **Base URL 20128** = đi thẳng. Chỉ an toàn nếu model không bao giờ expand sang `ag/...`.
- **Cl​aude** dùng base URL không có `/v1`; Claude Code tự thêm `/v1/messages`.
- **Codex** dùng `/v1/responses` với trường `instructions`; shim chuyển `instructions` thành `input_text` của user đầu tiên.
- **opencode** resolve key từ file; script đọc file đó và đối chiếu bảng `apiKeys`.
- **omp/pi** gửi tên combo (`deliberate`, `conductor`, `courier`), không phải id `ag/...`. Shim đọc bảng `combos` để match; nếu thiếu `--experimental-sqlite`, `combos=0` và combo không được rewrite.

## Combo → Antigravity

Chuỗi điển hình trong DB:

```
conductor → tier-orchestration → pool-gemini-3.8-flash → ag/gemini-3.8-flash-*
courier   → tier-throughput   → pool-gemini-3.8-flash → ag/gemini-3.8-flash-*
deliberate→ tier-reasoning    → pool-glm-5.3 → pool-gemini-3.8-flash-high → ...
```

Vì vậy "model là combo" vẫn là rủi ro 429 nếu lane là 20128.

## Process matcher (stale config)

`assets/harness-map.json` dùng chuỗi con trong command line:

| Harness | Chuỗi |
|---|---|
| omp | `omp.exe` |
| pi | `pi-coding-agent` |
| opencode | `opencode.exe` |
| codex | `codex.exe` |
| cl​aude | `cl​aude.exe` |

Nếu config có mtime mới hơn thời điểm process khởi động, script báo WARN kèm PID — nghĩa là process đó vẫn dùng config cũ trong RAM.

## DB dùng cho audit (read-only)

| Bảng | Dùng để |
|---|---|
| `apiKeys` | key có tồn tại/đang bật |
| `combos` | phân biệt combo name với model id |
| `providerConnections` | account Antigravity: `isActive`, `testStatus`, `backoffLevel`, `modelLock_*`, `lastError` |
| `requestDetails` | lỗi 24h: 429 bare, 404, 503 |

`modelLock_<model>` là **lockedUntil** (ISO); còn hạn khi `new Date(v) > now`. Khi mọi lock hết hạn, request kế tiếp tự đặt `testStatus:"active"` và `backoffLevel:0`.
