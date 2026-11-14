# Antigravity Error Codes Reference

Bảng tra cứu các mã phản hồi từ Google Antigravity upstream (`daily-cloudcode-pa.googleapis.com`):

| HTTP Status | Reason / Error Message | Ý nghĩa kỹ thuật | Hành động trong 9router |
|---|---|---|---|
| **200 OK** | - | Tài khoản bình thường, token hợp lệ, quota sẵn sàng. | **BẬT (ON)** để tham gia round-robin. |
| **403 Forbidden** | `TOS_VIOLATION` | Google đã vô hiệu hóa dịch vụ Antigravity trên account do vi phạm Điều khoản dịch vụ (phát hiện farm/bot). | **TẮT (OFF) & XÓA KHỎI POOL**. Không thể tự hồi phục. |
| **429 Too Many Requests** | `QUOTA_EXHAUSTED` | Cạn hạn mức token/request theo ngày của tài khoản. Google có trả kèm `quotaResetDelay`. | **TẮT TẠM THỜI (OFF)**. Chờ đến đúng giờ reset của ngày hôm sau rồi bật lại. |
| **429 Too Many Requests** | `Resource has been exhausted (e.g. check quota)` | Chạm trần Token-Per-Minute (TPM) hoặc Request-Per-Minute (RPM). Quota ngày vẫn còn. | **NGHỈ 2-5 PHÚT**. Tự động thông sau khi hết cửa sổ trượt 1 phút. |
| **503 / 529** | `MODEL_CAPACITY_EXHAUSTED` | Cụm máy chủ GPU của Google đang quá tải phần cứng tại khu vực/thời điểm đó. | Giữ nguyên, 9router sẽ tự động thử lại sau vài giây hoặc chuyển account. |
| **404 Not Found** | `Requested entity was not found` | Tài khoản (free tier) không có quyền gọi model chỉ định (ví dụ gọi `claude-sonnet-5-5-high` hoặc `gemini-4-argon`). | Đổi model gọi sang `gemini-3.8-flash-high`. |
| **503 (Cục bộ 9router)** | `all N accounts locked` | **Lỗi do 9router tự phát sinh**, xảy ra khi tất cả các account đang BẬT đều bị lỗi (403/429), không còn ai gánh tải. | Tắt các account chết và bật các account còn sống lại. |
