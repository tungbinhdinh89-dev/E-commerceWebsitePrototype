# figma-make-app

Computer Store / TechZone repository: React + Vite + Tailwind CSS UI backed by a PHP 8.3/MySQL modular monolith. Read `rules.md` and `spec.md`; DB-03 permits the existing React UI to use PHP JSON during migration toward PHP Views/TailAdmin. The backend implements persistence for the existing store/admin flows and retains its server-rendered catalog. See `backend/README.md` for setup and remaining P0 work.

## Development Server

A Figma Make environment may already run Vite on `$PORT` (default 8443). Check before starting another server. For local development, run `npm run dev` from the repository root; it delegates to the `frontend` workspace.

- Preview URL: The user can access the running app through the preview panel
- Hot reload: Changes to source files are reflected immediately

## Project Structure

This is the canonical project structure. Start with task-relevant files below. Only follow imports or inspect other files when required, when a documented path is missing, or when the repository contradicts this guide.

- `frontend/src/main.tsx` - React entrypoint; imports `frontend/src/index.css` and mounts `frontend/src/App.tsx`
- `frontend/src/App.tsx` - Primary application component and starting point for prototype UI work
- `frontend/src/index.css` - Global CSS entrypoint and Tailwind CSS v4 import
- `frontend/public/` - Frontend static assets and product images
- `frontend/index.html` - Vite HTML shell loading `/src/main.tsx` relative to the frontend Vite root
- `frontend/package.json` - Frontend dependencies and Vite, TypeScript, test, and formatting scripts
- `frontend/vite.config.ts` - React, Tailwind and Figma plugins; `@` aliases `frontend/src`
- `frontend/tsconfig.json` and `frontend/tests/` - Frontend type checking and regression tests
- `frontend/resources/views/` - Reserved PHP presentation templates for the target application
- `backend/` - PHP MVC scaffold: `app/`, `config/`, `database/`, `routes/`, `public/`, `tests/`; see `backend/README.md`
- `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` - Root workspace coordination and shared dependency lockfile
- `.mise.toml` - Toolchain versions for Node.js and pnpm
- `skills/`, `guidelines/`, `plans/`, `.session-plans/`, `.cursor/`, `.claude-plugin/`, `AGENTS.md`, `CLAUDE.md`, `CURSOR.md` - AI instructions and tools; keep these at the repository root
- `.figma/` and `.figaro/` - Root Figma environment metadata; frontend Vite reads `../.figma/make/site.json`

`frontend/src/service.ts` is a Fetch adapter with a memory cache; `data.ts` contains types/labels/empty state. Do not reintroduce localStorage, browser password hashes or mock fallback. `useRemoteData.ts` loads paginated lists/items from PHP. Business logic belongs in PHP modules under `backend/app/Modules/`, with boundaries in `rules.md`; `Application.php` wires services and `Http/StoreController.php` maps JSON requests.

## Verification

Run from root: `npm run build`, `npm run typecheck`, `npm test`. `npm run dev` serves `http://localhost:8443` unless `$PORT`/`--port` overrides it and reuses this project's server. Run `npm run dev:backend` alongside it for PHP on port 8000. Vite proxies `/api`, `/uploads`, `/products`, `/assets`. Production frontend output is `frontend/dist/`; it needs the PHP API on the same origin. PHP checks: `backend:lint`, `backend:test`, `backend:test-db`, `backend:test-http`; integration tests must use a separate `_test` DB. NAS MySQL is `192.168.1.200:32771` (26.7.x per DB-02); credentials only in ignored `.env`/`.tools`. Seed public content once via `backend:seed-store`; no demo accounts. Never edit applied SQL migrations.

## Dependencies

- Runtime: React 19 and React DOM 19
- Styling: Tailwind CSS v4 with the `@tailwindcss/vite` plugin
- Build tooling: Vite 8, TypeScript 5.7, and `@vitejs/plugin-react`
- Formatting: oxfmt

## Styling

The prototype uses **Tailwind CSS v4** through `@tailwindcss/vite` in `frontend/vite.config.ts`. `frontend/src/index.css` imports Tailwind with `@import 'tailwindcss';`. Use Tailwind utility classes directly in JSX and put global CSS or Tailwind v4 theme customization in that file. This scaffold does not need a Tailwind config file or PostCSS config.

`frontend/src/main.tsx` imports `frontend/src/index.css`, so global font wiring belongs there. Keep CSS `@import` statements first, then add any `@font-face` rules and font-family defaults.

## Code quality

- Use double quotes for strings containing apostrophes (`"We're here to help"`), or escape them in single-quoted strings. An unescaped apostrophe in a single-quoted string breaks the build.
- Ensure JSX tags are closed and braces are balanced.
- Export components as default exports.
