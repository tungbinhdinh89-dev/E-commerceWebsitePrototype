# Backend — Computer Store

Khung thư mục cho backend theo [rules.md](../rules.md) và [spec.md](../spec.md): PHP 8.3 thuần/OOP, MVC tự viết, PDO MySQL, PHP Session và RBAC. Composer chỉ khai báo yêu cầu môi trường và PSR-4 `App\` → `app/`; chưa thêm thư viện hoặc framework.

```text
backend/
├── app/
│   ├── Core/                 # Router, Request, Response, Database, View, Validator
│   ├── Middleware/           # Auth, Role, CSRF
│   ├── Modules/
│   │   ├── Auth/
│   │   ├── User/
│   │   ├── Site/
│   │   ├── Contact/
│   │   ├── Faq/
│   │   ├── Product/
│   │   ├── Cart/
│   │   ├── Order/
│   │   ├── Article/
│   │   └── Comment/
│   └── Support/              # Uploader, Paginator và helper kỹ thuật
├── config/
├── database/
│   ├── migrations/
│   └── seeders/
├── public/                   # Webroot PHP; front controller sẽ đặt tại đây
│   └── uploads/
│       ├── products/
│       ├── articles/
│       ├── avatars/
│       └── site/
├── routes/
├── tests/
├── composer.json
└── .env.example
```

Các thư mục có `.gitkeep` đang để trống, dành cho giai đoạn triển khai PHP/MySQL. Chưa có front controller, router, migration, kết nối database hoặc API hoạt động. `npm run dev` ở root chỉ chạy UI prototype trong `frontend/`.

PHP Views là phần giao diện nên được dành chỗ tại `frontend/resources/views/`. Khi triển khai lớp View, cấu hình đường dẫn tới thư mục này; chỉ Apache `DocumentRoot` trỏ tới `backend/public/`. Asset giao diện có nguồn trong `frontend/` và sẽ được xuất/copy vào webroot khi tích hợp PHP. Upload người dùng thuộc `backend/public/uploads/` và phải được chặn thực thi script trước khi bật chức năng upload.

Giữ hướng gọi `Controller → Service → Repository → PDO` và ownership module trong rules. `Admin` là giao diện quản trị các module, không tạo thành domain module riêng. `frontend/src/service.ts` hiện là mô phỏng localStorage của UI, không phải backend PHP hay nguồn dữ liệu MySQL.

Môi trường triển khai dự kiến: PHP 8.3 với Fileinfo, PDO/PDO MySQL, Composer, MySQL 8 và Apache/mod_rewrite. Khi bắt đầu triển khai backend, chạy `composer install` trong thư mục này và tạo `.env` từ `.env.example`; cấu hình môi trường sẽ cần được đọc bởi bootstrap PHP.
