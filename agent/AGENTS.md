# Universal Software Engineering Guidelines & Principles
> Áp dụng làm chuẩn cơ sở toàn cầu cho mọi ngôn ngữ, framework và dự án.

## 1. Core Engineering Mindset
- **Think Before Coding**: Xác định rõ giả định và trade-off trước khi viết code. Nếu yêu cầu có nhiều cách hiểu, hãy làm rõ trước khi triển khai.
- **Chesterton's Fence**: Không bao giờ xóa hoặc thay thế một đoạn code, hàm hoặc cấu hình phức tạp khi chưa hiểu rõ TẠI SAO người trước lại viết như vậy.
- **Hyrum's Law**: Mọi hành vi có thể quan sát được của một API/Interface đều sẽ có bên phụ thuộc vào nó. Luôn bảo toàn tính tương thích ngược của hợp đồng (API Contract).
- **Surgical Changes**: Phẫu thuật chính xác. Chỉ sửa đổi các dòng và file liên quan trực tiếp đến mục tiêu. Không tự tiện format lại, refactor hoặc "dọn dẹp" những phần code không thuộc phạm vi task.

## 2. Solution Ladder (Thang Giải Pháp Tối Giản)
Khi đề xuất giải pháp kỹ thuật, luôn đi từ nấc 1 đến nấc 5 để đạt được diff nhỏ nhất và dễ bảo trì nhất:
1. **Có cần tồn tại không? (YAGNI triệt để)**: Triệt tiêu code suy đoán, tính năng dự phòng không ai yêu cầu.
2. **Codebase đã có sẵn chưa?**: Tái sử dụng các module, utility, helper nội bộ đã có trong project.
3. **Nền tảng / Stdlib có giải quyết được không?**: Ưu tiên tính năng native của ngôn ngữ/runtime thay vì viết thêm code.
4. **Dependencies đã cài có giải quyết được không?**: Cấm tự tiện cài thêm thư viện/package bên ngoài cho những việc có thể xử lý trong vài dòng code.
5. **Giải pháp tối thiểu hoạt động được (Shortest working diff)**: Viết đúng và đủ code giải quyết bài toán. Không tạo abstraction cho mã dùng một lần (single-use).

## 3. Clean Code & Architectural Fundamentals
- **Bất biến (Immutability)**: Ưu tiên trả về cấu trúc dữ liệu mới thay vì mutate trực tiếp object cũ để tránh tác dụng phụ (side-effects) và race conditions.
- **Boundary Discipline (Kỷ luật ranh giới)**:
  - *Tại ranh giới (Controller, CLI, API Client, Form)*: Validate nghiêm ngặt, parse kiểu dữ liệu thô sang Domain Type, xử lý lỗi phòng thủ.
  - *Bên trong hệ thống (Core Services, Domain Logic)*: Tin tưởng dữ liệu đã được validate ở ranh giới. Không viết các kiểm tra null rải rác vô nghĩa.
- **Resource & Memory Management**: Mọi tài nguyên mở (Streams, Database connections, WebSockets, Event Listeners, Subscriptions) bắt buộc phải có cơ chế đóng/hủy tường minh khi hết vòng đời.
- **Package Management Mandate**: Bắt buộc dùng CLI package manager của ngôn ngữ (npm, pnpm, pip, cargo, dotnet, go get) để thêm/xóa thư viện. Không sửa tay file lock hoặc manifest để tránh lệch dependency graph.

## 4. Universal Code Quality Checklist
Trước khi đánh dấu công việc hoàn tất:
- [ ] Code rõ ràng, đặt tên phản ánh đúng ý niệm nghiệp vụ
- [ ] Hàm tập trung giải quyết 1 việc, tránh lồng sâu (> 4 cấp) bằng cách dùng Early Return
- [ ] Không có giá trị hardcode ma thuật (Magic numbers/strings)
- [ ] Không để lại file log rác, debug print hoặc comment vô nghĩa
- [ ] Đã chạy kiểm tra thực tế và có bằng chứng xác thực (Evidence Gate)

## 5. Diagram & Visualization Identity
- **Technical Architecture**: Sử dụng nền tối (Dark Slate `#020617`) + font Monospace cho sơ đồ luồng dữ liệu kỹ thuật và database ERD.
- **Markdown Text**: Sử dụng khối fenced code Mermaid chuẩn, không lạm dụng màu sắc sặc sỡ, tập trung vào tính mạch lạc của các node luồng.
