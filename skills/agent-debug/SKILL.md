---
name: agent-debug
description: "Diagnose and fix reported defects by reproducing the failure, identifying its cause, and verifying a focused correction. Use for crashes, incorrect results, regressions, or failing tests."
license: MIT
---

# Sửa lỗi từ trường hợp tái hiện

Tạo bằng chứng cho triệu chứng, tìm nguyên nhân và sửa trong phạm vi cần thiết. Nếu yêu cầu chỉ điều tra, bàn giao chẩn đoán và cách sửa đề xuất; chỉ sửa code khi việc sửa đã nằm trong yêu cầu.

## Xác định lỗi và hợp đồng mong đợi

- Đọc chỉ dẫn dự án, code liên quan, báo lỗi và test. Phân biệt triệu chứng quan sát được, hành vi mong đợi và giả thuyết về nguyên nhân.
- Tìm trường hợp đầu vào nhỏ nhất còn gây lỗi. Kiểm tra các dữ liệu và log sẵn có trước khi hỏi người dùng.
- Nếu kết quả mong đợi có nhiều cách hiểu, làm rõ trước khi mã hóa nó thành test. Ví dụ, “trùng điểm” chưa tự xác định quy tắc xếp tên hay giữ thứ tự đầu vào.

## Tái hiện bằng kiểm tra có ý nghĩa

- Khi có thể, tạo test thất bại trước bản sửa. Xác nhận nó thất bại vì đúng triệu chứng cần sửa; lỗi import hoặc thiết lập test không chứng minh bug.
- Chọn dữ liệu làm lộ khác biệt giữa hành vi sai và đúng. Với quy tắc hòa điểm theo tên, đặt Bob trước Alice ở đầu vào và kiểm tra thứ tự tên đầu ra.
- Assert hành vi cần bảo đảm, không chỉ kiểm tra một thuộc tính phụ. Điểm số đúng chưa chứng minh thứ tự giữa các mục cùng điểm đúng.
- Nếu chưa thể tự động hóa, dùng bước tái hiện thủ công hoặc bằng chứng tương đương và ghi giới hạn. Không tuyên bố đã tái hiện khi chỉ mới đọc code.

## Tìm nguyên nhân rồi sửa

- Theo đường đi của dữ liệu từ đầu vào tới điểm sai; ưu tiên kiểm tra giả thuyết có bằng chứng và chi phí thấp.
- Thay đổi từng phần đủ để kiểm tra giả thuyết. Tránh thêm nhiều biện pháp độc lập cùng lúc khiến không xác định được nguyên nhân.
- Sửa nguyên nhân tại vị trí phù hợp, giữ phong cách và hợp đồng không liên quan. Dọn phần thừa do bản sửa tạo ra.
- Không làm test yếu đi để có màu xanh. Nếu test cũ sai hợp đồng, giải thích và kiểm chứng hợp đồng đúng trước khi sửa test.

## Chứng minh bản sửa

- Chạy lại trường hợp tái hiện; kiểm tra phần liên quan và các kiểm tra bắt buộc của dự án.
- Thêm trường hợp biên khi nguyên nhân cho thấy có đường lỗi khác trong cùng phạm vi. Không mở rộng thành chiến dịch hardening.
- Khi lỗi còn tồn tại, dùng kết quả mới để điều chỉnh giả thuyết. Nếu không có bằng chứng mới hoặc thiếu điều kiện tái hiện, nêu phần bị chặn thay vì lặp lại cùng thao tác.

Bàn giao: triệu chứng, nguyên nhân đã xác nhận hoặc mức chắc chắn còn lại, phần sửa, kết quả kiểm tra và giới hạn. Tách rõ “đã tái hiện”, “đã kiểm tra sau sửa” và “chưa xác minh” khi chúng khác nhau.
