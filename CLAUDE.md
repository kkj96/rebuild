# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rebuild is a YAML-driven low-code CRUD application builder with three packages:

- **rebuild-ui** — React/TypeScript frontend that renders pages from YAML config or code-based components
- **rebuild-server** — FastAPI mock API server (Python) providing auth, users, and roles endpoints
- **rebuild-config** — YAML configuration files defining app settings, routes, resources, pages, and i18n locales

## Development Commands

### Frontend (rebuild-ui)
```bash
cd rebuild-ui
npm install              # install dependencies
npm run dev              # start Vite dev server
npm run build            # typecheck + production build (tsc -b && vite build)
npm run lint             # ESLint
```

### Backend (rebuild-server)
```bash
cd rebuild-server
uv sync                  # install dependencies (uses uv package manager)
uv run uvicorn src.main:app --reload --port 8000   # start dev server
uv run ruff check .      # lint
uv run ruff format .     # format
```

### Config validation (rebuild-config)
```bash
cd rebuild-config
npm run validate         # validate YAML files
```

## Architecture

### Config-Driven Rendering Pipeline

The core architectural pattern: **Routes → Pages → Components → Data Binding → Resources → API**

1. `routes.yaml` maps URL paths to either code-based components or YAML page definitions
2. Routes with `type: code` resolve to React components registered in `App.tsx`'s `codeComponents` map
3. Routes with `type: yaml` resolve to YAML files in `rebuild-config/pages/` which define component trees
4. `DynamicPage` (`src/components/dynamic/`) renders YAML page definitions into React components
5. `resources.yaml` defines API resource schemas (fields, types, validation) used by both the dynamic renderer and Refine.dev data provider

### Config Loading Modes

Controlled by `VITE_CONFIG_MODE` env var (see `.env.example`):
- **embedded** — YAML files bundled at build time via static imports in `src/routes/` (synchronous load)
- **local** — loaded from local filesystem at runtime
- **remote** — fetched from a remote URL at runtime

### Frontend Key Patterns

- **Path alias**: `@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`)
- **UI components**: Radix UI primitives wrapped in `src/components/ui/` (shadcn/ui pattern)
- **State management**: Zustand stores in `src/store/`
- **Data layer**: Refine.dev with `@refinedev/simple-rest` data provider, TanStack Query for caching, TanStack Table for data grids
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS 4

### Backend Structure

- `src/main.py` — FastAPI app with CORS and router registration
- `src/database.py` — In-memory mock data store, auto-seeded on startup
- `src/models.py` — Pydantic models
- `src/routers/` — Route handlers for auth, users, roles

## Commit Convention

Follows Conventional Commits: `<type>(<scope>): <description>`

- **Types**: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
- **Scopes**: `ui`, `server`, `config`, `deps`
- Use imperative mood, no capitalization, no trailing period, under 72 chars
