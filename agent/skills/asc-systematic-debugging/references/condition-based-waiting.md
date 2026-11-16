# Condition-Based Waiting

## Overview

Flaky test thường do timeout đoán mò — chờ một khoảng thời gian cố định rồi hy vọng điều kiện đã xong.

**Nguyên tắc cốt lõi:** Chờ ĐÚNG điều kiện bạn quan tâm, không đoán thời gian nó mất bao lâu.

## When to Use

- Test pass/fail không nhất quán (flaky).
- Test dùng `setTimeout`, `sleep`, hoặc timeout cố định.
- Test chờ async operation (network, xử lý file, animation).
- Test fail khi CI chậm nhưng pass khi chạy local.

## The Problem

```typescript
// ❌ SAI: Đoán thời gian
test('waits for processing', async () => {
  startProcessing();
  await new Promise(resolve => setTimeout(resolve, 5000));
  expect(isComplete()).toBe(true);
});
```

5s đủ nhanh trên máy dev, nhưng CI chậm hơn → fail. Hoặc xử lý xong sau 100ms → lãng phí 4.9s.

## The Solution: Poll for the Condition

```typescript
// ✅ ĐÚNG: Chờ điều kiện thực
async function waitFor(
  condition: () => boolean,
  description: string,
  timeoutMs = 5000
): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timeout waiting for: ${description}`);
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

test('waits for processing', async () => {
  startProcessing();
  await waitFor(() => isComplete(), 'processing to complete');
  expect(isComplete()).toBe(true);
});
```

## Scenario Table

| Scenario | SAI | ĐÚNG |
|---|---|---|
| Chờ element xuất hiện | `await sleep(1000)` | `await waitFor(() => screen.getByText('Done'))` |
| Chờ API response | `await sleep(2000)` | `await waitFor(() => state.data !== undefined)` |
| Chờ file ghi xong | `await sleep(500)` | `await waitFor(() => fileExists(path))` |
| Chờ animation | `await sleep(300)` | `await waitFor(() => element.style.opacity === '1')` |

## When an Arbitrary Timeout IS Correct

Chỉ hợp lệ khi CẢ HAI đúng:
1. Bạn đang chờ một trigger, không phải chờ kết quả (ví dụ: chờ debounce bắt đầu, không phải chờ nó xong).
2. Timeout dựa trên timing ĐÃ BIẾT (ví dụ: debounce cấu hình 600ms → chờ 700ms).

```typescript
// Chấp nhận được: debounce đã biết 600ms, chỉ cần vượt nó để test gọi lại
await page.waitForTimeout(700);
```

## Key Insight

Timeout cố định mã hoá một giả định về tốc độ máy. Điều kiện thực loại bỏ giả định đó. Test nhanh nhất khi điều kiện đã xong, và không bao giờ flaky vì chậm máy.
