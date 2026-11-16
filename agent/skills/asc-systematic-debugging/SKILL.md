---
name: asc-systematic-debugging
description: Use when gặp bất kỳ bug, test failure, hành vi bất thường, build fail, hoặc performance regression — trước khi đề xuất bất kỳ fix nào. Điều tra root cause trước, symptom fix là thất bại.
compatibility: pi
---

# Systematic Debugging

## Overview

**Nguyên tắc cốt lõi:** LUÔN tìm root cause trước khi sửa. Fix triệu chứng là thất bại.
**Vi phạm chữ của quy trình là vi phạm tinh thần của debug.**

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

Nếu chưa hoàn thành Phase 1 (Root Cause Investigation), KHÔNG được đề xuất fix.

## When to Use

Mọi vấn đề kỹ thuật: test fail, bug production, hành vi bất thường, performance regression, build fail, integration fail.
Đặc biệt khi: đang gấp deadline; "chỉ một fix nhanh thôi"; đã thử nhiều fix; fix trước không ăn; chưa hiểu rõ nguyên nhân.

## When NOT to Use

- Typo hiển nhiên (sửa luôn, không cần điều tra).
- Câu hỏi thông tin thuần (không phải debug).

## The Four Phases

Hoàn thành từng phase trước khi sang phase sau.

### Phase 1 — Root Cause Investigation

TRƯỚC KHI ĐỀ XUẤT BẤT KỲ FIX NÀO:

0. **DỰNG FEEDBACK LOOP TRƯỚC TIÊN (kỹ năng cốt lõi).** Một tín hiệu pass/fail **tight** — ***đỏ*** đúng con bug này, deterministic, nhanh, agent-runnable — LÀ cả kỹ năng này; phần còn lại là cơ học. Không có loop, nhìn code bao lâu cũng vô ích. Dồn công sức vào đây.
   - Loop phải **đỏ được trên bug này** (không phải "không chắc"). Cách dựng: test fail, assert trực tiếp, HTTP call cô lập, CLI + fixture, headless browser, replay trace, harness tạm, bisect/trace, assert-only diff, property check.
   - Loop flaky → **tăng tỷ lệ reproduce** (chạy N lần, gom protocol/timing/topology) tới khi đỏ chắc chắn.
   - **Redact mọi secret trước:** thay bằng `<REDACTED>`; chỉ trích dòng mang tín hiệu.
   - **Tag mọi debug log** bằng prefix duy nhất (vd `[DEBUG-a4f2]`) → cleanup = một grep.
   - **Không dựng được loop / không có seam đúng → ĐÓ CHÍNH LÀ FINDING** (kiến trúc đang cản việc lock bug). Nêu ra.

1. **Đọc kỹ error message**: không lướt. Stack trace đầy đủ, line number, file, mã lỗi.
2. **Reproduce nhất quán**: tìm chuỗi thao tác lặp lại được lỗi. Không reproduce được → thu thập thêm dữ liệu, không đoán.
3. **Kiểm tra thay đổi gần đây**: git diff, commit gần nhất, dependency, config, môi trường.
4. **Multi-component system**: chèn instrumentation ở MỖI ranh giới component. Log dữ liệu vào component, log dữ liệu ra. Chạy 1 lần để thấy nó gãy ở tầng nào.
5. **Trace data flow**: bad value bắt nguồn từ đâu? Truy ngược call chain tới trigger gốc. Xem `references/root-cause-tracing.md`.
   **NEVER fix just where the error appears.** Sửa ở chỗ error hiện ra = che triệu chứng.

### Phase 2 — Pattern Analysis

1. Tìm code tương tự đang chạy ĐÚNG trong repo.
2. So sánh implementation đang lỗi với reference đang đúng.
3. Liệt kê MỌI khác biệt — dù nhỏ.
4. Hiểu dependency và giả định của code đang lỗi.

### Phase 3 — Hypothesis & Testing

1. Phát biểu 1 giả thuyết duy nhất: "Tôi nghĩ X là root cause vì Y."
2. Test giả thuyết bằng thay đổi TỐI THIỂU — đổi MỘT biến.
3. KHÔNG chồng nhiều fix cùng lúc.
4. Không biết → nói "tôi không hiểu X", không giả vờ.

### Phase 4 — Implementation

1. Viết test fail tái hiện bug (dùng `tdd-workflow`).
2. Fix đúng root cause — MỘT thay đổi. Không "tiện thể".
3. Verify bằng OMP Evidence Gate — chạy lệnh kiểm chứng tươi, quan sát output thực tế.
4. Nếu fix không ăn: đếm số lần thử.
   - < 3 lần → về Phase 1.
   - ≥ 3 lần → **DỪNG. Question architecture.** Nhiều fix thất bại = kiến trúc sai, không phải hypothesis sai.

### Phase 5 — Cleanup & Zero-Artifact Sweep (Matt Pocock Discipline)
1. **Quét sạch Debug Logs**: Chạy `rg "\[DEBUG-"` trên toàn bộ các file đã chạm. Xóa 100% các dòng log tạm thời trước khi bàn giao. Không để sót bất kỳ log probe nào lên production.
2. **Xóa Fixture / Throwaway code**: Dọn dẹp các đoạn code test tạm thời hoặc dữ liệu cứng chèn vào source.
3. **Kiểm định Diff sạch**: Kiểm tra `git diff` lần cuối — chỉ chứa duy nhất code fix root-cause và bài test hồi quy.

## Red Flags — DỪNG ngay, quay về Phase 1

- "Fixing nhanh rồi điều tra sau."
- "Đổi X xem sao" (thử mò).
- "Sửa nhiều thứ rồi chạy test xem còn lỗi không."
- Đề xuất giải pháp trước khi trace data flow.
- "Không hiểu rõ nhưng cứ thử."
- "One more fix" khi đã thử 2+ lần.
- Mỗi fix lộ ra bug mới ở chỗ khác.

## Supporting Techniques

- `references/root-cause-tracing.md` — truy ngược call chain tới trigger gốc; thêm stack trace tạm để định vị.
- `references/defense-in-depth.md` — sau khi tìm root cause, thêm validation nhiều tầng để make bug structurally impossible.
- `references/condition-based-waiting.md` — thay timeout đoán mò bằng polling theo điều kiện; fix flaky test.

## Integration với OMP

- Trước khi viết fix → Tự động nạp skill này.
- Phase 4 → Viết test fail (RED), fix root-cause tối thiểu (GREEN).
- Verify → OMP Evidence Gate (chạy test thực tế qua native `bash` hoặc `browser`).
- Review chéo → Dispatch subagent `reviewer` thẩm định tính đúng đắn trước khi giao nộp.
