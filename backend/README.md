# Backend — Computer Store

PHP 8.3 thuần/OOP, MVC tự viết, PDO MySQL theo [rules](../rules.md) và [spec](../spec.md). Không framework/ORM. Đã có 15 entities, enums, sáu migration, demo catalog seed, router, danh mục SSR và tìm kiếm Fetch. Xem [schema, ERD và quyết định dữ liệu](database/README.md).

## Kết nối NAS hiện tại

Theo DB-02, database chạy trong container `mysql_nas` trên Synology NAS **192.168.1.200:32771** (port 32771 của NAS map tới 3306 trong container). Server đã xác nhận **MySQL 26.7.0**. Baseline 8.x và 26.7.x được backend hỗ trợ; MariaDB không phải target. [Release notes chính thức MySQL 26.7](https://dev.mysql.com/doc/relnotes/mysql/26.7/en/).

Connection string PDO:

```text
mysql:host=192.168.1.200;port=32771;dbname=computer_store;charset=utf8mb4
```

User/password truyền riêng qua DB_USERNAME/DB_PASSWORD trong **backend/.env** đang được Git ignore, không nằm trong DSN hay mã nguồn. .env.example có host/port và tên DB mẫu, không có mật khẩu. Không cần cài MySQL hoặc Docker trên PC khi dùng NAS.

## Cài trên Windows

Chạy từ root dự án:

```powershell
npm run backend:setup
npm run backend:connection
npm run backend:init
npm run backend:migrate
npm run backend:seed
npm run backend:doctor
npm run backend:test
npm run backend:test-db
npm run dev:backend
```

backend:setup tải PHP 8.3 NTS x64 và Composer 2 vào **.tools/**; kiểm SHA-256 của PHP và SHA-384 của Composer installer. PHP tải từ downloads.php.net, CA bundle từ curl.se cho TLS. Không thay PATH, registry, XAMPP hoặc cài Windows service. Cần mạng và Microsoft Visual C++ 2015–2022 x64 runtime. Binaries/cache bị ignore. Nếu archive tải dở/checksum sai, xóa đúng archive đó trong .tools/downloads rồi thử lại. Sau setup, scripts backend tự dùng PHP portable; không cần sửa PATH toàn máy.

backend:connection chỉ đọc server version và danh sách bảng trong DB cấu hình, xuất DSN không chứa credentials. backend:init kết nối server theo .env và tạo **computer_store** / **computer_store_test** nếu chưa có, không drop/truncate DB/bảng hoặc ghi đè .env. Migrations chỉ tác động DB ứng dụng; integration tests chỉ chạy trong DB riêng có đuôi _test.

Khi dùng NAS, để container chạy trên NAS và chạy `npm run dev:backend` tại PC; Ctrl+C dừng PHP dev server. Không dùng backend:start-db/backend:stop-db cho NAS. Nếu cần instance local tùy chọn, script setup hỗ trợ -InstallLocalMySql và helper `node scripts/backend.mjs init-local`; đó là môi trường riêng, không phải cấu hình mặc định.

## Dùng môi trường đã có / hệ điều hành khác

PHP **8.3** cần fileinfo, mbstring, PDO/PDO MySQL. MySQL **8.x >= 8.0.16** hoặc **26.7.x** trên NAS theo DB-02; MariaDB của XAMPP không phải target. Nguồn cài: [PHP Windows](https://www.php.net/downloads.php?os=windows&version=8.3), [Composer](https://getcomposer.org/download/).

1. `composer install --working-dir=backend` để tạo PSR-4 autoload.
2. Copy backend/.env.example thành backend/.env; điền DB_HOST/PORT/DATABASE/USERNAME/PASSWORD cho DB riêng. Tạo database utf8mb4 và DB test có đuôi _test nếu cần integration tests.
3. Đặt PHP 8.3 trên PATH, hoặc `$env:PHP_BINARY='C:\path\to\php.exe'` trong PowerShell. .tools/php/php.exe được ưu tiên khi có.
4. Chạy backend:migrate, backend:seed, backend:doctor và dev:backend ở root. Có thể dùng `php backend/console.php migrate` / `seed` hoặc `php backend/tests/run.php` trực tiếp.

Environment loader hỗ trợ KEY=value, quote, comment nguyên dòng; không interpolation/multiline/inline comment. Biến shell được ưu tiên. APP_DEBUG không làm lộ exception qua HTTP; dùng doctor/CLI để kiểm tra setup.

## Frontend ↔ backend

Hai terminal trong giai đoạn phát triển:

```powershell
# Terminal 1: PHP 8.3 + MySQL sẵn sàng
npm run dev:backend

# Terminal 2
npm run dev
```

- React prototype: http://localhost:8443/ (hash routes và mock localStorage).
- Danh mục PHP thật: http://localhost:8000/products hoặc http://localhost:8443/products qua Vite proxy.
- Chi tiết sau seed: /products/demo-intel-core-i5-14400f.
- Health: /api/health; chỉ báo database/schema ready, không xuất credentials/SQL.
- GET /api/products?q=Intel&page=1: JSON {success,data,message,errors}, giá decimal string, 12 sản phẩm/trang. Endpoint dùng cho progressive search trong PHP catalog.

Nếu chạy npm run dev lần nữa khi server cùng dự án đã mở trên 8443, launcher nhận diện server và báo URL để dùng lại, không khởi động thêm rồi báo lỗi trùng port. Nếu port thuộc chương trình khác, launcher báo rõ và hướng dẫn `npm run dev -- --port 8444`; không tự dừng chương trình đó.

PHP đọc template từ **frontend/resources/views/**. View không gọi Repository/SQL. Luồng: Router → ProductController → ProductQueryService → ProductRepository → PDO; wiring thủ công. frontend/public/catalog.js tăng cường form/phân trang bằng Fetch; HTML/form/link vẫn hoạt động khi tắt JS. DB không lấy dữ liệu localStorage; React vẫn là prototype theo rules.

dev:backend copy frontend/public/ sang backend/public/assets/ cho ảnh/CSS/JS nội bộ. Chạy lại sau khi sửa static assets. Đổi BACKEND_PORT cho PHP và BACKEND_URL tương ứng cho terminal Vite nếu cần; PHP mặc định chỉ lắng nghe loopback 8000.

## Apache và webroot

Production dùng Apache/mod_rewrite, **DocumentRoot = backend/public/**, AllowOverride All để áp dụng .htaccess và Options -Indexes. Copy frontend/public vào backend/public/assets khi deploy; không cần Node ở runtime PHP. Views, app, config, vendor, .env nằm ngoài webroot. Bản portable NTS dùng CLI dev server; PHP Apache module trên Windows cần bản TS phù hợp theo tài liệu PHP.

backend/public/uploads/.htaccess chặn script; dev router chỉ public JPG/PNG/WebP dưới uploads. Chưa có upload endpoint. Khi bổ sung phải kiểm MIME Fileinfo, kích thước, tên random và validation server như rules.

## Phạm vi hiện tại và kiểm tra

Đã triển khai nền DB-01 và lát cắt đọc Catalog FR-PRO-01/02/03: search tên/SKU, phân trang SQL, active-only, detail 404, escape HTML và JSON. Admin CRUD, PHP Session/RBAC/CSRF, checkout/cancel, upload và các trang nội dung còn lại **chưa triển khai**. Schema là nền cho các service đó; backend MVP chưa hoàn tất.

```powershell
npm run backend:lint
npm run backend:test
npm run backend:test-db
```

Đã kiểm tra môi trường hiện tại: PHP **8.3.36**, các extension, Composer autoload; migration/seed/doctor trên NAS **MySQL 26.7.0**; 7 unit tests và 9 database integration tests đạt. HTTP qua Vite proxy kiểm tra health, catalog MySQL, PHP server-rendered HTML, detail và ảnh nội bộ. Các flow checkout/cancel/auth/admin chưa nằm trong kết quả này. Unit tests độc lập với DB/Composer; test-db chỉ dùng DB _test. Không có instance MySQL local được cài để chạy các kiểm tra trên.
