# Tianwen V2 Architecture

**Last Updated:** 2026-04-11

This document describes the high-level architecture, subsystems, state boundaries, routing, error handling, and overlay system.

---

## Architectural Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    Presentation Layer                           │
│  React 19 + Tailwind CSS v4 + shadcn/ui                        │
│  Pages: OrderPage, ClockInPage, RecordsPage, SettingsPage      │
│  Components: OrderEntry, EmployeeCard, Charts, Overlays        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│               State Management Layer                            │
│  Zustand Stores (session state):                               │
│  • useOrderStore — cart, operator, edit mode                    │
│  • useBackupStore — schedule, last backup time, progress        │
│  • useInitStore — bootstrap, overlay visibility, errors         │
│  • useAppStore — theme, language, device settings              │
│                                                                  │
│  TanStack Query (server state, mostly unused):                 │
│  • Future: backup list, multi-device sync, cloud analytics      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│               Repository Layer (Data Access)                    │
│  Async repository classes with type-safe queries:              │
│  • OrderRepository — CRUD for orders                            │
│  • EmployeeRepository — CRUD for employees                      │
│  • CommodityRepository — CRUD for menu items                    │
│  • AttendanceRepository — CRUD for time records                │
│  • StatisticsRepository — Aggregation queries for analytics    │
│  • BackupLogRepository — Audit trail for backups               │
│  • ErrorLogRepository — Diagnostic error persistence           │
│  All use AsyncDatabase interface (non-blocking Web Worker)     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│               Database Layer (SQLite WASM)                      │
│  AsyncDatabase interface wraps Web Worker communication         │
│  SQLiteWasmDatabase runs in Web Worker (db-worker.ts)         │
│  opfs-sahpool VFS provides OPFS persistence                    │
│  Schema: 13 tables (orders, commodities, employees, etc.)      │
│  Migrations handled on every app start                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│         API & Cloud Integration Layer (Edge)                    │
│  Vercel Functions (serverless Node.js):                        │
│  • /api/backup/presign — Generate presigned URLs              │
│  • /api/backup/complete — Verify + cleanup old backups         │
│  • /api/backup — List available backups                        │
│  Cloudflare R2 (S3-compatible storage):                        │
│  • Backup file storage with gzip compression                  │
│  • Retention: max 30 backups per device                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Subsystems

### 1. Order Entry Subsystem

**Components**:

- `src/pages/order/OrderPage.tsx` — Main order UI with category tabs, commodity grid
- `src/stores/order-store.ts` — Cart state (items, discounts, operator)
- `src/lib/repositories/order-repository.ts` — Order persistence
- `src/lib/repositories/order-item-repository.ts` — Line item CRUD
- `src/lib/repositories/order-discount-repository.ts` — Discount CRUD

**Data Flow**:

```
User Input (tap commodity)
    ↓
useOrderStore.addItem(commodity)
    ↓ (snapshot price captured)
CartItem object (in-memory state)
    ↓
User Submits (tap "Submit Order")
    ↓
useOrderStore.submitOrder()
    ↓
OrderRepository.create({ items, discounts, total, operator, memo })
    ↓
Insert: orders, order_items, order_discounts (atomic transaction)
    ↓
Update daily_data (aggregate revenue)
    ↓
Clear cart, show success
```

**Key File Locations**:

- `src/pages/order/` — UI components
- `src/stores/order-store.ts:1–150` — State management
- `src/lib/repositories/order-*.ts` — Persistence

---

### 2. Employee Management Subsystem

**Components**:

- `src/pages/clock-in/ClockInPage.tsx` — Clock-in/out UI
- `src/pages/records/RecordsPage.tsx` — Attendance history (admin view)
- `src/pages/settings/StaffAdmin.tsx` — Employee CRUD
- `src/lib/repositories/employee-repository.ts` — Employee CRUD
- `src/lib/repositories/attendance-repository.ts` — Attendance CRUD

**Data Flow**:

```
Employee Management:
  Admin Input → EmployeeRepository.create/update/delete()
             → SQLite persisted
             → ClockInPage filters active employees

Clock-In/Out:
  Employee taps name → AttendanceRepository.findByEmployeeAndDate()
                     → If not found, create new
                     → User taps "Clock In" → update clock_in timestamp
                     → User taps "Clock Out" → update clock_out timestamp
                     → RecordsPage aggregates hours worked
```

**Key File Locations**:

- `src/pages/clock-in/` — Clock-in UI
- `src/pages/records/` — Admin records view
- `src/pages/settings/staff-admin.tsx` — Staff management
- `src/lib/repositories/employee-repository.ts` — Employee CRUD
- `src/lib/repositories/attendance-repository.ts` — Attendance CRUD

---

### 3. Product Management Subsystem

**Components**:

- `src/pages/settings/ProductManagement.tsx` — UI for editing commodities
- `src/lib/repositories/commodity-repository.ts` — Commodity CRUD
- `src/lib/repositories/commodity-type-repository.ts` — Category CRUD
- `src/lib/repositories/price-change-log-repository.ts` — Audit trail

**Data Flow**:

```
Admin edits commodity (name, price, on_market)
    ↓
CommodityRepository.update(id, { price: newPrice, ... })
    ↓
Compare old_price vs new_price
    ↓
If different → PriceChangeLogRepository.create(audit entry)
    ↓
Update SQLite
    ↓
Refresh UI
```

**Price Snapshot Protection**:

- When order created, item.price = current commodity.price (snapshot)
- Future price changes don't affect past orders
- New orders see new prices

**Key File Locations**:

- `src/pages/settings/product-management.tsx`
- `src/lib/repositories/commodity-repository.ts`
- `src/lib/repositories/price-change-log-repository.ts`

---

### 4. Analytics Subsystem

**Components**:

- `src/pages/analytics/AnalyticsPage.tsx` — Main dashboard
- `src/lib/repositories/statistics-repository.ts` — Aggregation queries
- `src/lib/repositories/daily-data-repository.ts` — Daily revenue aggregates
- `src/components/charts/` — Recharts visualizations

**Data Flow**:

```
User opens Analytics page
    ↓
StatisticsRepository runs parallel queries:
  • getProductKpis() → Top products by quantity
  • getHourlyBucket() → Revenue by hour
  • getDailyRevenue() → Daily trend
  • getStaffKpis() → Employee performance
  • getAmPmRevenue() → Morning vs afternoon
    ↓
Recharts renders visualizations
    ↓
User selects date range
    ↓
Re-run queries with filters
    ↓
Charts update
```

**Note**: Analytics is **point-in-time** (no real-time). Refresh page to see new orders.

**Key File Locations**:

- `src/pages/analytics/analytics-page.tsx`
- `src/lib/repositories/statistics-repository.ts`
- `src/components/charts/`

---

### 5. Backup & Restore Subsystem

**Components**:

- `src/components/settings/cloud-backup.tsx` — Backup UI
- `src/lib/backup.ts` — Compression, encryption, upload logic
- `src/stores/backup-store.ts` — Backup schedule state
- `src/hooks/use-auto-backup.ts` — Auto-backup scheduler
- `api/backup/presign.ts` — Presigned URL generation (Vercel)
- `api/backup/complete.ts` — Verification & cleanup (Vercel)
- `api/backup/index.ts` — List backups (Vercel)

**Data Flow**:

**Manual Backup**:

```
User taps "Backup Now"
    ↓
useBackupStore.startBackup() (progress=0)
    ↓
Database.exec() → export all tables as Uint8Array
    ↓
compress(data) using CompressionStream('gzip')
    ↓ (progress=30)
getPresignedUrl('upload', filename)
    ↓
Fetch PUT presigned URL (upload compressed file to R2)
    ↓ (progress=90)
notifyUploadComplete(filename) → /api/backup/complete
    ↓
Backend verifies file exists
    ↓
Backend lists all backups, deletes oldest if count > 30
    ↓
BackupLogRepository.create(success entry)
    ↓
useBackupStore.finishBackup() (progress=100)
    ↓
Show success toast
```

**Auto-Backup**:

```
App startup → useAutoBackup hook fires
    ↓
isBackupOverdue(schedule, lastBackupTime)?
    ↓
If yes → Execute manual backup (type='auto')
If no  → Skip
    ↓
Continue with app
```

**Cloud Restore**:

```
User taps "Restore from Cloud"
    ↓
BackupService.listBackups() → /api/backup → list all files
    ↓
User selects backup
    ↓
getPresignedUrl('download', filename)
    ↓
Fetch GET presigned URL (download from R2)
    ↓
decompress(compressedData)
    ↓
Show WaitingOverlay ("Restoring...")
    ↓
Database.close(), replace DB file, re-connect
    ↓
window.location.reload()
    ↓
App reloads with restored data
```

**Key File Locations**:

- `src/components/settings/cloud-backup.tsx`
- `src/lib/backup.ts`
- `src/lib/backup-schedule.ts`
- `src/hooks/use-auto-backup.ts`
- `src/stores/backup-store.ts`
- `api/backup/*.ts`

---

### 6. Bootstrap & Initialization Subsystem

**Components**:

- `src/routes/route-tree.tsx` — RootLayout (bootstrap orchestrator)
- `src/stores/init-store.ts` — Bootstrap state
- `src/lib/worker-database.ts` — DB initialization
- `src/lib/schema.ts` — Schema definition & migrations
- `src/constants/default-data.ts` — Seed data
- `src/components/init-ui/InitOverlay.tsx` — Init overlay UI

**Data Flow**:

```
1. App mounts → RootLayout renders
    ↓
2. useInitStore.setShowInitUI() → InitOverlay displayed (min 5s)
    ↓
3. useInitStore triggers database init (Web Worker)
    ↓
4. Worker loads SQLite WASM binary
    ↓
5. Worker runs initSchema() → create tables if not exists, run migrations
    ↓
6. Check localStorage for VERSION_KEY → if missing, insertDefaultData()
    ↓
7. hydrateBackupScheduleFromDb() → load lastBackupTime, schedule type
    ↓
8. isBackupOverdue()? → if yes, trigger useAutoBackup()
    ↓
9. useInitStore.setBootstrapDone(true) after min 5s
    ↓
10. InitOverlay dismissed, app content rendered
```

**Key File Locations**:

- `src/routes/route-tree.tsx`
- `src/stores/init-store.ts`
- `src/lib/worker-database.ts`
- `src/lib/schema.ts:479–485`
- `src/constants/default-data.ts`

---

### 7. Error Handling & Diagnostics Subsystem

**Components**:

- `src/lib/error-logger.ts` — logError() function
- `src/lib/repositories/error-log-repository.ts` — Error persistence
- `src/components/error-ui/ErrorOverlay.tsx` — Error display
- `src/components/error-ui/ErrorCanvas.tsx` — Error animation (WebGL)
- `src/components/AppErrorBoundary.tsx` — Global error boundary

**Data Flow**:

```
Exception thrown (async or render)
    ↓
logError(err, source) called
    ↓
ErrorLogRepository.create({ message, source, stack })
    ↓
Error persisted to error_logs table
    ↓
ErrorOverlay shown (modal or full-screen canvas)
    ↓
User sees: error message, "Retry" button, "Go Home" button
    ↓
User action: Retry | Go Home | Reload
```

**Multi-Layer**:

1. **Global Render Boundary** (AppErrorBoundary) — catches React render errors
2. **Page-Level Boundaries** — isolate page crashes
3. **Async Try-Catch** — log and recover in effects/handlers
4. **ErrorOverlay UI** — user-friendly error display
5. **Persistent Logging** — error_logs table for diagnostics

**Key File Locations**:

- `src/lib/error-logger.ts`
- `src/lib/repositories/error-log-repository.ts`
- `src/components/error-ui/`
- `src/components/app-error-boundary.tsx`

---

## State Boundaries

### UI State (Zustand Stores)

**Ephemeral** (cleared on app reload):

- `useOrderStore` — cart (items, discounts, operator, edit mode)
- `useInitStore` — bootstrap flags, overlay visibility

**Persisted** (via localStorage or SQLite):

- `useBackupStore` — schedule type, last backup time (hydrated from DB on startup)
- `useAppStore` — theme, language, device settings

**Scope**: Single browser tab/window

**Lifespan**: Session

### Business State (SQLite Database)

**Persistent** (survives app reload and device reboot):

- Orders, order_items, order_discounts
- Employees, attendances
- Commodities, commodity_types
- Daily revenue aggregates (daily_data)
- Audit trails (backup_logs, error_logs, price_change_logs)

**Scope**: Single device (OPFS-persisted)

**Lifespan**: Indefinite (until manual delete or restore)

### Cloud State (Cloudflare R2)

**Persisted Backups**:

- Database snapshots (gzip-compressed `.sqlite.gz`)
- Max 30 per device

**Scope**: Cross-device (any device can restore any other device's backup)

**Lifespan**: User-configured (latest 30 kept)

### Server State (Vercel Functions + R2)

**Transient**:

- Presigned URLs (10-minute lifetime)
- Backup cleanup job (runs on each upload completion)

**Scope**: Global

**Lifespan**: Short-lived

---

## Routing & Navigation

**Framework**: TanStack Router (file-based routing)

**Configuration** (src/routes/route-tree.tsx):

```typescript
const rootRoute = createRootRoute({
  component: RootLayout, // Wraps all pages with nav, overlays
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: OrderPage,
})

const clockInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clock-in',
  component: ClockInPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
  // Nested: /settings/staff, /settings/products, /settings/backup
})

// Export routes
const routeTree = rootRoute.addChildren([
  indexRoute,
  clockInRoute,
  settingsRoute,
])
```

**Page Structure**:

```
Root Layout (navigation bar, overlays)
  ├── OrderPage (/)
  ├── ClockInPage (/clock-in)
  ├── RecordsPage (/records)
  ├── OrdersPage (/orders)
  ├── AnalyticsPage (/analytics)
  └── SettingsPage (/settings)
      ├── SystemInfo
      ├── StaffAdmin
      ├── ProductManagement
      ├── CloudBackup
      ├── GoogleOAuth
```

**Lazy Loading**:

- Main pages (OrderPage, ClockInPage, etc.) → separate chunks
- Reduces initial bundle
- Chunks loaded on-demand when user navigates

---

## Overlay System

**Purpose**: Render full-screen or modal overlays for initialization, errors, and long-running operations.

**Three Overlays** (self-registering via useInitStore):

### 1. InitOverlay (src/components/init-ui/InitOverlay.tsx)

**Purpose**: Database initialization and minimum 5-second display

**States**:

- `showing=true` — InitOverlay displayed
- `shownAt: timestamp` — When overlay first shown
- `canDismiss: elapsed >= 5000ms`

**Triggers**:

- App cold-start (Bootstrap flow)
- DB re-initialization (restore, error recovery)

**Content**:

- Spinner + "Initializing database..." message
- Optional progress (V1 import shows phases)

### 2. ErrorOverlay (src/components/error-ui/ErrorOverlay.tsx)

**Purpose**: Display application errors with recovery options

**States**:

- `error: { message, source, stack }`
- `dismissible: boolean` (critical errors may not be dismissible)

**Triggers**:

- Caught exception in try-catch
- React error boundary
- API call failure

**Content**:

- Error message
- Optional stack trace (dev mode)
- "Retry" button (re-trigger operation)
- "Go Home" button (navigate to OrderPage)
- Optional "Reload" button (hard reload)

**Variants**:

- Modal dialog (soft errors)
- Full-screen canvas (critical, with WebGL error animation)

### 3. WaitingOverlay (src/components/waiting-ui/WaitingOverlay.tsx)

**Purpose**: Progress indicator for long-running operations

**States**:

- `visible: boolean`
- `progress: number` (0–100)
- `message: string` ("Backing up...", "Restoring...", etc.)

**Triggers**:

- Manual backup (progress: 0 → 30 → 50 → 90 → 100)
- Cloud restore (progress: download → decompress → replace DB)
- App portrait enforcement (while waiting for device rotation)

**Content**:

- Progress bar or spinner
- Message text
- Optional cancel button

### Integration in RootLayout

```typescript
// src/routes/route-tree.tsx
export function RootLayout() {
  const { showInitUI, bootstrapDone } = useInitStore();
  const { isBackingUp, progress } = useBackupStore();

  return (
    <>
      {/* Main content */}
      {bootstrapDone && <Outlet />}

      {/* Overlays (layered) */}
      {showInitUI && <InitOverlay />}
      {errorState && <ErrorOverlay />}
      {isBackingUp && <WaitingOverlay progress={progress} />}

      {/* Portrait enforcement */}
      {!isPortrait && <WaitingOverlay message="Please rotate device" />}
    </>
  );
}
```

**Z-Index Ordering**:

1. InitOverlay (highest, blocks app during init)
2. ErrorOverlay (high, shows error)
3. WaitingOverlay (medium, progress indicator)
4. Portrait blocker (high, blocks landscape)
5. Main content (base)

---

## Data Model Architecture

**13 Core Entities** (SQLite tables):

```
Core Transactions:
  Order → (1:N) OrderItem
  Order → (1:N) OrderDiscount

Menu & Operations:
  CommodityType → (1:N) Commodity
  Commodity → (1:N) OrderItem
  Commodity → (1:N) PriceChangeLog
  OrderType (proto; unused)

Staff & Time:
  Employee → (1:N) Attendance
  Employee ← (loose ref) Order.editor

Auditing & Analytics:
  BackupLog (backup operations)
  ErrorLog (diagnostics)
  DailyData (daily revenue aggregate)
  CustomOrderName (calculator suggestions)
```

**Relationship Patterns**:

- **Hard FK**: Orders → OrderItems (not deletable without constraint check)
- **Loose Ref**: Order.editor → Employees (soft reference; deletes allowed)
- **Aggregate**: DailyData aggregates Orders by date
- **Audit**: PriceChangeLog, BackupLog, ErrorLog record changes

---

## Performance Optimizations

### Database Query Optimization

- **Indexes**: Created on frequently queried columns (date, employee_id, commodity_id)
- **Aggregates**: DailyData pre-computed for fast analytics queries
- **Pagination**: Orders listed by date range (not unbounded)
- **Lazy Loading**: Related entities (items, discounts) loaded on-demand

### Bundle Optimization

- **Code Splitting**: Pages lazy-loaded (separate chunks)
- **Tree Shaking**: Unused code removed
- **Compression**: Gzip on server (Vercel automatic)
- **No Animation Library**: CSS keyframes instead of Framer Motion

### UI Optimization

- **Virtual Lists**: Not needed (typical <100 orders/day)
- **Memoization**: useCallback, useMemo for expensive computations
- **Web Worker**: SQLite queries non-blocking
- **Pagination**: Analytics by date range, not unbounded

---

## Security Considerations

### Client-Side

- No hardcoded secrets (environment variables only)
- No XSS vectors (React escapes by default)
- localStorage: No sensitive data (device ID is non-sensitive)

### Backend (Vercel Functions)

- Credentials stored in env vars (not committed)
- Presigned URLs expire in 10 minutes
- R2 bucket private (no public read/write)

### Data

- SQLite backup gzip-compressed
- No encrypted backup option (could be added)
- No user-level access control (device-based, not user-based)

### Auth

- No global login (staff per-order selection)
- Google OAuth optional (for multi-device recognition)
- Admin flag checked locally (no server validation)

---

## Testing Architecture

**Test Organization**:

```
src/
  __tests__/
    unit/          — Single function/component tests
    integration/   — Multi-layer tests (store + repo)
    e2e/           — Full user flows (with Playwright)

api/
  __tests__/       — Vercel Functions tests (mock R2)
```

**Test Types**:

1. **Unit** — Utility functions, Zustand stores, repositories
2. **Integration** — Store → Repository → Database
3. **E2E** — User flows (Playwright) with real SQLite

**Mocks**:

- R2 API (mock S3Client in tests)
- Dates/timestamps (vi.useFakeTimers)
- Web Worker (optional; use real async in most tests)

---

## Deployment Architecture

**Frontend** (src/): Deployed to Vercel

- Automatic builds on push
- Serverless static hosting
- CDN distribution

**Backend** (api/): Deployed to Vercel

- Automatic builds from /api directory
- Serverless Node.js functions
- Environment variables from Vercel dashboard

**Cloud Storage**: Cloudflare R2

- S3-compatible API
- Automatic CDN caching for presigned URLs
- CORS configured for cross-origin requests

**Workflow**:

```
Git push → GitHub → Vercel webhook
                      ↓
                   Build frontend + api
                      ↓
                   Deploy to Vercel CDN
                      ↓
                   App accessible at https://tianwen.vercel.app
```

---

## Summary

Tianwen V2 is a **7-subsystem architecture**:

1. **Order Entry** — Cart state, order creation, daily aggregation
2. **Employee Management** — Staff roster, clock-in/out, attendance history
3. **Product Management** — Commodity CRUD, price history
4. **Analytics** — Aggregation queries, Recharts visualization
5. **Backup & Restore** — Compression, presigned URLs, R2 storage, auto-scheduling
6. **Bootstrap & Init** — DB schema, migrations, seed data, auto-backup trigger
7. **Error Handling** — Multi-layer error boundaries, persistent logging, user recovery

**Data flows** from UI (React) → State (Zustand) → Repository (type-safe CRUD) → Database (SQLite WASM) → Cloud (R2 backups).

**Overlays** manage critical flows: initialization (InitOverlay), errors (ErrorOverlay), long-running ops (WaitingOverlay).

**Routing** via TanStack Router with lazy-loaded pages.

**Performance** optimized via code splitting, Web Worker, pre-computed aggregates, and gzip compression.

---

**Next Steps:**

- For detailed entity definitions, see [02-entities.md](02-entities.md)
- For business rules enforced across subsystems, see [03-business-rules.md](03-business-rules.md)
- For operational workflows, see [04-operational-flows.md](04-operational-flows.md)
- For external integrations, see [05-integrations.md](05-integrations.md)
