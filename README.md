# TechZone / Computer Store

Website bán máy tính và linh kiện. React hiện lấy dữ liệu từ backend PHP 8.3/PDO và MySQL trên NAS. Quyết định chuyển tiếp DB-03 trong [rules.md](rules.md) và [spec.md](spec.md) cho phép giữ UI này khi tiếp tục xây dựng bản PHP Views theo kiến trúc mục tiêu.

## Chạy dự án

Từ root, dùng Node.js 22.12+ trong dòng Node 22 và pnpm theo `.mise.toml`:

```sh
pnpm install --frozen-lockfile
npm run dev:backend
```

Mở terminal thứ hai:

```sh
npm run dev
```

Truy cập **http://localhost:8443/**; trang quản trị tại **http://localhost:8443/#/admin**. Frontend proxy `/api`, `/uploads`, `/products` và `/assets` tới PHP tại `127.0.0.1:8000`. Cả PHP và MySQL phải hoạt động; UI báo lỗi kết nối và cho thử lại nếu backend chưa sẵn sàng.

`npm run dev` dùng lại Vite của cùng dự án nếu đã chạy. Đổi cổng bằng `npm run dev -- --port 8444` hoặc `PORT`. Dừng server bằng `Ctrl+C` trong terminal tương ứng. `npm run build` xuất `frontend/dist/`; bản build cần được phục vụ cùng origin với PHP hoặc reverse proxy các đường dẫn trên. Deploy riêng dist không cung cấp backend API.

## Khởi tạo backend trên máy mới

Xem [backend/README.md](backend/README.md) cho cấu hình đầy đủ. Trên Windows:

```sh
npm run backend:setup
# Sao chép backend/.env.example thành backend/.env rồi điền credentials riêng.
npm run backend:connection
npm run backend:init
npm run backend:migrate
npm run backend:create-admin
npm run backend:seed-store
npm run backend:doctor
```

`backend:create-admin` đọc `BOOTSTRAP_ADMIN_EMAIL` và `BOOTSTRAP_ADMIN_PASSWORD` trong môi trường local; mật khẩu phải có 16–72 byte. Lệnh chỉ tạo admin nếu chưa có, không đổi mật khẩu tài khoản đã tồn tại. Không có tài khoản demo hay mật khẩu mặc định. Member đăng ký qua UI và được gán quyền tại server.

Máy hiện tại có PHP **8.3.36** trong `.tools/` và MySQL **26.7.0** trên NAS **192.168.1.200:32771**, database `computer_store`. Credentials DB ở `backend/.env` được ignore. Thông tin admin đã tạo cho máy này ở `.tools/admin-credentials.json`, cũng được ignore; không đưa file này vào Git hoặc bản deploy.

## Dữ liệu và chức năng

- Sản phẩm, danh mục, thương hiệu, giá, tồn kho, search/filter/pagination lấy từ MySQL.
- Đăng ký/đăng nhập, hồ sơ, khóa tài khoản và quyền quản trị do PHP Session/RBAC xử lý; thao tác ghi kiểm CSRF.
- Giỏ Member và yêu thích lưu MySQL; giỏ/yêu thích Guest theo PHP Session. Giỏ Guest được gộp khi đăng nhập.
- Checkout COD tính lại giá, coupon, phí giao hàng tại server; transaction khóa tồn kho, lưu snapshot đơn và xóa giỏ. Admin chuyển trạng thái/hủy từ pending/confirmed, hoàn kho một lần. Member chỉ xem đơn của mình.
- Tin tức, bình luận kiểm duyệt, FAQ, công ty, dịch vụ/bảng giá, cài đặt, media, liên hệ và email nhận tin lưu qua backend. Dashboard tổng hợp từ MySQL.
- Upload JPG/PNG/WebP tối đa 5 MB lên server, kiểm MIME/kích thước/tên file; không dùng URL ảnh ngoài thay upload.

`frontend/src/data.ts` chỉ chứa types, nhãn và trạng thái rỗng. `frontend/src/service.ts` dùng Fetch, giữ cache RAM và tải lại sau thao tác ghi; không đọc/ghi localStorage, không sinh dữ liệu khi backend lỗi. Dữ liệu localStorage của prototype cũ không được nhập vào MySQL.

Nội dung công khai ban đầu chuyển sang `backend/database/seeders/store-content.json`, nạp **một lần** bằng `backend:seed-store`; không có tài khoản, đơn hàng hoặc dữ liệu cá nhân mẫu. Chạy lại không ghi đè chỉnh sửa admin. `backend:seed` là seed catalog tối thiểu cũ, dùng độc lập khi cần; không bắt buộc cho UI hiện tại.

React/Astra hiện chưa hoàn tất yêu cầu PHP Views/TailAdmin. Catalog SSR vẫn chạy tại `/products`; xem backend README về phần còn thiếu. Thanh toán online, email và hãng vận chuyển chưa tích hợp.

## Cấu trúc

```text
frontend/src/                 React UI, types và Fetch adapter
frontend/resources/views/     PHP Views catalog SSR
frontend/public/              Static assets nội bộ
backend/app/                  Controller → Service → Repository → PDO
backend/database/             SQL migrations, seed nội dung
backend/public/uploads/       Ảnh upload, không version control
backend/tests/                Unit, MySQL integration và HTTP tests
scripts/                      Launcher Vite/PHP, setup môi trường
rules.md, spec.md             Kiến trúc, phạm vi và quyết định tích hợp
```

## Kiểm tra

```sh
npm run build
npm run typecheck
npm test
npm run backend:lint
npm run backend:test
npm run backend:test-db
npm run backend:test-http
```

Integration tests chỉ dùng database riêng có đuôi `_test`, mặc định `computer_store_test`. HTTP tests khởi động PHP ở cổng tạm, tạo/dọn fixtures riêng; có kiểm hai checkout tranh tồn kho và hai yêu cầu hủy đồng thời. Frontend tests kiểm Fetch/CSRF/cache/quyền riêng tư và React context. Format frontend bằng `npm run format -- src`; giữ object type TypeScript nhiều thuộc tính ở dạng nhiều dòng vì formatter hiện tại xử lý sai dấu phân cách của type viết cùng dòng.

## Image credits

Local product illustrations are sourced from publicly available manufacturer/retailer photography (GEARVN / Hstatic) for this educational project and may depict a representative model. Editorial photos: Agung Raharja, Back2Gaming and Olivie Zemanova via Unsplash. Replace or license imagery appropriately before commercial use.
