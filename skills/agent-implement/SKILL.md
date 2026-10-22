---
name: agent-implement
description: "Implement features, documentation, configuration changes, or refactors with focused edits and observable verification. Use for execution requests; reported defects belong to a debugging workflow."
license: MIT
---

# Triển khai đơn giản và đúng phạm vi

Hoàn thành yêu cầu bằng thay đổi có thể giải thích và kiểm chứng. Skill hoạt động độc lập; không cần chạy một skill lập kế hoạch trước.

## Xác định đích đến

- Đọc chỉ dẫn dự án, phần triển khai liên quan và test hiện có. Kiểm tra thay đổi đang có trong workspace để giữ nguyên công việc của người dùng.
- Chuyển yêu cầu thành hành vi đầu ra và các ràng buộc phải giữ. Hỏi khi thiếu thông tin làm thay đổi đáng kể kết quả; tiếp tục các phần đã rõ.
- Nếu công việc nhiều bước, nêu kế hoạch ngắn kèm cách xác minh. Với thay đổi hiển nhiên, thực hiện trực tiếp.

## Chọn thiết kế vừa đủ

- Tái sử dụng quy ước, API và dependency đang có khi phù hợp.
- Thêm abstraction hoặc cấu hình khi có ít nhất một nhu cầu cụ thể mà cách đơn giản không đáp ứng. Tránh thiết kế cho khả năng chưa được yêu cầu.
- Đơn giản hóa vẫn phải đáp ứng các trường hợp lỗi, validation, tính nhất quán và yêu cầu vận hành thực tế của chức năng.
- Khi đề xuất cách khác, giải thích đánh đổi gắn với yêu cầu. Tôn trọng lựa chọn rõ ràng của người dùng.

## Giữ thay đổi tập trung

- Mỗi dòng sửa cần liên hệ được với yêu cầu hoặc phần hỗ trợ trực tiếp cho nó.
- Theo phong cách code sẵn có; giữ các định dạng, comment và logic không liên quan.
- Dọn import, biến hoặc hàm bị chính thay đổi mới làm thừa. Ghi nhận vấn đề cũ nằm ngoài phạm vi thay vì tự mở rộng nhiệm vụ.
- Giữ giao diện và hành vi người dùng đã yêu cầu bảo toàn. Nếu phát hiện cần thay đổi hợp đồng ngoài phạm vi đã giao, làm rõ phần đó trước.

## Xác minh theo tác động

- Chạy các kiểm tra bắt buộc của dự án, cộng với kiểm tra trực tiếp hành vi vừa thay đổi.
- Với logic mới, ưu tiên kiểm tra kết quả mà người dùng quan sát được. Với refactor, kiểm tra hành vi trước và sau khi có thể.
- Với tài liệu hoặc thay đổi nhỏ, chọn kiểm tra cấu trúc, liên kết, cú pháp hoặc thao tác trực tiếp phù hợp. Không thêm test chỉ để sao chép cấu trúc implementation.
- Khi một kiểm tra thất bại, phân biệt lỗi do bản sửa, lỗi đã có và lỗi môi trường bằng bằng chứng. Sửa lỗi trong phạm vi rồi kiểm tra lại phần bị ảnh hưởng.
- Sau khi kiểm tra phù hợp đã pass, chỉ mở rộng hoặc chạy lại khi có thay đổi mới hay mối lo chưa giải quyết. Review diff trước khi bàn giao.

## Báo kết quả và giới hạn

Nêu thay đổi chính, lý do, kiểm tra thực sự đã chạy và kết quả. Ghi rõ kiểm tra chưa chạy hoặc bị chặn; không suy ra “pass” từ việc đọc code. Nếu không thể tiến thêm do thiếu dữ liệu hoặc công cụ, nêu đúng phần còn thiếu và phần công việc đã hoàn thành.

Tiếp tục đến tiêu chí hoàn thành trong phạm vi đã giao. Skill không mở rộng quyền thực hiện vượt yêu cầu người dùng hoặc giới hạn của môi trường.
