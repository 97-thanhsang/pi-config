# Defense-in-Depth Validation

## Overview

Khi một bug do dữ liệu không hợp lệ gây ra, fix tối thiểu là thêm validation ở nơi lỗi xảy ra. Nhưng điều đó chỉ bắt MỘT code path. Defense-in-depth thêm validation ở MỌI tầng mà dữ liệu đi qua.

**Nguyên tắc cốt lõi:** Validate ở MỌI tầng data đi qua. Make the bug structurally impossible.

## When to Use

- Bug do dữ liệu xấu (null, undefined, rỗng, sai kiểu) gây ra.
- Sau khi đã tìm được root cause (dùng root-cause-tracing).
- Function được gọi từ nhiều entry point.
- Cần đảm bảo bug không thể tái xuất qua đường khác.

## The Four Layers

### Layer 1: Entry Point Validation
Reject dữ liệu không hợp lệ ngay khi vào system — API, command handler, public function.

```typescript
function createProject(name: string, workingDirectory: string) {
  if (!workingDirectory || workingDirectory.trim() === '') {
    throw new Error('workingDirectory cannot be empty');
  }
  if (!existsSync(workingDirectory)) {
    throw new Error(`workingDirectory does not exist: ${workingDirectory}`);
  }
  if (!statSync(workingDirectory).isDirectory()) {
    throw new Error(`workingDirectory is not a directory: ${workingDirectory}`);
  }
  // proceed
}
```

### Layer 2: Business Logic Validation
Đảm bảo dữ liệu hợp lệ cho nghiệp vụ cụ thể — invariant phải đúng.

```typescript
function initializeWorkspace(projectDir: string, sessionId: string) {
  if (!projectDir) throw new Error('projectDir required for workspace initialization');
  // proceed
}
```

### Layer 3: Environment Guards
Chặn thao tác nguy hiểm trong context cụ thể.

```typescript
async function gitInit(directory: string) {
  // Trong test, từ chối chạy ở thư mục ngoài temp
  if (process.env.NODE_ENV === 'test') {
    const normalized = normalize(resolve(directory));
    const tmpDir = normalize(resolve(tmpdir()));
    if (!normalized.startsWith(tmpDir)) {
      throw new Error(`Refusing git init outside temp dir during tests: ${directory}`);
    }
  }
  // proceed
}
```

### Layer 4: Debug Instrumentation
Ghi lại context để truy vết nếu bug tái xuất.

```typescript
async function gitInit(directory: string) {
  const stack = new Error().stack;
  logger.debug('About to git init', { directory, cwd: process.cwd(), stack });
  // proceed
}
```

## Applying the Pattern

Khi tìm ra root cause:
1. Trace data flow tới nguồn (root-cause-tracing).
2. Liệt kê MỌI điểm data đi qua.
3. Thêm validation ở MỖI tầng.
4. Test từng tầng độc lập (test tầng 1 fail → đảm bảo tầng 1 chặn; test tầng 2 fail → tầng 2 chặn...).

## Key Insight

Chỉ validate ở điểm lỗi = fix cho MỘT code path. Một entry point khác có thể bỏ qua cùng validation đó. Validation nhiều tầng biến bug từ "đã fix" thành "không thể xảy ra".
