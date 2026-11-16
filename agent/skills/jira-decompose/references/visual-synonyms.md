---
name: visual-synonyms-v4
description: Vietnamese <-> English synonym map for UI term matching in Process 4 (match-visuals). Used to expand image textContent with equivalent terms before computing slice-match scores.
type: reference
version: 4.0.0
---

# Visual Synonym Map — jira-decompose-v4

Each key is a Vietnamese UI term. The array contains English equivalents and Vietnamese variants.
Used by `processes/4-match-visuals.md` to expand `image.textContent` before matching.

## CRUD Operations

| Vietnamese Key        | Synonyms (EN + VI variants)                          |
| --------------------- | ---------------------------------------------------- |
| `danh sách`           | `list`, `grid`, `table`, `bảng`, `danh muc`, `ds`   |
| `thêm mới`            | `create`, `add`, `new`, `tạo mới`, `them moi`, `insert` |
| `chỉnh sửa`           | `edit`, `update`, `modify`, `sửa`, `chin sua`, `change` |
| `xóa`                 | `delete`, `remove`, `xoá`, `del`, `discard`          |
| `tìm kiếm`            | `search`, `filter`, `tìm`, `tim kiem`, `lookup`, `query` |
| `chi tiết`            | `detail`, `view`, `info`, `thông tin`, `chi tiet`, `information`, `xem chi tiet`, `chi-tiet` |
| `tải về`              | `download`, `tai ve`, `tai-ve`, `export file`, `save file`, `download file` |
| `xuất`                | `export`, `xuat`, `xuat file`, `export excel`, `tai xuong`, `download report` |
| `phân trang`          | `pagination`, `paging`, `trang`, `page`, `phan trang` |
| `nhập liệu`           | `form`, `input`, `form input`, `nhap lieu`, `entry`  |
| `lưu`                 | `save`, `submit`, `luu`, `confirm`, `apply`          |
| `hủy`                 | `cancel`, `abort`, `huy`, `close`, `back`            |
| `xuất`                | `export`, `download`, `xuat`, `tải về`, `tai ve`     |
| `nhập`                | `import`, `upload`, `nhap`, `tải lên`, `tai len`     |

## UI Components

| Vietnamese Key        | Synonyms (EN + VI variants)                          |
| --------------------- | ---------------------------------------------------- |
| `nút`                 | `button`, `btn`, `nut`, `click`                      |
| `ô nhập`              | `textbox`, `input`, `field`, `o nhap`, `text field`  |
| `hộp chọn`            | `dropdown`, `select`, `combobox`, `hop chon`, `combo` |
| `ngày`                | `date`, `datepicker`, `ngay`, `calendar`, `date picker` |
| `trạng thái`          | `status`, `badge`, `trang thai`, `state`, `indicator` |
| `hành động`           | `action`, `thao tac`, `actions`, `operations`        |
| `mã`                  | `code`, `ma`, `id`, `identifier`, `key`              |
| `tên`                 | `name`, `ten`, `label`, `title`                      |
| `mô tả`               | `description`, `mo ta`, `note`, `ghi chú`, `notes`   |
| `loại`                | `type`, `category`, `loai`, `kind`, `classification` |
| `nhóm`                | `group`, `nhom`, `category`, `folder`                |
| `bảng`                | `table`, `grid`, `bang`, `data-table`, `danh-sach`, `list` |
| `biểu đồ`             | `chart`, `graph`, `bieu do`, `bieu-do`, `visualization`, `diagram` |
| `tab`                 | `tab`, `tabpanel`, `tab-panel`, `section-tab`, `panel` |

## Common Labels

| Vietnamese Key        | Synonyms (EN + VI variants)                          |
| --------------------- | ---------------------------------------------------- |
| `tổng`                | `total`, `sum`, `tong`, `aggregate`                  |
| `số lượng`            | `quantity`, `count`, `so luong`, `amount`, `number`  |
| `ngày tạo`            | `created date`, `ngay tao`, `created at`, `created_on` |
| `ngày cập nhật`       | `updated date`, `ngay cap nhat`, `modified`, `last modified` |
| `người tạo`           | `created by`, `nguoi tao`, `author`, `creator`       |
| `ghi chú`             | `notes`, `remark`, `ghi chu`, `comment`, `description` |
| `áp dụng`             | `apply`, `ap dung`, `execute`, `run`                 |
| `làm mới`             | `refresh`, `reload`, `lam moi`, `reset`              |
| `in`                  | `print`, `in ấn`, `print preview`                    |
| `gửi`                 | `send`, `gui`, `submit`, `dispatch`                  |

## EMS Finance Domain Terms

Terms specific to the EMS Finance / EMSPRO2 project. Auto-applied when `projectKey.startsWith("EMSPRO")`.

| Vietnamese Key        | Synonyms (EN + VI variants)                                                    |
| --------------------- | ------------------------------------------------------------------------------ |
| `học phí`             | `tuition`, `fee`, `hoc phi`, `hoc-phi`, `phi hoc`, `payment`, `thu phi`       |
| `học kỳ`              | `semester`, `term`, `period`, `hoc ky`, `hoc-ky`, `ky hoc`                    |
| `sinh viên`           | `student`, `sv`, `sinh vien`, `sinh-vien`, `learner`, `ma sv`                 |
| `kết quả`             | `result`, `score`, `grade`, `diem`, `ket qua`, `ket-qua`, `bang diem`         |
| `môn học`             | `course`, `subject`, `hoc phan`, `mon hoc`, `mon-hoc`, `mh`, `ma mon`         |
| `lớp học`             | `class`, `group`, `lop hoc`, `lop-hoc`, `ma lop`                              |
| `giáo viên`           | `teacher`, `lecturer`, `gv`, `instructor`, `giao vien`, `giao-vien`           |
| `học bổng`            | `scholarship`, `hoc bong`, `hoc-bong`, `grant`                                |
| `công nợ`             | `debt`, `balance`, `cong no`, `cong-no`, `outstanding`                        |
| `thu chi`             | `income`, `expense`, `revenue`, `thu-chi`, `finance`                          |

---

## Usage

```javascript
// Load this file, build a flat lookup:
const SYNONYM_MAP = {
  'danh sách': ['list', 'grid', 'table', 'bảng', 'danh muc', 'ds'],
  'thêm mới': ['create', 'add', 'new', 'tạo mới', 'them moi', 'insert'],
  // ... all entries above
};

// Expand image textContent with synonyms:
function expandWithSynonyms(textArray, synonymMap) {
  const expanded = new Set(textArray.map(t => t.toLowerCase().trim()));
  for (const text of expanded) {
    for (const [key, synonyms] of Object.entries(synonymMap)) {
      if (text.includes(key) || synonyms.some(s => text.includes(s))) {
        expanded.add(key);
        synonyms.forEach(s => expanded.add(s));
      }
    }
  }
  return Array.from(expanded);
}
```
