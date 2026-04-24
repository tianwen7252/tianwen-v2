# Tianwen V2 Executive Summary

**Last Updated:** 2026-04-11  
**Product:** Restaurant POS Progressive Web App (PWA)  
**Markets:** Taiwan (zh-TW primary, en secondary)  
**Deployment:** Vercel (frontend + serverless API)

---

## What is Tianwen V2?

**Tianwen** is an offline-first restaurant point-of-sale (POS) system for small-to-medium dining operations in Taiwan. Built as a Progressive Web App (PWA), it enables iPad-based order entry, employee time tracking, and cloud-resilient data backup.

### Core Value Propositions

| Pillar                  | Capability                                                                        |
| ----------------------- | --------------------------------------------------------------------------------- |
| **Offline-First**       | Take orders, manage staff, view analytics without internet; sync via cloud backup |
| **Cloud-Resilient**     | Automatic daily/weekly backup to Cloudflare R2; one-click cloud restore           |
| **Mobile-Native**       | iPad-optimized UI (portrait-only, touch gestures); installed as homescreen app    |
| **Multi-Device**        | Each device has independent offline DB; unique device identity for backup scoping |
| **Real-Time Reporting** | Daily revenue KPIs, product sales rankings, staff performance metrics             |

---

## Operational Scope

### User Roles

- **Operator** — Takes orders via touch interface; selects order type (stall, delivery, pickup)
- **Manager** — Views analytics, marks orders as served, manages employee attendance
- **Admin** — Configures products/prices, manages staff roster, triggers backups, views error logs

### Core Workflows

1. **Order Entry**: Touch commodity card → add to cart → apply discounts → submit
2. **Order Management**: View today's orders → mark as served → edit/reprint
3. **Staff Clock-In**: Employee touches name card → punch in/out or apply vacation
4. **Analytics**: View daily revenue, hourly trends, product KPIs, staff performance
5. **Backup**: Manual backup on-demand; automatic daily/weekly backup with cloud restore
6. **Product Admin**: Add/edit commodities, set prices, manage categories

### Device Support

- **iPad 10 (2022)** and later
- **Orientation**: Portrait-only (landscape blocked)
- **Network**: Works fully offline; backups require internet
- **Browser**: Safari, Chrome (WebGL shaders for error animation)

---

## Business Model

### Data Scope

**Transaction Data**

- **Orders** — Customer orders with items, discounts, timestamps
- **Order Items** — Line items with snapshot prices (price changes don't affect past orders)
- **Discounts** — Manual discounts applied per order

**Operational Data**

- **Commodities** — Menu items (name, price, category, availability)
- **Employees** — Staff roster with shift type, admin privileges, employment dates
- **Attendance** — Daily punch-in/out or vacation records

**Reporting Data**

- **Daily Data** — Pre-aggregated daily revenue for fast chart queries
- **Analytics** — On-demand aggregation of sales by product, hour, staff, payment

**Audit Data**

- **Backup Logs** — Backup operations (manual/auto/v1-import) with status, file size, duration
- **Error Logs** — Application errors for diagnostics
- **Price Change Logs** — Commodity price edits with old→new snapshot
- **Custom Order Names** — User-defined item names for calculator re-use

### Backup Policy

| Schedule  | Frequency                      | Retention                         | Transport                  |
| --------- | ------------------------------ | --------------------------------- | -------------------------- |
| Manual    | On-demand                      | Latest 30 per device              | Gzip + presigned URL to R2 |
| Auto      | Daily or weekly (configurable) | Latest 30 per device              | Gzip + presigned URL to R2 |
| V1 Legacy | One-time import                | Deduplicated via INSERT OR IGNORE | No transport               |

---

## Technical Architecture

### Layered Stack

```
┌─────────────────────────────────────────────────────────┐
│           UI Layer (React 19 + Tailwind CSS)            │
│  Modular pages: Order, ClockIn, Records, Analytics     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│       State Management (Zustand + TanStack Query)       │
│  OrderStore, BackupStore, InitStore, AppStore          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│         Repository Layer (Async Data Access)            │
│  OrderRepository, EmployeeRepository, etc.              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│    SQLite WASM + OPFS (Persistent Client DB)           │
│  Web Worker handles non-blocking queries                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│       Vercel Functions + Cloudflare R2 (Cloud)         │
│  Presigned URLs, backup verification, file cleanup      │
└─────────────────────────────────────────────────────────┘
```

### Key Technologies

| Category           | Choice                     | Rationale                                    |
| ------------------ | -------------------------- | -------------------------------------------- |
| **Framework**      | React 19                   | Latest stable; Server Components ready       |
| **Routing**        | TanStack Router            | File-based, type-safe                        |
| **CSS**            | Tailwind CSS v4            | Utility-first, low bundle size               |
| **UI Primitives**  | shadcn/ui + Radix          | Accessible, composable                       |
| **Forms**          | React Hook Form + Zod      | Lightweight validation, DX                   |
| **State (UI)**     | Zustand                    | Minimal boilerplate, persistent store option |
| **State (Server)** | TanStack Query             | Future API expansion ready                   |
| **Database**       | SQLite WASM + OPFS         | Offline-capable, near-native performance     |
| **Backup**         | Cloudflare R2              | S3-compatible, cheap, edge-optimized         |
| **Backend**        | Vercel Functions           | Serverless, no infrastructure overhead       |
| **Auth**           | Google OAuth               | Staff account binding (optional)             |
| **Animation**      | CSS keyframes + tw-animate | Smaller bundle than Framer Motion            |
| **Charts**         | Recharts                   | Lightweight, responsive                      |
| **Icons**          | lucide-react               | Modern, consistent                           |
| **Testing**        | Vitest + Playwright        | Fast, DX-focused                             |
| **Linting**        | Oxlint                     | Rust-based, faster than ESLint               |
| **Formatting**     | Oxfmt                      | Rust-based, faster than Prettier             |
| **i18n**           | react-i18next              | Traditional Chinese (zh-TW) primary          |

---

## Business Rules Highlights

### Immutable Orders

Once submitted, an order's items retain their snapshot prices. Editing an order creates new item records without mutating originals. This prevents:

- Revenue audit discrepancies from price changes
- Customer surprise when reprinting old receipts

### Backup Scheduling (Taiwan Timezone)

Backup overdue checks respect Taiwan time (UTC+8), not server time. This ensures:

- Restaurants in Taiwan see "overdue" at midnight _Taiwan time_, not UTC
- Daily backup runs once per calendar day in Taiwan
- Weekly backup aligns to Monday in Taiwan timezone

### Auto-Memo Tagging

Orders containing items from the "stall" category automatically receive a memo tag "攤位" (stall/side items). This helps kitchen staff quickly identify orders with side items without reading full manifest.

### Device Identity

Each browser has a unique DEVICE_ID stored in localStorage. This enables:

- Per-device backup scoping (e.g., "restore backup from iPad A only")
- Multi-device deployments with separate data per device
- Device-specific error diagnostics

---

## Data Integrity & Resilience

### Multi-Layer Error Handling

1. **Global Error Boundary** — Catches React render errors, prevents white-screen
2. **Page-Level Boundaries** — Isolates page crashes
3. **Async Try-Catch** — Logs detailed errors to persistent error_logs table
4. **ErrorOverlay UI** — Shows user-friendly error + retry/home actions
5. **Manual Diagnostics** — Admin can review error_logs for debugging

### Backup Guarantees

- **Compression**: Database gzip-compressed before upload (5MB → 1–2MB; 60–80% savings)
- **Retention**: Latest 30 backups kept per device; oldest auto-deleted
- **Verification**: Backend verifies file exists after upload before marking success
- **Idempotency**: V1→V2 import uses INSERT OR IGNORE, safe to re-run
- **Restore**: One-click restore replaces DB and reloads app

---

## Internationalization

| Aspect                 | Details                                        |
| ---------------------- | ---------------------------------------------- |
| **Primary Language**   | Traditional Chinese (zh-TW)                    |
| **Secondary Language** | English (en) — partial coverage                |
| **Timezone**           | Taiwan (UTC+8) hardcoded for backup scheduling |
| **Date Format**        | YYYY-MM-DD (ISO; storage + some UI displays)   |
| **Currency**           | Taiwan Dollar (TWD); implicit in prices        |

---

## Future Roadmap Hints

### Planned Enhancements

1. **Order Type Differentiation** — `order_types` table exists but unused; future: tag orders as delivery/dine-in/pickup
2. **Multi-Device Sync** — Currently each device independent; future: R2-based watch/sync hub
3. **Real-Time Analytics** — Current dashboard is point-in-time; future: WebSocket for live KPI updates
4. **Inventory Management** — No stock tracking; future: low-stock alerts
5. **Formal Audit Trail** — No explicit order_edit_logs; future: before/after snapshots for compliance
6. **Receipt Printing** — Order number assigned but no POS printer integration
7. **Preset Discounts** — Currently manual entry; future: templates like "Member 10% off"
8. **Data Export** — No CSV/JSON export for accounting; future: auditor-friendly exports

---

## Success Metrics

### For Operators

- Orders created in < 20 seconds (touch commodity → submit)
- Offline order entry works without network
- Error recovery intuitive (retry / go home)

### For Managers

- Daily analytics load in < 2 seconds
- Revenue KPIs visible at a glance
- Order history searchable by date range

### For Admins

- Backup completes in < 60 seconds
- Restore available on all devices
- Error logs help diagnose issues

### For Business

- Zero data loss (automatic backup)
- iPad-native experience (no app store friction)
- Supports 50+ orders/day without slowdown

---

## Key Files for Quick Reference

| What You Want              | Where to Look                                             |
| -------------------------- | --------------------------------------------------------- |
| Schema definition          | `src/lib/schema.ts`                                       |
| Business rules             | `src/stores/order-store.ts`, `src/lib/backup-schedule.ts` |
| Repositories (data access) | `src/lib/repositories/*.ts`                               |
| UI pages                   | `src/pages/*.tsx`                                         |
| Vercel API                 | `api/backup/*.ts`                                         |
| Zustand stores             | `src/stores/*.ts`                                         |
| Localization               | `src/locales/zh-TW.json`                                  |

---

## Summary

Tianwen V2 is a **focused, offline-first POS system** purpose-built for Taiwanese restaurant operators. It prioritizes **data persistence** (SQLite WASM), **cloud resilience** (automatic backup), and **intuitive UX** (gesture-based order entry). The architecture cleanly separates concerns: UI (React), state (Zustand), data access (repositories), and storage (SQLite + R2). Business logic is explicit via domain rules (stall auto-memo, snapshot pricing, timezone-aware backup scheduling). Error handling is multi-layered to ensure users can always recover. The system scales comfortably to 50+ orders/day and handles complex workflows (order edits, staff clock-in, analytics) without specialized backend infrastructure.

---

**Next Steps:**

- For entity definitions, see [02-entities.md](02-entities.md)
- For business rules detail, see [03-business-rules.md](03-business-rules.md)
- For operational workflows, see [04-operational-flows.md](04-operational-flows.md)
