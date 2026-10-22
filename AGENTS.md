# figma-make-app

Computer Store / TechZone repository: a React + Vite + Tailwind CSS frontend prototype and an initial PHP/MySQL application. Read `rules.md` and `spec.md` for the target PHP MVC architecture. The React app remains a UI prototype; the PHP backend has entities, SQL migrations and a read-only server-rendered catalog. See `backend/README.md` for setup and remaining features.

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

`frontend/src/service.ts` and `frontend/src/data.ts` simulate data in the browser. Keep them with the prototype. Backend business logic belongs in PHP modules under `backend/app/Modules/` and must follow the boundaries in `rules.md`.

## Verification

Run from the repository root: `npm run build`, `npm run typecheck`, and `npm test`. `npm run dev` must serve the frontend UI at `http://localhost:8443` unless `$PORT` or `--port` overrides it; it reuses an existing server from this project. Production frontend output is `frontend/dist/`; Figma deploy scripts use that directory. PHP changes use `npm run backend:lint`, `npm run backend:test` and `npm run backend:test-db`. The configured NAS MySQL server is `192.168.1.200:32771` (26.7.x permitted by DB-02); credentials belong only in ignored `backend/.env`. See `backend/README.md` for PHP 8.3 setup and catalog URLs.

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
