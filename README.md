# Tianwen App

Restaurant POS (Point of Sale) management system, built as a Progressive Web App (PWA).

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Routing**: TanStack Router
- **UI**: shadcn/ui + Radix UI + Tailwind CSS v4
- **State**: Zustand + TanStack Query
- **Forms**: React Hook Form + Zod
- **Database**: SQLite WASM (OPFS)
- **Backup**: Cloudflare R2 (via Vercel Functions)
- **Charts**: Recharts
- **i18n**: react-i18next
- **Build**: Vite 8 + SWC
- **Testing**: Vitest + Testing Library + Playwright
- **Lint/Format**: Oxlint + Oxfmt
- **Deployment**: GitHub Pages (via Release Please)

## Getting Started

```bash
nvm use v24
pnpm install
pnpm dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Type-check and build for production |
| `pnpm test` | Run unit tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm coverage` | Run tests with coverage |
| `pnpm lint` | Lint with Oxlint |
| `pnpm format` | Format with Oxfmt |

## Git Workflow

- **main** — production branch, deployed via Release Please
- **develop** — integration branch for feature development
- Feature branches merge into `develop` via PR
- `develop` merges into `main` for releases

## License

Private
