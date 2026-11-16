# Root Cause Tracing

## Overview

Bugs thường lộ ra ở nơi xa nguồn gốc. Triệu chứng ở function sâu trong call stack; nguyên nhân ở tầng cao hơn điều khiển nó.

**Nguyên tắc cốt lõi:** Truy ngược qua call chain tới trigger gốc, rồi fix tại nguồn.

## When to Use

- Error xuất hiện ở nơi khó truy vết (deep call stack).
- Không rõ dữ liệu xấu bắt nguồn từ đâu.
- Cần tìm code gọi function lỗi.
- Symptom có vẻ xa rời nguyên nhân thật.

## The Tracing Process

### 1. Observe the Symptom
```
Error: git init failed in /Users/jesse/project/packages/core
```

### 2. Find Immediate Cause
Code nào trực tiếp gây lỗi?
```typescript
await execFileAsync('git', ['init'], { cwd: projectDir });
```

### 3. Ask: What Called This?
```typescript
WorktreeManager.createSessionWorktree(projectDir, sessionId)
  → called by Session.initializeWorkspace()
  → called by Session.create()
  → called by Project.create()
  → called by test
```

### 4. Keep Tracing Up
Giá trị nào được truyền vào? `projectDir = ''` (rỗng!). Nhưng ở tầng cao nhất nó là `process.cwd()` — một giá trị hợp lệ.
**Giá trị hợp lệ ở source trở thành rỗng trong test.**

### 5. Find Original Trigger
Test setup chạy trong `packages/core`, `process.cwd()` trả về cái gì đó khác. Chuỗi: test → Project.create() → Session.create() → WorktreeManager → git init — mỗi tầng truyền `projectDir`, nhưng tầng nào đó làm rỗng nó.

## Adding Stack Traces

Khi không trace được bằng mắt, thêm stack trace tạm ở điểm lỗi:

```typescript
async function gitInit(directory: string) {
  const stack = new Error().stack;
  console.error('DEBUG git init:', { directory, cwd: process.cwd(), stack });
  await execFileAsync('git', ['init'], { cwd: directory });
}
```

**Dùng `console.error()` trong test** (để không bị nuốt). Chạy test, quan sát stack, xác định code path tới điểm lỗi.

## Finding Which Test Causes Pollution

Nếu một test gây nhiễm bẩn cho test khác, bisect thủ công:

```bash
# Chạy từng test cùng nhóm để tìm thủ phạm
for test in $(ls tests/*.test.ts); do
  npx vitest run "$test" other-tests/*.test.ts
  # soi test nào fail
done
```

## Key Principle

```
NEVER fix just where the error appears.
Trace backward through the call chain until you find the original trigger,
then fix at the source.
```
