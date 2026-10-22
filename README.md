# TechZone

Vietnamese computer hardware e-commerce **frontend prototype**, built with React 19, TypeScript, Vite 8, Tailwind v4 and Astra UI.

## Preview and demo accounts

The Figma Make preview server starts automatically. Do not start a second server.

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

- `src/data.ts`: types and seeded mock data.
- `src/service.ts`: shared asynchronous service, authorization checks and atomic localStorage updates.
- `src/context.tsx`: shared state subscriptions, notifications and authentication dialog.
- `src/App.tsx`: storefront shell, homepage and hash navigation.
- `src/StorePages.tsx`: shopping, checkout and account.
- `src/ContentPages.tsx`: editorial and informational pages.
- `src/Admin.tsx`: independent management workspace.
- `src/index.css`: centralized TechZone tokens and responsive Astra extensions.

The versioned store key is `techzone.database.v1`. Data persists only in this browser and is not shared across devices or browsers. Clear the website's browser storage to reset the demo. Client-side authorization is only a UX simulation; PHP must revalidate authentication, roles, prices, coupons and inventory in database transactions.

## Verification

```sh
pnpm build
pnpm exec tsc --noEmit
node --test tests/service.test.mjs
pnpm format src
```

Formatting uses the repository's `oxfmt` script. Multi-property TypeScript object types are deliberately multiline to avoid an issue in the installed formatter with inline semicolons.

## Image credits

Local product illustrations are sourced from publicly available manufacturer/retailer product photography (GEARVN / Hstatic) for this educational prototype and may depict a representative model. Editorial photos: Agung Raharja, Back2Gaming and Olivie Zemanova via Unsplash. Replace or license product imagery appropriately before commercial use.
