# TechZone / Computer Store

Website bán máy tính và linh kiện theo `rules.md` và `spec.md`.

## Cấu trúc thư mục

```text
E-commerceWebsitePrototype/
├── frontend/
│   ├── src/                  # UI React và dữ liệu mô phỏng localStorage
│   ├── public/               # Ảnh, favicon và static assets của UI
│   ├── resources/views/      # Dành cho PHP Views khi tích hợp bản hoàn chỉnh
│   ├── tests/                # Test service mô phỏng và React context
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json          # Dependencies và scripts frontend
├── backend/                  # Khung PHP MVC theo rules/spec
│   ├── app/{Core,Middleware,Modules,Support}/
│   ├── config/
│   ├── database/{migrations,seeders}/
│   ├── public/uploads/
│   ├── routes/
│   ├── tests/
│   ├── composer.json
│   └── .env.example
├── skills/                   # Skills của agent
├── guidelines/               # Hướng dẫn AI/design system
├── plans/                    # Kế hoạch và tài liệu agent
├── .session-plans/
├── .cursor/
├── .claude-plugin/
├── .figma/                   # Cấu hình môi trường Figma Make
├── .figaro/
├── AGENTS.md, CLAUDE.md, CURSOR.md
├── rules.md, spec.md
├── package.json              # Điều phối lệnh từ root qua npm workspace
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── .mise.toml
```

UI hiện tại là **frontend prototype React 19, TypeScript, Vite 8, Tailwind v4 và Astra UI**, chạy bằng dữ liệu trong trình duyệt. Backend đã có 15 entities, sáu migration MySQL và danh mục PHP server-rendered tại `frontend/resources/views/`; xem [hướng dẫn backend](backend/README.md) và [schema/ERD](backend/database/README.md). Các flow nghiệp vụ còn lại chưa triển khai.

## Chạy UI frontend

Mở terminal tại **root dự án**. Dùng Node.js 22.12 trở lên trong dòng Node 22 và pnpm 10.34.3 theo `.mise.toml`.

```sh
pnpm install --frozen-lockfile
npm run dev
```

Sau khi dependencies đã cài, lệnh `npm run dev` không cần gọi pnpm. Nếu dùng npm để cài dependencies, `npm install` từ root cũng nhận workspace `frontend`.

Truy cập **http://localhost:8443**. Lệnh root chạy Vite trong `frontend/` và dùng lại server cùng dự án nếu đã mở trên cổng đó; có thể dùng `npm run dev -- --port 8444` để đổi cổng hoặc đặt biến môi trường `PORT`. Cổng thuộc ứng dụng khác sẽ được báo rõ, không tự dừng ứng dụng đó. Dừng server bằng `Ctrl+C` trong terminal chạy lệnh. Trong Figma Make, dùng preview panel nếu môi trường đã có server.

```sh
npm run build       # Xuất frontend/dist/
npm run typecheck   # Kiểm tra TypeScript của frontend
npm test            # Chạy cả hai file test frontend
npm run preview    # Xem bản đã build
```

## Stack bản hoàn chỉnh theo rules/spec

- PHP 8.3 thuần/OOP, MVC tự triển khai, server-rendered views.
- MySQL 8.x, InnoDB, `utf8mb4`, PDO prepared statements.
- Bootstrap 5 cho public UI.
- TailAdmin Free cho admin UI (tích hợp PHP Views; tài nguyên template phải được nhóm kiểm tra license trước khi đưa vào).
- Composer chỉ dùng PSR-4 autoload và thư viện độc lập; không dùng PHP framework/CMS.

### Backend và tích hợp PHP

Xem [backend/README.md](backend/README.md) cho sơ đồ module và ranh giới MVC. Khi triển khai backend, môi trường cần PHP 8.3 với `fileinfo`, `pdo`, `pdo_mysql`, Composer, MySQL 8 và Apache/mod_rewrite. `backend/composer.json` khai báo môi trường và PSR-4 autoload; `backend/.env.example` là mẫu cấu hình.

Webroot PHP là **`backend/public/`**; PHP Views đặt trong **`frontend/resources/views/`**. Migration/seed thuộc `backend/database/`; ảnh upload thuộc `backend/public/uploads/`. Danh mục đầu tiên đi qua Controller → Service → Repository → PDO, có search/pagination và Fetch enhancement. Bản React tiếp tục dùng để xem thử UI; không phải runtime chính của bản PHP.

Trên Windows: `npm run backend:setup`, cấu hình `backend/.env`, rồi `npm run backend:connection`, `npm run backend:init`, `npm run backend:migrate`, `npm run backend:seed`, `npm run dev:backend`. PHP/Composer cài riêng trong `.tools/`; MySQL dùng container NAS tại **192.168.1.200:32771**, phiên bản thực **26.7.0** được bổ sung theo DB-02 trong rules/spec. Credentials chỉ nằm trong .env được ignore. Mở **http://localhost:8000/products** hoặc **http://localhost:8443/products** qua Vite proxy. Xem backend README cho cấu hình, test và phần chưa triển khai.

## TailAdmin

TailAdmin Free là template được yêu cầu cho bản admin PHP. Giữ source asset trong `frontend/`, tích hợp markup vào `frontend/resources/views/layouts/admin.php` và xuất asset vào webroot PHP khi triển khai. Kiểm tra license trước khi đưa tài nguyên template vào; runtime backend dùng PHP theo rules/spec.

## Preview and demo accounts

Tài khoản demo dùng trong UI prototype:

| Role | Email | Password |
| --- | --- | --- |
| Member | `member@techzone.vn` | `Techzone123` |
| Admin | `admin@techzone.vn` | `Techzone123` |

Use **Đăng nhập / Đăng ký**, then choose a demo account. Open `#/admin` for the separate admin workspace. New accounts are always members.

This is a simulation: no real payments, deliveries, email or server-side security. Do not enter real credentials or sensitive personal data.

## Implemented flows

- Search, category / brand / price / stock filters, sorting, pagination, product details and favorites.
- Guest and member carts, guest-cart merge on sign-in, quantity and stock validation.
- Authenticated COD checkout, `TECHZONE5` discount (5%, capped at 500,000₫), shipping after discounts.
- Default shipping: 30,000₫, free from 2,000,000₫. Both values are configurable in admin.
- Order history, delivery details and profile editing.
- Member cancellation only while pending; admin cancellation before shipping. Stock is restored exactly once.
- News, moderated comments, contact submissions, FAQ, company, services and pricing pages.
- Admin product CRUD, stock/pricing edits, user lock/unlock, order state transitions and real local-data reporting.
- All nine approved CMS groups: articles, comments, contacts, FAQs, company content, services, service pricing, site settings, media.
- CMS media stores image URLs; it does not upload files to a server.

## Architecture

- `frontend/src/data.ts`: types and seeded mock data.
- `frontend/src/service.ts`: shared asynchronous mock service, authorization checks and atomic localStorage updates.
- `frontend/src/context.tsx`: shared state subscriptions, notifications and authentication dialog.
- `frontend/src/App.tsx`: storefront shell, homepage and hash navigation.
- `frontend/src/StorePages.tsx`: shopping, checkout and account.
- `frontend/src/ContentPages.tsx`: editorial and informational pages.
- `frontend/src/Admin.tsx`: independent management workspace.
- `frontend/src/index.css`: centralized TechZone tokens and responsive Astra extensions.

The versioned store key is `techzone.database.v1`. Data persists only in this browser and is not shared across devices or browsers. Clear the website's browser storage to reset the demo. Client-side authorization is only a UX simulation; PHP must revalidate authentication, roles, prices, coupons and inventory in database transactions.

## Verification

```sh
npm run build
npm run typecheck
npm test
npm run format -- src
npm run backend:lint       # Cần PHP 8.3
npm run backend:test
npm run backend:test-db    # Cần MySQL 8, DB riêng có đuôi _test
```

Formatting uses the repository's `oxfmt` script. Multi-property TypeScript object types are deliberately multiline to avoid an issue in the installed formatter with inline semicolons.

## Image credits

Local product illustrations are sourced from publicly available manufacturer/retailer product photography (GEARVN / Hstatic) for this educational prototype and may depict a representative model. Editorial photos: Agung Raharja, Back2Gaming and Olivie Zemanova via Unsplash. Replace or license product imagery appropriately before commercial use.
