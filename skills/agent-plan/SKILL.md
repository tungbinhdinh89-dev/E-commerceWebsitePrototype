---
name: agent-plan
description: "Create codebase-grounded implementation plans when the user asks for task scoping, planning, or comparing approaches before changes. Planning alone does not authorize implementation."
license: MIT
---

# Lập kế hoạch từ bằng chứng

Biến yêu cầu thành phạm vi, giải pháp tối thiểu và tiêu chí hoàn thành có thể kiểm tra. Áp dụng bốn nguyên tắc Karpathy: làm rõ trước, ưu tiên đơn giản, sửa đúng phạm vi và kiểm chứng kết quả.

## Đọc ngữ cảnh đủ để quyết định

- Đọc chỉ dẫn dự án có liên quan. Tìm điểm vào, code đang thực hiện hành vi và cách kiểm tra hiện có; mở rộng tìm kiếm theo bằng chứng.
- Phân biệt điều đã thấy trong file với điều suy đoán. Trích đường dẫn khi một quyết định phụ thuộc vào cấu trúc hiện tại.
- Tra nguồn sẵn có trước khi hỏi thông tin người dùng có thể đã cung cấp trong repo hoặc hội thoại.

## Chốt điều cần làm rõ

- Xác định kết quả người dùng muốn nhận, phạm vi được sửa và các ràng buộc đã nêu.
- Chỉ hỏi khi các cách hiểu dẫn tới khác biệt đáng kể về hành vi, dữ liệu hoặc thiết kế. Gom những câu hỏi liên quan; tiếp tục phần không phụ thuộc câu trả lời.
- Với lựa chọn nhỏ và dễ đảo ngược, dùng quy ước đang có và nêu giả định khi cần. Không biến mọi nhiệm vụ thành buổi phỏng vấn.
- Trình bày phương án khác khi có đánh đổi thực chất. Chọn giải pháp đáp ứng yêu cầu với ít thành phần mới nhất; tính cả yêu cầu vận hành đã biết.

## Lập kế hoạch có điều kiện thành công

- Viết tiêu chí theo hành vi quan sát được: đầu vào, kết quả mong đợi và ràng buộc phải giữ.
- Chia công việc theo các phần có thể xác minh. Mỗi bước nêu thay đổi dự kiến và cách kiểm tra phù hợp; việc nhỏ có thể chỉ cần một bước.
- Tận dụng test và lệnh kiểm tra hiện có. Ghi rõ lệnh đã xác định từ repo, hoặc nói chưa xác định; không bịa tên script hay kết quả baseline.
- Với bug, dự kiến cách tái hiện trước bản sửa. Với refactor, dự kiến so sánh hành vi hoặc test trước và sau.
- Đưa các tính năng suy đoán ra ngoài kế hoạch. Chỉ thêm abstraction, dependency hoặc cấu hình khi có nhu cầu cụ thể để giải thích chúng.

## Bàn giao đúng yêu cầu

Trình bày ngắn gọn mục tiêu, giả định còn ảnh hưởng, phương án đã chọn và các bước kèm xác minh. Chỉ thêm phần rủi ro hoặc câu hỏi khi chúng thay đổi quyết định thực hiện.

Yêu cầu chỉ lập kế hoạch không cho phép sửa mã nguồn. Nếu người dùng đã yêu cầu cả lập kế hoạch và triển khai, dùng kế hoạch làm bước trung gian rồi tiếp tục phần triển khai được giao; không tạo thêm lượt xin duyệt.
