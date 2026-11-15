# Báo cáo TechZone — Lập Trình Web

Tên đề tài: **TechZone — Xây dựng website kinh doanh máy tính và linh kiện**. Giảng viên: **Nguyễn Hữu Hiếu**.

Bộ nguồn dựa trên `Computer_Store_SRS_Assignment.pdf` v2.0 và đối chiếu mã nguồn dự án. Có 39 FR, 12 NFR, 14 use case, 31 kịch bản kiểm thử, user flow, flowchart, sơ đồ trạng thái, kiến trúc, ERD và bảng ánh xạ 21 bảng dữ liệu/hỗ trợ. Metadata sinh viên được giữ từ template: Nguyễn Thanh Tùng, MSSV 2449106; cần kiểm tra lại trước khi nộp.

## Build

Cần TeX Live với **LuaLaTeX, latexmk, Biber** và Python 3. Từ thư mục `report/`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\build.ps1
```

Hoặc:

```powershell
python build.py --tex main.tex --engine lualatex
```

- PDF: `dist/main.pdf`; `build.ps1` cũng cập nhật bản tiện mở tại `main.pdf` sau khi build thành công.
- Toàn bộ stdout/stderr và mã thoát: `logs/main/<run-id>-build/console.log`.
- Log native: `logs/main/<run-id>-build/diagnostics/`.
- File phụ: `build/`. Giữ log cũ khi build lại để tra lỗi.
- Không cần shell escape hoặc cài Python package ngoài standard library để build.

Template cũ dùng pdfLaTeX/T5. Bộ báo cáo này dùng LuaLaTeX/fontspec để hỗ trợ Unicode, giữ bố cục bìa, logo có sẵn, header/footer và phong cách Computer Modern bằng Latin Modern. `main.tex`, script và cấu hình editor đi kèm thống nhất LuaLaTeX. Không dùng `latexmk -pdf` cho workflow này.

## Sửa nội dung

- `metadata.tex`: môn, giảng viên, tên đề tài, sinh viên, email, lớp/nhóm, ngày.
- `cover.tex`, `preamble.tex`: bìa và định dạng.
- `sections/`: nội dung chia theo từng phần; các bảng FR/NFR/TC là `.tex` có thể sửa trực tiếp.
- `references.bib`: nguồn tài liệu, build bằng Biber.
- `figures/hcmut.png`: logo kế thừa từ template; sơ đồ được viết bằng TikZ, không cần công cụ chuyển ảnh.

Các đường dẫn mã nguồn trong PDF tính từ root `E-commerceWebsitePrototype`.

## Trạng thái nội dung

Báo cáo phân biệt yêu cầu, code đã có và kết quả chạy. Lần biên soạn này **không chạy kiểm thử ứng dụng/DB/trình duyệt**; TC-01–TC-31 là kế hoạch và expected result, chưa có Actual/Pass. Các phần PHP Views/TailAdmin, password/avatar, danh mục và trạng thái giỏ được ghi là khoảng trống cần hoàn thiện.

Trước nộp cần bổ sung email liên hệ, lớp/nhóm, thành viên/phân công thật, ảnh giao diện thật và chứng cứ kiểm thử. Không đưa credentials vào báo cáo. Skill `write-doc` không được tìm thấy trong các thư mục kỹ năng và hai repository đã kiểm tra; bộ nguồn áp dụng `latex-local-studio`, SRS và cấu trúc template hiện có, không tuyên bố đã áp dụng một skill chưa đọc được.
