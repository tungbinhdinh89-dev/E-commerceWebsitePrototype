---
name: agent-review
description: "Review code changes against requirements and report actionable defects with file and line evidence. Use for review requests; editing requires repair work to be included in the user's task."
license: MIT
---

# Review theo yêu cầu và bằng chứng

Đánh giá tính đúng, phạm vi và mức xác minh của thay đổi. Ưu tiên phát hiện lỗi có tác động cụ thể; một bản review hợp lệ có thể không có finding.

## Hiểu phạm vi review

- Xác định mục tiêu của thay đổi và diff hoặc file cần review từ yêu cầu cùng trạng thái repo. Hỏi nếu chọn sai base hoặc phạm vi sẽ làm kết luận không đáng tin.
- Đọc chỉ dẫn dự án, phần diff, code xung quanh và các nơi gọi liên quan đủ để hiểu hành vi. Không kết luận từ một đoạn diff mất ngữ cảnh.
- Phân biệt lỗi được thay đổi mới đưa vào với vấn đề đã tồn tại. Chỉ đưa vấn đề cũ vào kết luận chính khi nó nằm trong phạm vi review hoặc bị thay đổi mới tác động trực tiếp.

## Tìm lỗi ảnh hưởng tới kết quả

- So sánh hành vi với yêu cầu: trường hợp đầu vào nào cho kết quả sai, hợp đồng nào bị phá, chức năng nào có thể hồi quy?
- Kiểm tra sự phức tạp mới có giải quyết nhu cầu thực tế không. Chỉ báo thành finding khi có tác động cụ thể; tách sở thích thiết kế khỏi lỗi cần sửa.
- Kiểm tra thay đổi ngoài phạm vi và phần thừa do bản sửa tạo ra. Áp dụng quy ước có thật của dự án thay vì áp đặt phong cách cá nhân.
- Xem test có phân biệt được implementation sai với đúng không. Thiếu một test không tự chứng minh có bug; giải thích đường lỗi hoặc rủi ro cụ thể nếu báo thiếu kiểm chứng.
- Chạy kiểm tra tập trung khi khả thi và có ích. Ghi rõ đâu là kết quả thực chạy, đâu là suy luận từ code.

## Viết finding để có thể hành động

Với mỗi finding, cung cấp vị trí file và dòng, điều kiện gây lỗi, hành vi sai, tác động và hướng sửa ngắn nếu hữu ích. Sắp theo mức tác động và độ chắc chắn; nêu điều kiện áp dụng khi kết luận phụ thuộc điều kiện đó.

Gắn vị trí vào phần code gây vấn đề. Tránh kết luận chung như “cần thêm test” hoặc “code chưa tối ưu” khi chưa chỉ ra hành vi bị ảnh hưởng.

Nếu chưa đủ bằng chứng, đặt thành câu hỏi hoặc nêu giới hạn điều tra. Nếu không thấy lỗi đáng báo, nói rõ không phát hiện trong phạm vi đã xem và nêu khoảng trống kiểm tra còn ảnh hưởng đến kết luận.

## Tôn trọng phạm vi thao tác

Yêu cầu review chỉ tạo nhận xét. Nếu người dùng đã giao cả review và sửa, có thể tiếp tục sửa phần được giao rồi xác minh; không cần xin duyệt lại chỉ vì dùng skill này. Không khẳng định toàn hệ thống đúng chỉ vì diff đã được đọc hoặc một nhóm test đã pass.
