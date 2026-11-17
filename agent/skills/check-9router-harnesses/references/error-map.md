# Error map — đọc lỗi 9router / Antigravity

Bản đồ này đối chiếu thông báo lỗi với nguyên nhân thật và hành động. Tham chiếu upstream: `decolua/9router#5703` (bản JS, nguồn) và `luqman-v1/9router-go#1181` (bản port Go, chưa parity).

## Bảng ánh xạ

| Thông báo | Nguyên nhân | Hành động | PR liên quan |
|---|---|---|---|
| `429 {"message":"Resource has been exhausted (e.g. check quota).","status":"RESOURCE_EXHAUSTED"}` **không có `details`** | Antigravity fingerprint `systemInstruction`; không phải quota | Dời system prompt sang user turn (shim) hoặc chờ bản vá; không retry, không refresh quota | 5703 commit 2 + 6 |
| `429` có `ErrorInfo`/`RetryInfo`, "Individual quota reached", "Resets in …" | Quota thật | Chờ reset hoặc xoay account; giữ nguyên hành vi cũ | 5703 chỉ phân biệt, không đổi |
| `503 [model] [429] … (reset after Ns)` | 9router không còn connection khả dụng; các account đã bị `modelLock_*` bởi bare-429 | Cắt nguồn 429 trước (shim), chờ lock hết hạn | 5703 bỏ account-lock cho bare-429 |
| `503 [model] [404] … (reset after Ns)` | 9router ghép **`lastError` cũ của account** vào thông báo pool; 404 thật thường thuộc model khác | Kiểm tra `requestDetails` xem 404 thật thuộc model nào; bỏ id đó khỏi config/combo | Không PR nào xử lý; 5703 chỉ đăng ký id theo catalog |
| `503 [model] Unavailable (reset after 10m)` | Connection ở `testStatus:"unavailable"` + backoff | Chờ lock hết hạn; request thành công đầu tiên tự reset `testStatus`/`backoffLevel` | 9router tự hồi |
| `404 Requested entity was not found` (không bọc 503) | Account không phục vụ model đó | Dùng id mà pool phục vụ; tắt account không phục vụ | 5703: id lấy từ `fetchAvailableModels` |
| `401`/`403` | Key sai/tắt, hoặc account bị TOS | Sửa key; account 403 giữ tắt | — |
| `[Empty streaming response]` trong request detail | Stream không có content, không phải lỗi cấu hình | Bỏ qua | — |

## Vì sao 503 hiển thị 404 cho model chưa từng 404

`providerConnections.data.lastError` lưu lỗi gần nhất của **account**. Khi 9router trả 503 cho một model khác, nó in `[model được yêu cầu] [<lastError>]`. Vì thế có thể thấy `[gemini-3.8-flash] [404]` dù DB không có lần 404 nào cho 3.8-flash. Luôn đối chiếu `requestDetails` trước khi kết luận model sai.

## Shim thay đổi gì

`ag-prompt-shim` (cổng 20129) chuyển system prompt thành user turn trước khi tới 9router:

- `/v1/chat/completions`: `system`/`developer` message → user message đầu tiên.
- `/v1/messages`: `system` top-level → text block đầu tiên của user.
- `/v1/responses`: `instructions` → `input_text` đầu tiên của user.
- Match model: `^(antigravity/|ag/)` **hoặc** tên combo đọc từ bảng `combos` (cần `--experimental-sqlite`).
- Request của provider khác (`chib/...`) đi qua nguyên vẹn.

Đánh đổi: system text mất quyền ưu tiên so với chỉ dẫn hệ thống; chỉ dùng cho client một người dùng. Đây là workaround, không phải bản vá.

## Vì sao probe không gửi system trên lane trực tiếp

Antigravity chỉ trả bare-429 khi `systemInstruction` chứa văn bản bị fingerprint. Probe **không system** trên 20128 không tạo 429 và không tạo lock; probe **có system** chỉ chạy trên 20129 (shim đã rewrite). Nhờ vậy audit không làm pool xấu thêm.

## Trạng thái 0.5.119

Bản đang chạy **không có** bất kỳ phần nào của 5703: không classifier, không `MoveSystemInstructionToContents`, không rewrite Hermes/OpenClaw mới, không Hydrogen. Vì vậy shim là biện pháp duy nhất không cần nâng cấp/restart 9router.
