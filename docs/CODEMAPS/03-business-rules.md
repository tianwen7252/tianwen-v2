# Tianwen V2 Business Rules & Invariants

**Last Updated:** 2026-04-11

This document describes the 13 core business rules and invariants that govern Tianwen V2 behavior. Each rule includes the rationale, enforcement location, and file:line citations.

---

## Rule 1: Stall Category Auto-Memo Tagging

**Rule**: Any order containing commodities with `type_id = "stall"` automatically receives a memo tag `"攤位"` (stall/side items).

**Rationale**: Kitchen staff need to quickly identify orders with side items. Auto-tagging prevents manual entry errors and ensures consistency.

**Enforcement**:
- Defined: `src/stores/order-store.ts:6–8` (STALL_TYPE_ID, STALL_MEMO_TAG)
- Logic: `src/stores/order-store.ts:82–95` (submitOrder method)
  - When user taps "Submit Order", code checks if any item has `typeId === 'stall'`
  - If yes, appends memo tag "攤位" to order.memo array
  - If already present, no duplicate

**Code Reference**:
```typescript
// src/stores/order-store.ts:6
const STALL_TYPE_ID = 'stall';
const STALL_MEMO_TAG = '攤位';

// src/stores/order-store.ts:82–95
submitOrder: async (memoTags?: string[]) => {
  // ... auto-append stall tag if any items match
  if (items.some(item => item.typeId === STALL_TYPE_ID)) {
    if (!memoTags?.includes(STALL_MEMO_TAG)) {
      memoTags = [...(memoTags || []), STALL_MEMO_TAG];
    }
  }
  // ... create order with updated memoTags
};
```

**Example**:
- Order contains: "豬肉排便當" (bento, typeId="bento") + "蚵仔煎" (stall, typeId="stall")
- On submit, memo automatically becomes: `["攤位"]`

**Testing**: ✓ Covered in order submission tests

**Related Flows**:
- Order Entry & Submission (Section 4.2)

---

## Rule 2: Backup Scheduling with Taiwan Timezone Awareness

**Rule**: Backup overdue checks must respect Taiwan timezone (UTC+8), not server time.

**Rationale**: Restaurant operates in Taiwan (UTC+8). "Backup due today" means today in Taiwan time, not UTC. This prevents confusion when backup window crosses midnight UTC but not Taiwan midnight.

**Enforcement**:
- Utility: `src/lib/backup-schedule.ts` (Taiwan timezone helpers)
- Constants: `src/lib/backup-schedule.ts:1–4`
  - `TAIWAN_OFFSET_MS = 8 * 60 * 60 * 1000`
- Functions:
  - `getTaiwanDayStart(utcMs)` — returns start of "today" in Taiwan time as UTC milliseconds
  - `getTaiwanWeekStart(utcMs)` — returns start of Monday (Taiwan time) as UTC milliseconds
  - `isBackupOverdue(scheduleType, lastBackupTime)` — checks if backup due

**Logic** (src/lib/backup-schedule.ts:56–84):
```typescript
function isBackupOverdue(scheduleType, lastBackupTime) {
  if (scheduleType === 'none') return false; // Never overdue
  
  const now = Date.now();
  const taiwanDayStart = getTaiwanDayStart(now);
  
  if (scheduleType === 'daily') {
    // Overdue if lastBackupTime is before today (Taiwan time)
    return lastBackupTime < taiwanDayStart;
  }
  
  if (scheduleType === 'weekly') {
    const taiwanWeekStart = getTaiwanWeekStart(now);
    return lastBackupTime < taiwanWeekStart;
  }
}
```

**Example**:
- Tuesday 2026-04-07, 14:00 Taiwan time (UTC 06:00)
- Last backup: Monday 2026-04-06, 23:00 Taiwan time
- isBackupOverdue('daily') = false (both same day in Taiwan timezone)
- isBackupOverdue('weekly') = false (both same week in Taiwan timezone)

**Testing**: ✓ Taiwan timezone tests in src/lib/__tests__/backup-schedule.test.ts

**Related Files**:
- `src/lib/backup-schedule.ts` (full implementation)
- `src/hooks/use-auto-backup.ts` (calls isBackupOverdue)
- `src/stores/backup-store.ts` (hydrates lastBackupTime)

---

## Rule 3: Backup Retention Policy

**Rule**: Maximum 30 backups per device retained in Cloudflare R2. Older backups automatically deleted.

**Rationale**: Limit cloud storage costs and prevent unbounded growth. 30 backups ≈ 1 month of daily backups or 6 months of weekly backups.

**Enforcement**:
- Constant: `api/backup/complete.ts:20` — `const MAX_BACKUPS = 30;`
- Trigger: After successful presigned URL upload, backend calls cleanup logic
- Logic: `api/backup/complete.ts` (POST endpoint)
  1. Lists all `.sqlite.gz` files in R2 bucket
  2. Sorts by LastModified descending (newest first)
  3. Counts total backups
  4. If count > MAX_BACKUPS, deletes oldest (count - 30) files

**Code Reference**:
```typescript
// api/backup/complete.ts
const MAX_BACKUPS = 30;

// After verifying upload:
const files = await s3Client.listObjectsV2({ Bucket: BUCKET, Prefix: '*.sqlite.gz' });
const sorted = files.Contents?.sort((a, b) => b.LastModified - a.LastModified);
if (sorted && sorted.length > MAX_BACKUPS) {
  const toDelete = sorted.slice(MAX_BACKUPS);
  for (const file of toDelete) {
    await s3Client.deleteObject({ Bucket: BUCKET, Key: file.Key });
  }
}
```

**Storage Estimate**:
- Single backup: ~5MB raw SQLite → ~1–2MB gzipped
- 30 backups: ~30–60MB max per device
- Multiple devices: Each device scoped separately (filename includes device ID)

**Testing**: ✓ Covered in api/backup/complete.test.ts

**Related Flows**:
- Manual Backup (Section 4.8)
- Auto-Backup (Section 4.9)
- Cloud Restore (Section 4.10)

---

## Rule 4: Order Snapshot Price Protection

**Rule**: When an order is created, each item's price is captured and saved in `order_items.price`. Price changes to commodities do NOT affect past orders.

**Rationale**: Protects revenue integrity and accounting. If a manager changes bento price from $100 → $150, old orders still show $100. Prevents disputes over historical pricing.

**Enforcement**:
- Capture: `src/stores/order-store.ts:63–69` (addItem action)
  - When user taps commodity, extract current price from commodity object
  - Store price in CartItem
- Persist: `src/lib/repositories/order-item-repository.ts` (createBatch method)
  - Insert order_items row with snapshot price
  - Price field immutable after insert

**Code Reference**:
```typescript
// src/stores/order-store.ts:63–69
addItem: (commodity) => {
  const item = {
    commodity_id: commodity.id,
    name: commodity.name,
    price: commodity.price, // SNAPSHOT at time of add
    quantity: 1,
    includes_soup: commodity.includes_soup,
  };
  // ... add to cart
};
```

**Example**:
- 2026-04-07: Manager edits "豬肉排便當" price from $100 → $120
- Order created 2026-04-07 at 10:00 with item price $100 is unaffected
- Orders created 2026-04-07 at 11:00 onward see new price $120
- Historical query shows correct original pricing

**Testing**: ✓ Covered in order submission tests

**Related Flows**:
- Order Entry & Submission (Section 4.2)
- Product Management & Price Edit (Section 4.6)
- Order Edit (Section 4.3)

---

## Rule 5: V1→V2 Migration Idempotency

**Rule**: V1 legacy data can be safely imported multiple times without duplication.

**Rationale**: If import is interrupted (network error, browser crash), user can re-run import without creating duplicate orders or employees. Improves resilience.

**Enforcement**:
- SQL Directive: `src/lib/v1-data-importer.ts:78` — `INSERT OR IGNORE`
- Behavior: Duplicate primary keys silently skipped; no error raised
- Idempotency: Safe to call importV1Data() multiple times

**Code Reference**:
```typescript
// src/lib/v1-data-importer.ts:78
function buildInsertSql(table, rows) {
  return `INSERT OR IGNORE INTO ${table} (${columns}) VALUES (${placeholders})`;
  // Any row with duplicate id is ignored, not errored
}
```

**Example**:
- First import run: inserts orders 1–100 successfully
- Network timeout; import halts at order 50
- Second import run: SQLite ignores first 50 (duplicate ids), inserts remaining 50–100
- Final result: orders 1–100 (no duplicates)

**Testing**: ✓ Covered in v1-data-importer tests

**Related Flows**:
- V1→V2 Legacy Data Import (Section 4.11)

---

## Rule 6: Employee Termination Soft-Delete

**Rule**: Terminated employees are not deleted; instead, `status` set to "inactive" and `resignation_date` recorded.

**Rationale**: Preserves audit trail. Historical records (orders attributed to terminated staff, attendance history) remain queryable. Allows manager to restore employee if needed.

**Enforcement**:
- Schema: `src/lib/schema.ts:92–93` (CHECK constraint)
  ```sql
  status TEXT CHECK (status IN ('active', 'inactive'))
  ```
- UI Filter: `src/pages/clock-in` only displays active employees
- Termination Action: `src/lib/repositories/employee-repository.ts` (update method)
  ```typescript
  EmployeeRepository.update(employeeId, {
    status: 'inactive',
    resignation_date: today
  });
  ```

**Code Reference**:
```typescript
// src/lib/schema.ts:92–93
status TEXT NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',

// Usage in clock-in:
const activeEmployees = await EmployeeRepository.findAll({ status: 'active' });
```

**Audit Trail Preservation**:
- Order.editor field still references terminated employee (loose ref)
- Attendance records for that employee remain in DB
- PriceChangeLog.editor may reference terminated employee
- "Who edited this price?" query still works

**Testing**: ✓ Covered in employee management tests

**Related Flows**:
- Staff Management (Section 4.12)
- Clock-In/Clock-Out (Section 4.5)

---

## Rule 7: Order Number Sequence

**Rule**: Each order receives an auto-incrementing `number` field independent of `id` for customer-facing receipts.

**Rationale**: Order numbers (1, 2, 3…) are user-visible and memorable. Primary keys (nanoid) are system-level and not human-friendly. Decoupling allows flexible ID strategy.

**Enforcement**:
- Generation: `src/lib/repositories/order-repository.ts` (getNextOrderNumber method)
  ```typescript
  async getNextOrderNumber() {
    const result = await db.exec(
      'SELECT MAX(number) as maxNumber FROM orders'
    );
    return (result[0]?.maxNumber || 0) + 1;
  }
  ```
- Assignment: `src/lib/repositories/order-repository.ts` (create method)
  - Before inserting, fetch next order number
  - Assign to order.number
  - Insert order with both id (nanoid) and number

**Example**:
- Order 1: id="abc123xyz", number=1
- Order 2: id="def456uvw", number=2
- Receipt prints: "Order #2" (human-friendly)
- Internal queries use id (nanoid)

**Uniqueness**: `src/lib/schema.ts:47` defines `UNIQUE` constraint on number column

**Testing**: ✓ Covered in order creation tests

**Related Flows**:
- Order Entry & Submission (Section 4.2)

---

## Rule 8: Minimum Init UI Display Duration

**Rule**: The database initialization overlay (InitOverlay) must display for at least 5 seconds even if DB initialization completes faster.

**Rationale**: Prevents jarring flash on fast machines. Gives user perception that app is "doing work" (loading, initializing, checking for updates). UX best practice for PWAs.

**Enforcement**:
- Tracking: `src/stores/init-store.ts:66–73` (setShowInitUI method)
  - Records `shownAt: Date.now()` when overlay first displayed
- Gate: `src/components/init-ui/init-overlay.tsx`
  - Shows "close" button only after minimum duration elapsed
  - Calculates: `elapsed = now - shownAt`
  - Allow dismiss only if `elapsed >= 5000` (5 seconds)

**Code Reference**:
```typescript
// src/stores/init-store.ts:66–73
setShowInitUI: () => {
  set({ showInitUI: true, shownAt: Date.now() });
};

// src/components/init-ui/init-overlay.tsx
const canDismiss = Date.now() - store.shownAt >= 5000;
```

**Scenario**:
- Database init completes in 300ms (fast SSD)
- Overlay still shown for 4.7 more seconds
- After 5 seconds total, user can dismiss or app auto-dismisses

**Testing**: ✓ Covered in init-store tests

**Related Flows**:
- Bootstrap (Section 4.1)

---

## Rule 9: Portrait-Only Orientation Enforcement

**Rule**: App locked to portrait orientation on mobile/tablet devices. Landscape mode blocks UI.

**Rationale**: iPad order entry UI optimized for portrait. Landscape would break layout (category tabs, button spacing). Prevents user frustration from rotated device.

**Enforcement**:
- Detection: `src/routes/route-tree.tsx:23–41` (RootLayout component)
  - Uses `useSyncExternalStore()` with `window.matchMedia('(orientation: portrait)')`
  - Monitors orientation media query
- Blocking: When landscape detected, shows `WaitingOverlay` with message "請將裝置轉為橫向使用"
- CSS Fallback: `src/styles/global.css` hides tabs in landscape

**Code Reference**:
```typescript
// src/routes/route-tree.tsx:23–41
const isPortrait = useSyncExternalStore(
  subscribe => {
    const mediaQuery = window.matchMedia('(orientation: portrait)');
    mediaQuery.addListener(subscribe);
    return () => mediaQuery.removeListener(subscribe);
  },
  () => window.matchMedia('(orientation: portrait)').matches
);

if (!isPortrait) {
  return <WaitingOverlay message="請將裝置轉為橫向使用" />;
}
```

**Testing**: ✓ Covered in layout tests with orientation mock

**Related Files**:
- `src/routes/route-tree.tsx` (enforcement)
- `src/styles/global.css` (CSS fallback)

---

## Rule 10: Device Identity Tracking

**Rule**: Each browser/device has a unique DEVICE_ID for backup identification and multi-device support.

**Rationale**: Enables:
- Per-device backup scoping (e.g., "restore backup from iPad A")
- Backup filenames include device code for clarity
- Multi-device deployments with separate data per device

**Enforcement**:
- Generation: `src/lib/device.ts` (getDeviceId function)
  - On first app load, generate random 12-character code
  - Store in localStorage under key 'DEVICE_ID'
  - Subsequent loads retrieve from localStorage (persistent)
- Usage: Backup filename includes device ID
  - Format: `tianwen-{device}-{YYYY-MM-DD_HH-mm-ss}.sqlite.gz`
  - Example: `tianwen-iPad-AB12CD-2026-04-11_14-30-00.sqlite.gz`

**Code Reference**:
```typescript
// src/lib/device.ts
export function getDeviceId() {
  let deviceId = localStorage.getItem('DEVICE_ID');
  if (!deviceId) {
    deviceId = generateRandomId(12); // e.g., "A5B9C2D1E7F3"
    localStorage.setItem('DEVICE_ID', deviceId);
  }
  return deviceId;
}
```

**Multi-Device Scenario**:
- iPad A (DEVICE_ID="A5B9C2D1E7F3") — stores backups prefixed "tianwen-A5B9C2D1E7F3-*"
- iPad B (DEVICE_ID="X4Y8Z3P6Q1R5") — stores backups prefixed "tianwen-X4Y8Z3P6Q1R5-*"
- Cloud restore lists all device's backups separately

**Testing**: ✓ Covered in device.ts tests

**Related Files**:
- `src/lib/device.ts` (generation)
- `src/lib/backup.ts` (usage in filename)
- `api/backup/presign.ts` (REST endpoint)

---

## Rule 11: No Global User Login Required

**Rule**: App operates without a global user login for order entry. Admin functions (staff management, product editing, cloud backup) are gated by Google OAuth via `AuthGuard`.

**Rationale**: Reduces friction for daily order operations. Device is trusted (physical access == staff access). Only admin-level actions require authentication.

**Enforcement**:
- Order Entry: No login needed. OrderPage loads directly with ProductGrid + OrderPanelTabs. Anyone with device access can place orders.
- Order Store: `src/stores/order-store.ts:41–42` has `operatorId` / `operatorName` fields, but **no UI currently sets them** — they remain `null` in production. The `setOperator()` API exists in the store but is only called from tests.
- Admin Check: `AuthGuard` component (`src/components/auth-guard/auth-guard.tsx`) wraps Settings tabs with 3 variants: `staffAdmin`, `productAdmin`, `backup`. Requires Google OAuth login + `isAdmin` flag.
- Non-auth state: Shows a lock screen with "請透過 header 登入" message (no redirect).

**Code Reference**:
```typescript
// src/components/auth-guard/auth-guard.tsx
type AuthGuardVariant = 'staffAdmin' | 'backup' | 'productAdmin'

// Not logged in → lock screen
if (!googleUser || sessionExpired) {
  return <Lock ... /> // "請透過 header 登入"
}
// Logged in but not admin → shield screen
if (!isAdmin) {
  return <ShieldOff ... /> // "需要管理員權限"
}
// Admin → render children
return <>{children}</>
```

**Scenario**:
- App starts (no login screen)
- OrderPage immediately shows product grid + cart panel
- Staff places orders without identity attribution
- For admin tasks: tap Settings → see lock screen → login via header Google OAuth → admin content unlocked

**Note**: The `operatorId` store API is implemented but not wired to any UI. This may be a planned feature for per-operator order attribution.

**Testing**: ✓ Covered in auth-guard tests and order-store tests

**Related Flows**:
- Order Entry (Section 4.2)
- Staff Management (Section 4.12)
- Google OAuth Binding (Section 4.13)

---

## Rule 12: Order Edit Flow

**Rule**: Editing a submitted order does NOT mutate the original; instead, old items/discounts are deleted and new ones created.

**Rationale**: Preserves audit trail. `original_total` field captures pre-edit total. Allows historical queries like "what did this order contain originally?"

**Enforcement**:
- Load Original: `src/lib/repositories/order-repository.ts` (findById method)
  - Queries order_items and order_discounts by order_id
  - Reconstructs full order with all relations
- Start Edit: `src/stores/order-store.ts` (startEditOrder method)
  - Copies order into cart state
  - User modifies items/discounts
- Save Edit: `src/lib/repositories/order-repository.ts` (create method)
  1. OrderItemRepository.removeByOrderId(orderId) — deletes old items
  2. OrderDiscountRepository.removeByOrderId(orderId) — deletes old discounts
  3. Create new order_items rows
  4. Create new order_discounts rows
  5. Update order.total and set order.original_total (if different)

**Code Reference**:
```typescript
// src/lib/repositories/order-item-repository.ts
async removeByOrderId(orderId) {
  return this.db.exec(
    `DELETE FROM order_items WHERE order_id = ?`,
    [orderId]
  );
}

// src/lib/repositories/order-repository.ts (create)
if (editingOrderId) {
  original_total = await this.getOrderTotal(editingOrderId); // Before delete
  await OrderItemRepository.removeByOrderId(editingOrderId);
  await OrderDiscountRepository.removeByOrderId(editingOrderId);
}
// Insert new items/discounts
```

**Audit Trail**:
- original_total preserves pre-edit total
- Order.updated_at updated on re-submit
- Old items are gone (no soft-delete on order_items)
- Manager can view order history to see edit times

**Testing**: ✓ Covered in order edit tests

**Related Flows**:
- Order Entry (Section 4.2)
- Order Edit (Section 4.3)

---

## Rule 13: Gzip Compression for Backup Transport

**Rule**: Database backup compressed via browser CompressionStream before uploading to R2 to minimize bandwidth.

**Rationale**: Typical SQLite database:
- Raw: ~5MB
- Gzipped: ~1–2MB
- Savings: 60–80% bandwidth reduction
- Browser CompressionStream API: native, no library dependency

**Enforcement**:
- Compression: `src/lib/backup.ts:26–52` (compress function)
  ```typescript
  async function compress(data: Uint8Array) {
    const cs = new CompressionStream('gzip');
    const writer = cs.writable.getWriter();
    writer.write(data);
    writer.close();
    return new Uint8Array(await readableStreamToArray(cs.readable));
  }
  ```
- Decompression: `src/lib/backup.ts:57–83` (decompress function)
  ```typescript
  async function decompress(data: Uint8Array) {
    const dcs = new DecompressionStream('gzip');
    const writer = dcs.writable.getWriter();
    writer.write(data);
    writer.close();
    return new Uint8Array(await readableStreamToArray(dcs.readable));
  }
  ```
- Transport: Presigned URL upload carries `.sqlite.gz` file
- Backup Log: BackupLogRepository.create({ size: compressedBytes })

**Example**:
- Raw DB export: 5,242,880 bytes (5 MB)
- After gzip: 1,310,720 bytes (1.25 MB)
- Savings: ~75%
- Upload time (1 Mbps): 5s instead of 42s

**Browser Support**: CompressionStream API supported in:
- Chrome 80+
- Safari 16.4+
- Firefox (not yet; fallback to external library)

**Testing**: ✓ Covered in backup.ts tests

**Related Files**:
- `src/lib/backup.ts` (compression logic)
- `src/lib/repositories/backup-log-repository.ts` (size tracking)
- `api/backup/complete.ts` (backend verification)

---

## Summary Table

| # | Rule | Enforcement File | Key Function |
|----|------|-----------------|----------------|
| 1 | Stall Auto-Memo | `src/stores/order-store.ts` | submitOrder |
| 2 | Taiwan Timezone | `src/lib/backup-schedule.ts` | isBackupOverdue |
| 3 | Backup Retention | `api/backup/complete.ts` | deleteOldBackups |
| 4 | Snapshot Price | `src/lib/repositories/order-item-repository.ts` | createBatch |
| 5 | V1 Idempotency | `src/lib/v1-data-importer.ts` | buildInsertSql |
| 6 | Employee Soft-Delete | `src/lib/schema.ts` | status CHECK constraint |
| 7 | Order Numbering | `src/lib/repositories/order-repository.ts` | getNextOrderNumber |
| 8 | Init UI Duration | `src/stores/init-store.ts` | setShowInitUI |
| 9 | Portrait Orientation | `src/routes/route-tree.tsx` | useSyncExternalStore |
| 10 | Device Identity | `src/lib/device.ts` | getDeviceId |
| 11 | No Global Login | `src/components/auth-guard/auth-guard.tsx` | AuthGuard |
| 12 | Order Edit | `src/lib/repositories/order-item-repository.ts` | removeByOrderId |
| 13 | Gzip Compression | `src/lib/backup.ts` | compress |

---

**Next Steps:**
- For flows that enforce these rules, see [04-operational-flows.md](04-operational-flows.md)
- For entities affected by rules, see [02-entities.md](02-entities.md)
