---
name: check-9router-pool
description: "Kiểm tra sức khỏe toàn bộ account Google Antigravity trong 9router local (data.sqlite). Phân loại chính xác: OK (200), QUOTA (429 - cạn quota ngày), TOS_BAN (403 - Google khóa ToS), NO_MODEL (404), RATE (429 phút). Xuất bảng hướng dẫn chi tiết account nào CẦN BẬT (ON) và account nào CẦN TẮT (OFF) trên Dashboard 9router. Sử dụng khi user nói: 'check 9router', 'kiểm tra pool antigravity', 'tại sao bị 503', 'check account 9router'."
---

# 9router Antigravity Pool Checker

Skill chuẩn dành cho harness Pi, đọc database SQLite cục bộ của 9router ở chế độ Read-Only và thực hiện live probe đến Google Antigravity API (`daily-cloudcode-pa.googleapis.com`).

## Cách chạy

Khi người dùng yêu cầu kiểm tra, chạy script tương đối từ thư mục skill:

```bash
node --experimental-sqlite scripts/check.js
```

### Các cờ hỗ trợ:
- `--no-ping`: Chỉ đọc thông tin đã lưu trong database, không gửi request kiểm tra lên Google (không tốn quota).
- `--model <tên_model>`: Thử nghiệm với model cụ thể (mặc định: `gemini-3.8-flash-high`).
- `--json`: Xuất định dạng JSON thô.

## Định dạng hiển thị kết quả cho người dùng

Khi script chạy xong, trình bày lại thông tin cho người dùng theo 3 mục rõ ràng:

1. **BẢNG DANH SÁCH BẬT / TẮT TRÊN DASHBOARD (`http://localhost:20128/dashboard/providers/antigravity`):**
   - **❌ CẦN TẮT (OFF):** Các account đang `[BẬT]` nhưng bị `TOS_BAN` (403) hoặc lỗi xác thực. Nêu rõ đây là nguyên nhân trực tiếp gây lỗi 503 tổng hợp.
   - **✅ NÊN BẬT (ON):** Các account đang `[tắt]` nhưng test trả về `OK` (200).
   - **⏳ GIỮ NGUYÊN (OFF):** Các account bị `QUOTA` (429) và hiển thị thời gian reset dự kiến (theo giờ VN).

2. **CẢNH BÁO SỐ THỨ TỰ `#N`:**
   - Hướng dẫn người dùng nhìn vào số `#N` trên Dashboard để tránh bật/tắt nhầm các email có đuôi ký tự giống nhau (ví dụ: chuỗi email `anhsang317977...`).

3. **TÀI LIỆU THAM KHẢO:**
   - Xem thêm quy tắc và mã lỗi tại `references/error-codes.md`.
