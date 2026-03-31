# Tianwen App — CLAUDE.md

## Project Overview

**Tianwen App** is a restaurant POS (Point of Sale) management system, built as a PWA (Progressive Web App) deployed on Vercel. The UI language is Traditional Chinese (zh-TW).

---

### Tech Stack

| Category       | V1 (Legacy)              | V2 (Current)                                                           |
| -------------- | ------------------------ | ---------------------------------------------------------------------- |
| Framework      | React 18                 | React 19                                                               |
| Routing        | React Router v7          | TanStack Router                                                        |
| UI Components  | Ant Design v5            | shadcn/ui + Radix UI (primitives) + Magic UI                           |
| UI Theme       | (none)                   | Moss Theme (https://tweakcn.com/themes/cmmi1gb4a000204jl8c300w9a)      |
| CSS            | Emotion CSS-in-JS        | Tailwind CSS v4 + @tailwindcss/vite                                    |
| CSS Utilities  | (none)                   | clsx + tailwind-merge (cn utility) + class-variance-authority          |
| State Mgmt     | (none)                   | Zustand + TanStack Query                                               |
| Forms          | antd Form                | React Hook Form + Zod                                                  |
| Animation      | (none)                   | tw-animate-css + CSS keyframes (replaces Framer Motion, smaller bundle)|
| Icons          | (none)                   | lucide-react                                                           |
| Notifications  | (none)                   | Sonner                                                                 |
| Error Boundary | (none)                   | react-error-boundary                                                   |
| Client DB      | Dexie v4 (IndexedDB)     | @sqlite.org/sqlite-wasm + OPFS (opfs-sahpool VFS)                      |
| Backup         | (none)                   | Vercel Functions + Cloudflare R2 (@aws-sdk/client-s3)                   |
| ID Generation  | (none)                   | nanoid                                                                 |
| i18n           | (none)                   | react-i18next                                                          |
| Charts         | Chart.js                 | Recharts                                                               |
| Lint           | ESLint                   | Oxlint                                                                 |
| Formatter      | Prettier                 | Oxfmt                                                                  |
| Testing        | Vitest + Testing Library | Vitest + Testing Library + Playwright                                  |
| Deployment     | GitHub Pages             | Vercel (Serverless Functions + Static)                                  |
| Cloud Storage  | (none)                   | Cloudflare R2 (S3-compatible, via Vercel Functions)                     |
| Build          | Vite 7                   | Vite 8 + @vitejs/plugin-react-swc                                      |
| Repo           | Same repo, new branch    | Same repo, new branch                                                  |
| Jira           | V1 Project               | V2 Project                                                             |
| Releases       | (none)                   | release-please                                                         |
| Import Alias   | src/                     | @/ → ./src/                                                            |

---

## Git Hooks

`pre-commit` runs automatically:

1. `pnpm run updateManifest` — update manifest version
2. `git add public/manifest.json` — stage the updated manifest

---

## Important Notes

- Use `nvm use v24` before running any Node.js commands
- Package manager is **pnpm** — always use `pnpm` instead of `npm`
- Device support: iPad 10 (2022) and iPad 11 (2025) or later — CSS and interactions must work on these devices
- Code comments: all inline comments and JSDoc must be written in **English**
- Git branching: never commit directly to main branches (master/main) — all changes must go through feature branch + PR workflow
- Do not use bold or font-semibold text
- Must follow Tailwind CSS v4 rules
- All modals must use `src/components/modal/modal.tsx`
- When designing UI, check shadcn/ui for available components first, then custom-build if needed
- All buttons must use `RippleButton`
- Do not use `sm` or smaller font sizes
- Use theme colors: `--color-gold`, `--color-yellow`, `--color-red`, `--color-blue`, `--color-green`
- `ScrollArea` component enables visible scrollbars on iPad PWA — always use `ScrollArea` when scrollbar UI is needed
- Even in **--dangerously-skip-permissions** mode, never delete any files or git branches without user confirmation

---

## Jira Integration

See `.claude/docs/jira-workflow.md` for the Jira integration workflow. Read it before running epic-plan or any Jira-related operations.

---

## Compact Instructions

When compacting, always preserve:

- Current file paths being edited and their modification status
- Test failure messages and error traces
- Architecture decisions made this session
- All TODO items and their completion status

Your context window will be automatically compacted as it approaches its limit,
allowing you to continue working indefinitely from where you left off.
Therefore, do not stop tasks early due to token budget concerns.

## git commit format

All AI-generated git commits must include the following footer:

Generated with Claude Code
Co-Authored-By: Claude noreply@anthropic.com
