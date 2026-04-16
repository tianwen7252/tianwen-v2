# Tianwen V2 CODEMAPS — Architecture & Business Domain

**Last Updated:** 2026-04-11

Welcome to the Tianwen V2 Restaurant POS application CODEMAPS. This directory contains comprehensive architectural documentation organized by business domain, entities, operational flows, and integrations.

## Quick Navigation

| Document | Purpose | Audience |
|----------|---------|----------|
| [01-executive-summary.md](01-executive-summary.md) | 1-page product overview | Everyone |
| [02-entities.md](02-entities.md) | 13 business entities, fields, lifecycle, relationships | Engineers, architects |
| [03-business-rules.md](03-business-rules.md) | 13 invariants & rules with enforcement locations | Business analysts, engineers |
| [04-operational-flows.md](04-operational-flows.md) | 15 end-to-end workflows with entry points & state transitions | Engineers, QA, product |
| [05-integrations.md](05-integrations.md) | R2, Vercel Functions, Google OAuth, SQLite-OPFS, TanStack Query, Zustand | DevOps, backend engineers |
| [06-architecture.md](06-architecture.md) | Subsystems, state boundaries, routing, error handling | Architects, senior engineers |
| [07-glossary.md](07-glossary.md) | Traditional Chinese ↔ English domain vocabulary | All teams |

---

## What is a CODEMAP?

A CODEMAP is a **living architectural document** that:
- Reflects the **actual state** of the codebase
- Includes **file:line citations** so you can jump to code
- Maps **business intent** to implementation
- Evolves with features and refactoring

## Key Concepts

### Business Domain (13 Entities)

The system models a restaurant POS workflow via 13 core tables:

**Core Transactions**
- **Order**: Customer order with items, discounts, fulfillment status
- **OrderItem**: Line item in order (commodity + snapshot price)
- **OrderDiscount**: Discount or credit applied to order

**Menu & Operations**
- **Commodity**: Menu item (bento, drink, stall item)
- **CommodityType**: Category grouping (stall, bento, drink, dumpling, single)
- **OrderType**: Fulfillment mode (delivery, pickup, dine-in) — proto

**Staff & Time Tracking**
- **Employee**: Staff member with clock-in capability, admin privileges
- **Attendance**: Daily punch-in/out record per employee

**Auditing & Analytics**
- **BackupLog**: Backup operation audit (manual/auto/v1-import)
- **ErrorLog**: Application error persistence for diagnostics
- **PriceChangeLog**: Commodity price edit history
- **DailyData**: Daily revenue aggregation for fast analytics queries
- **CustomOrderName**: User-defined item names for re-use in calculator

---

## Business Rules (13 Invariants)

Core constraints and logic:

1. **Stall Category Auto-Memo** — Orders with stall items auto-tagged "攤位"
2. **Backup Scheduling** — Taiwan timezone-aware (UTC+8) backup overdue checks
3. **Backup Retention** — Max 30 backups retained per device; auto-cleanup
4. **Order Snapshot Price** — Item prices captured at order time; immune to future price changes
5. **V1→V2 Idempotency** — Legacy data can be re-imported safely (INSERT OR IGNORE)
6. **Employee Soft-Delete** — Terminated staff marked inactive; records preserved
7. **Order Number Sequence** — Sequential order.number independent of nanoid primary key
8. **Minimum Init UI Duration** — InitOverlay shown minimum 5 seconds
9. **Portrait-Only Orientation** — Landscape mode blocked on iPad
10. **Device Identity Tracking** — Each device has unique DEVICE_ID for backup scope
11. **No Global User Login** — Staff selected per-order; no persistent authentication
12. **Order Edit Flow** — Editing deletes old items/discounts, creates new ones
13. **Gzip Compression** — Backups gzip-compressed before upload (60–80% bandwidth savings)

---

## Operational Flows (15 Workflows)

End-to-end sequences from user action to persistence:

| # | Flow | Entry Point | Key System Changes |
|----|------|------------|-------------------|
| 1 | Bootstrap | App cold-start | Init DB schema, seed data, check auto-backup |
| 2 | Order Entry | OrderPage | Create order_items, order_discounts, update daily_data |
| 3 | Order Edit | OrdersPage edit icon | Delete old items, create new ones, preserve original_total |
| 4 | Mark Served | OrdersPage | Toggle is_served flag |
| 5 | Clock-In/Out | ClockInPage | Create/update attendance with timestamp |
| 6 | Product Management | Settings > Products | Update commodity, create price_change_logs |
| 7 | Analytics | AnalyticsPage | Query daily_data aggregates, render charts |
| 8 | Manual Backup | Settings > Cloud Backup | Gzip DB, get presigned URL, upload to R2, cleanup |
| 9 | Auto-Backup | useAutoBackup hook | Check schedule, trigger backup if overdue |
| 10 | Cloud Restore | Settings > Restore | Download from R2, decompress, replace DB |
| 11 | V1→V2 Import | First launch (if legacy data) | Transform Dexie data, INSERT OR IGNORE |
| 12 | Staff Management | Settings > Staff | Add/edit/soft-delete employees |
| 13 | Google OAuth | Staff card > Link Google | Bind employee to Google account |
| 14 | Error Handling | Any exception | Log to error_logs, show ErrorOverlay |
| 15 | PWA Update | Service Worker | Detect new version, reload app |

---

## External Integrations (6 Systems)

**Data Persistence**
- **SQLite WASM + OPFS**: Client-side persistent database (offline-capable)

**Cloud Storage & Backup**
- **Cloudflare R2**: Backup file storage (S3-compatible)

**Backend & API**
- **Vercel Serverless Functions**: Presigned URLs, backup verification, health checks

**Authentication**
- **Google Identity Services (OAuth)**: Staff account binding

**State Management**
- **Zustand**: Session state (orders, app config)
- **TanStack Query**: Server state caching (mostly unused; future ready)

---

## Architecture Layers

```
┌───────────────────────────────────────────────────────────┐
│               UI Layer (React 19 + Tailwind)              │
│  Pages: Order, ClockIn, Records, StaffAdmin, Settings    │
└───────────────────────────────────────────────────────────┘
                          ↓
┌───────────────────────────────────────────────────────────┐
│            State Management (Zustand + TanStack)          │
│  OrderStore, BackupStore, InitStore, AppStore            │
└───────────────────────────────────────────────────────────┘
                          ↓
┌───────────────────────────────────────────────────────────┐
│           Repository Layer (Data Access)                  │
│  OrderRepository, EmployeeRepository, etc.                │
└───────────────────────────────────────────────────────────┘
                          ↓
┌───────────────────────────────────────────────────────────┐
│         Database Layer (SQLite WASM + OPFS)               │
│  Web Worker → AsyncDatabase → SQLiteWasmDatabase          │
└───────────────────────────────────────────────────────────┘
                          ↓
┌───────────────────────────────────────────────────────────┐
│        API & Cloud Integration Layer                      │
│  Vercel Functions ↔ Cloudflare R2 ↔ Google OAuth         │
└───────────────────────────────────────────────────────────┘
```

---

## How to Use These Codemaps

1. **New to the project?** Start with [01-executive-summary.md](01-executive-summary.md)
2. **Understanding a feature?** Look up the entity in [02-entities.md](02-entities.md), then find related flows in [04-operational-flows.md](04-operational-flows.md)
3. **Debugging a bug?** Check [03-business-rules.md](03-business-rules.md) for invariants, then use file:line citations to jump to code
4. **Adding a new integration?** Review [05-integrations.md](05-integrations.md) and [06-architecture.md](06-architecture.md)
5. **Translating UI strings?** Consult [07-glossary.md](07-glossary.md) for domain terminology

---

## Key Technologies

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TanStack Router, Tailwind CSS v4 |
| **UI Components** | shadcn/ui, Radix UI, Magic UI |
| **State** | Zustand, TanStack Query |
| **Forms** | React Hook Form, Zod |
| **Database** | SQLite WASM, OPFS (Open File System Access) |
| **Backup** | Cloudflare R2, Vercel Functions |
| **Auth** | Google OAuth, device identity |
| **Deployment** | Vercel (frontend + serverless functions) |

---

## Document Maintenance

These CODEMAPS are **source-of-truth** documentation. Update them when:

- **Major features** are added (new entity, flow, integration)
- **Business rules** change or new invariants are discovered
- **Architecture shifts** (e.g., new state management pattern)
- **File locations** change (refactoring)

Keep file:line citations **fresh**. If a file moves or code changes significantly, update the citation.

---

## Questions & Gaps

For known gaps or open questions, see [04-operational-flows.md](#open-questions) (end of that document). Current known unknowns:

- Order type differentiation (currently proto)
- Multi-device synchronization strategy
- Real-time analytics (current: point-in-time snapshots)
- Inventory management
- Formal audit trail for order edits

---

## Generated

**Original Report**: `/tmp/tianwen-business-domain-report.md` (comprehensive 54KB discovery)  
**Codemaps Compiled**: 2026-04-11  
**Total Entities**: 13 | **Total Rules**: 13 | **Total Flows**: 15 | **Total Integrations**: 6
