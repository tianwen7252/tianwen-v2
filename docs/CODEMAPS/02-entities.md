# Tianwen V2 Entities & Domain Model

**Last Updated:** 2026-04-11

This document describes all 13 business entities in Tianwen V2, including their purpose, key fields, lifecycle, relationships, and file:line citations for quick code navigation.

---

## Entity Overview

| Entity | Table | Purpose | Parent | Children |
|--------|-------|---------|--------|----------|
| **Order** | orders | Core transaction | — | OrderItem, OrderDiscount |
| **OrderItem** | order_items | Line item in order | Order | — |
| **OrderDiscount** | order_discounts | Discount applied | Order | — |
| **Commodity** | commodities | Menu item | CommodityType | OrderItem, PriceChangeLog |
| **CommodityType** | commodity_types | Category grouping | — | Commodity |
| **OrderType** | order_types | Fulfillment mode (proto) | — | — |
| **Employee** | employees | Staff member | — | Attendance, Order |
| **Attendance** | attendances | Daily time record | Employee | — |
| **BackupLog** | backup_logs | Backup audit | — | — |
| **ErrorLog** | error_logs | Error persistence | — | — |
| **PriceChangeLog** | price_change_logs | Price history | — | — |
| **DailyData** | daily_data | Daily revenue aggregate | — | — |
| **CustomOrderName** | custom_order_names | User-defined item name | — | — |

---

## Core Transactions

### 1. Order

**Purpose**: Represents a single customer order with items, discounts, and fulfillment status.

**Schema** (src/lib/schema.ts:44–56):
```sql
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  number INTEGER UNIQUE,           -- Sequential order number (1, 2, 3...)
  memo TEXT,                        -- JSON array: ["攤位"] or custom tags
  soups INTEGER,                    -- Count of soup/congee items
  total REAL,                       -- Final total after discounts
  original_total REAL,              -- Pre-discount total (nullable; set on edit)
  edited_memo TEXT,                 -- Human-editable memo (nullable)
  editor TEXT,                      -- Employee/admin name who created order
  is_served INTEGER,                -- Boolean: 1 = marked served
  created_at INTEGER,               -- Unix milliseconds timestamp
  updated_at INTEGER
);
```

**Key Fields**:
- `id`: Nanoid primary key (e.g., "V1StfluxX7A_qzpZ")
- `number`: Sequential display number for receipts (e.g., 42)
- `memo`: JSON array of memo tags (e.g., `["攤位"]` for stall items)
- `total`: Final amount after discounts
- `original_total`: Captured during order edit to show delta
- `editor`: Employee/admin who entered the order

**Lifecycle**:
1. **Create**: User submits order via OrderPage → `useOrderStore.submitOrder()` → OrderRepository.create()
2. **Items**: OrderItem records linked via FK order_id
3. **Display**: OrdersPage shows today's orders via `OrderRepository.findRecent()`
4. **Edit**: Click edit → load via `OrderRepository.findById()` → modify items/discounts → re-submit
5. **Mark Served**: Click "Mark as Served" → `OrderRepository.toggleServed(id, true)` → `is_served=1`

**Relationships**:
- 1:N with `order_items` (child line items)
- 1:N with `order_discounts` (applied discounts)
- M:1 with `employees` (editor field; loose reference)

**Type Definition** (src/lib/schemas.ts):
```typescript
export interface Order {
  id: string;
  number: number;
  memo: string; // JSON array string
  soups: number;
  total: number;
  original_total: number | null;
  edited_memo: string | null;
  editor: string;
  is_served: 0 | 1;
  created_at: number;
  updated_at: number;
}

export const orderSchema = z.object({
  id: z.string(),
  number: z.number().int(),
  memo: z.string(),
  soups: z.number().int().min(0),
  total: z.number(),
  original_total: z.number().nullable(),
  edited_memo: z.string().nullable(),
  editor: z.string(),
  is_served: z.number().int().min(0).max(1),
  created_at: z.number(),
  updated_at: z.number(),
});
```

**File Locations**:
- Schema: `src/lib/schema.ts:44–56`
- Type/Zod: `src/lib/schemas.ts` (Order, CreateOrder, orderSchema)
- Repository: `src/lib/repositories/order-repository.ts`
- Store: `src/stores/order-store.ts` (submitOrder action, line 82)
- UI: `src/pages/order/order-page.tsx`, `src/pages/orders/orders-page.tsx`

---

### 2. OrderItem

**Purpose**: Normalized line item — represents one commodity (or custom item) added to an order.

**Schema** (src/lib/schema.ts:126–137):
```sql
CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT,                    -- FK to orders.id
  commodity_id TEXT,                -- Reference to commodities.id OR custom-xxx
  name TEXT,                        -- Display name
  price REAL,                       -- Unit price at time of order (SNAPSHOT)
  quantity INTEGER,                 -- How many units
  includes_soup INTEGER,            -- Boolean: true if bento includes soup
  created_at INTEGER,
  updated_at INTEGER
);
```

**Key Fields**:
- `id`: Nanoid primary key
- `order_id`: FK to parent order
- `commodity_id`: Ref to commodity (may not exist for custom items; no hard FK)
- `price`: **Snapshot** of price at order time (protects against future price changes)
- `quantity`: Units ordered
- `includes_soup`: Boolean flag for bento with soup

**Lifecycle**:
1. **Add Item**: User taps commodity on OrderPage → `useOrderStore.addItem(commodity)` → CartItem added to state
2. **Cart**: Item resides in cart (Zustand state) until order submitted
3. **Submit**: OrderItemRepository.createBatch() inserts row per cart item with snapshot price
4. **Edit Order**: Old order_items deleted; new ones created (no update path)
5. **Display**: OrderRepository.attachRelated() loads items when retrieving order detail

**Relationships**:
- M:1 with `orders` (child of order)
- Loose reference to `commodities` (commodity_id may point to deleted item or custom-xxx)

**Type Definition** (src/lib/schemas.ts):
```typescript
export interface OrderItem {
  id: string;
  order_id: string;
  commodity_id: string;
  name: string;
  price: number;
  quantity: number;
  includes_soup: 0 | 1;
  created_at: number;
  updated_at: number;
}
```

**File Locations**:
- Schema: `src/lib/schema.ts:126–137`
- Type: `src/lib/schemas.ts` (OrderItem, CreateOrderItem)
- Repository: `src/lib/repositories/order-item-repository.ts`
- Store: `src/stores/order-store.ts` (CartItem interface, addItem action)

---

### 3. OrderDiscount

**Purpose**: Discount or promotional credit applied to an order.

**Schema** (src/lib/schema.ts:142–150):
```sql
CREATE TABLE order_discounts (
  id TEXT PRIMARY KEY,
  order_id TEXT,                    -- FK to orders.id
  label TEXT,                       -- Discount description (e.g., "會員折扣")
  amount REAL,                      -- Discount value (e.g., 50 = -$50)
  created_at INTEGER,
  updated_at INTEGER
);
```

**Key Fields**:
- `id`: Nanoid primary key
- `order_id`: FK to parent order
- `label`: Human-readable discount name
- `amount`: Discount amount (positive; represents reduction)

**Lifecycle**:
1. **Add Discount**: User opens Calculator overlay → enters discount name + amount → `useOrderStore.addDiscount(label, amount)` → Discount object added to cart
2. **Submit**: OrderDiscountRepository.createBatch() inserts one row per discount
3. **Display**: OrderRepository.attachRelated() loads discounts when viewing order detail
4. **Recalc**: `total = subtotal - sum(discount.amount)`

**Relationships**:
- M:1 with `orders` (child discount)

**Type Definition**:
```typescript
export interface OrderDiscount {
  id: string;
  order_id: string;
  label: string;
  amount: number;
  created_at: number;
  updated_at: number;
}

export interface Discount {
  label: string;
  amount: number;
}
```

**File Locations**:
- Schema: `src/lib/schema.ts:142–150`
- Type: `src/lib/schemas.ts` (orderDiscountSchema)
- Repository: `src/lib/repositories/order-discount-repository.ts`
- Store: `src/stores/order-store.ts` (Discount interface, addDiscount/removeDiscount actions)
- UI: `src/components/calculator` (overlay for discount entry)

---

## Menu & Operations

### 4. Commodity

**Purpose**: Menu item definition — product the restaurant sells (bento, drink, stall item, etc.).

**Schema** (src/lib/schema.ts:23–37):
```sql
CREATE TABLE commodities (
  id TEXT PRIMARY KEY,
  type_id TEXT,                     -- FK to commodity_types.type_id
  name TEXT,                        -- Product name
  image TEXT,                       -- Image asset key/URL (nullable; V2-29)
  price REAL,                       -- Current selling price
  priority INTEGER,                 -- Display order in category
  on_market INTEGER,                -- Boolean: 0 = hidden (soft-delete)
  hide_on_mode TEXT,                -- Optional: hide on specific mode (nullable)
  includes_soup INTEGER,            -- Boolean: bento includes soup (V2-52)
  editor TEXT,                      -- Last editor
  created_at INTEGER,
  updated_at INTEGER
);
```

**Key Fields**:
- `id`: Nanoid primary key
- `type_id`: FK to commodity_types for category
- `name`: Display name (e.g., "豬肉排便當")
- `price`: Current price (may change; new orders snapshot this)
- `on_market`: Boolean soft-delete flag (0 = hidden)
- `includes_soup`: Boolean (true for bento with soup)
- `editor`: Who last edited this item

**Lifecycle**:
1. **Seed**: Default commodities inserted on first launch via `insertDefaultCommodities()` (src/constants/default-data.ts)
2. **Display**: OrderPage queries `CommodityRepository.findOnMarket()` to filter `on_market=1`
3. **Edit**: Manager views ProductManagement page → clicks item → edit form (name, price, on_market)
4. **Save**: CommodityRepository.update() → if price changed, create price_change_logs entry
5. **Soft-Delete**: Set `on_market=0` to hide from sales (preserves data)

**Relationships**:
- M:1 with `commodity_types` (parent category)
- 1:N with `order_items` (via commodity_id)
- 1:N with `price_change_logs` (pricing edits)

**Type Definition** (src/lib/schemas.ts):
```typescript
export interface Commodity {
  id: string;
  type_id: string;
  name: string;
  image: string | null;
  price: number;
  priority: number;
  on_market: 0 | 1;
  hide_on_mode: string | null;
  includes_soup: 0 | 1;
  editor: string;
  created_at: number;
  updated_at: number;
}

export const commoditySchema = z.object({
  id: z.string(),
  type_id: z.string(),
  name: z.string().min(1),
  image: z.string().nullable(),
  price: z.number().positive(),
  priority: z.number().int().min(0),
  on_market: z.number().int().min(0).max(1),
  hide_on_mode: z.string().nullable(),
  includes_soup: z.number().int().min(0).max(1),
  editor: z.string(),
  created_at: z.number(),
  updated_at: z.number(),
});
```

**File Locations**:
- Schema: `src/lib/schema.ts:23–37`
- Type/Zod: `src/lib/schemas.ts` (commoditySchema)
- Repository: `src/lib/repositories/commodity-repository.ts`
- Seed data: `src/constants/default-data.ts` (COMMODITY_SEEDS array)
- UI: `src/pages/order/`, `src/pages/settings/product-management`

---

### 5. CommodityType

**Purpose**: Product category definition — groups commodities for UI organization.

**Schema** (src/lib/schema.ts:11–20):
```sql
CREATE TABLE commodity_types (
  id TEXT PRIMARY KEY,
  type_id TEXT UNIQUE,              -- Slug identifier (e.g., "stall")
  type TEXT,                        -- Machine-readable code
  label TEXT,                       -- Localized display name (e.g., "攤位")
  color TEXT,                       -- Hex color for UI (e.g., "#2ecc71")
  priority INTEGER,                 -- Display order on OrderPage tabs
  created_at INTEGER,
  updated_at INTEGER
);
```

**Key Fields**:
- `id`: Nanoid primary key
- `type_id`: Unique slug (e.g., "stall", "bento", "drink") — used as FK key
- `type`: Machine type code
- `label`: Localized display name
- `color`: Hex color for category badge
- `priority`: Tab order on OrderPage

**Lifecycle**:
1. **Seed**: 5 default types inserted on first launch (bento/green, single/brown, drink/indigo, dumpling/indigo, stall/red; src/constants/default-data.ts)
2. **Display**: OrderPage renders tabs in priority order; clicking expands commodity list
3. **Edit**: ProductManagement page allows drag-drop reorder → priority updated (V2-PM feature)

**Relationships**:
- 1:N with `commodities` (parent of products)

**Type Definition**:
```typescript
export interface CommodityType {
  id: string;
  type_id: string;
  type: string;
  label: string;
  color: string;
  priority: number;
  created_at: number;
  updated_at: number;
}

export const commodityTypeSchema = z.object({
  id: z.string(),
  type_id: z.string().unique(),
  type: z.string(),
  label: z.string(),
  color: z.string(),
  priority: z.number().int().min(0),
  created_at: z.number(),
  updated_at: z.number(),
});
```

**File Locations**:
- Schema: `src/lib/schema.ts:11–20`
- Type: `src/lib/schemas.ts` (commodityTypeSchema)
- Repository: `src/lib/repositories/commodity-type-repository.ts`
- Seed: `src/constants/default-data.ts` (COMMODITY_TYPE_SEEDS)
- UI: `src/pages/order/` (category tabs)

---

### 6. OrderType

**Purpose**: Order classification — defines fulfillment mode (delivery, pickup, dine-in). Currently proto; unused in order flow.

**Schema** (src/lib/schema.ts:62–72):
```sql
CREATE TABLE order_types (
  id TEXT PRIMARY KEY,
  name TEXT,                        -- Display name (e.g., "外送")
  priority INTEGER,                 -- Display order
  type TEXT,                        -- Machine code (default: 'order')
  color TEXT,                       -- UI color badge (nullable)
  created_at INTEGER,
  updated_at INTEGER,
  editor TEXT                       -- Last modifier
);
```

**Key Fields**:
- `id`: Nanoid primary key
- `name`: Display name (e.g., "外送" = delivery, "電話自取" = pickup)
- `type`: Machine code
- `color`: Optional color for UI badge
- `priority`: Sort order

**Lifecycle**:
1. **Seed**: 3 default types (攤位/green, 外送/blue, 電話自取/yellow) inserted on first launch
2. **Display**: Currently not used in UI; proto for future multi-channel support
3. **Future**: Orders will be typed (e.g., order.order_type_id) to differentiate delivery vs dine-in

**Relationships**:
- Conceptual 1:N with `orders` (future feature)

**File Locations**:
- Schema: `src/lib/schema.ts:62–72`
- Seed: `src/constants/default-data.ts` (ORDER_TYPE_SEEDS)

---

## Staff & Time Tracking

### 7. Employee

**Purpose**: Staff record — person who can clock in, perform orders, receive admin privileges.

**Schema** (src/lib/schema.ts:88–102):
```sql
CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  name TEXT,                        -- Full name
  avatar TEXT,                      -- Animal emoji filename (V2-176 renamed numeric→English)
  status TEXT,                      -- "active" | "inactive" (CHECK)
  shift_type TEXT,                  -- "regular" | "shift"
  employee_no TEXT UNIQUE,          -- Business employee number
  is_admin INTEGER,                 -- Boolean: 1 = admin
  hire_date TEXT,                   -- ISO date when hired (nullable)
  resignation_date TEXT,            -- ISO date when resigned (nullable)
  google_sub TEXT,                  -- Google OAuth subject ID (nullable; V2-DEV-102)
  google_email TEXT,                -- Google email address (nullable; V2-DEV-102)
  created_at INTEGER,
  updated_at INTEGER
);
```

**Key Fields**:
- `id`: Nanoid primary key
- `name`: Full name (e.g., "李小明")
- `avatar`: Animal emoji PNG filename (e.g., "doberman.png")
- `status`: "active" or "inactive" (soft-delete flag)
- `is_admin`: Boolean (1 = can access settings, staff mgmt, backup)
- `employee_no`: Unique business ID (e.g., "EMP-001")
- `hire_date`, `resignation_date`: ISO dates for HR tracking
- `google_sub`, `google_email`: OAuth binding for multi-device account linking

**Lifecycle**:
1. **Create**: Admin adds via StaffAdmin page → form → EmployeeRepository.create()
2. **Display**: ClockInPage filters active employees; shows avatar + name
3. **Edit**: Admin taps employee card → form → EmployeeRepository.update()
4. **Terminate**: Set `status="inactive"` and `resignation_date=today` (soft-delete)
5. **Google OAuth**: Admin links Google account → stores google_sub + google_email (V2-DEV-102)

**Relationships**:
- 1:N with `attendances` (daily time records)
- M:1 with `orders` (loose ref via editor field)

**Type Definition** (src/lib/schemas.ts):
```typescript
export interface Employee {
  id: string;
  name: string;
  avatar: string;
  status: 'active' | 'inactive';
  shift_type: 'regular' | 'shift';
  employee_no: string;
  is_admin: 0 | 1;
  hire_date: string | null;
  resignation_date: string | null;
  google_sub: string | null;
  google_email: string | null;
  created_at: number;
  updated_at: number;
}

export const employeeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  avatar: z.string(),
  status: z.enum(['active', 'inactive']),
  shift_type: z.enum(['regular', 'shift']),
  employee_no: z.string().unique(),
  is_admin: z.number().int().min(0).max(1),
  hire_date: z.string().date().nullable(),
  resignation_date: z.string().date().nullable(),
  google_sub: z.string().nullable(),
  google_email: z.string().email().nullable(),
  created_at: z.number(),
  updated_at: z.number(),
});
```

**File Locations**:
- Schema: `src/lib/schema.ts:88–102`
- Type/Zod: `src/lib/schemas.ts` (employeeSchema)
- Repository: `src/lib/repositories/employee-repository.ts`
- Seed: `src/constants/default-data.ts` (EMPLOYEE_SEEDS: 8 default staff)
- UI: `src/pages/settings/staff-admin` (CRUD), `src/pages/clock-in` (display)
- OAuth: `src/components/settings/google-oauth` (binding logic)

---

### 8. Attendance

**Purpose**: Daily time record — captures clock-in, clock-out, and vacation type per employee per day.

**Schema** (src/lib/schema.ts:107–118):
```sql
CREATE TABLE attendances (
  id TEXT PRIMARY KEY,
  employee_id TEXT,                 -- FK to employees.id
  date TEXT,                        -- ISO date (e.g., "2026-04-11")
  clock_in INTEGER,                 -- Unix timestamp (nullable)
  clock_out INTEGER,                -- Unix timestamp (nullable)
  type TEXT,                        -- "regular" | "paid_leave" | "sick_leave" | ... (CHECK)
  created_at INTEGER,
  updated_at INTEGER
);
```

**Key Fields**:
- `id`: Nanoid primary key
- `employee_id`: FK to employees
- `date`: ISO date (one record per employee per day)
- `clock_in`: Unix timestamp of punch-in (nullable; null if on leave)
- `clock_out`: Unix timestamp of punch-out (nullable)
- `type`: "regular", "paid_leave", "sick_leave", "personal_leave", "absent" (CHECK)

**Lifecycle**:
1. **Clock In**: Employee taps name on ClockInPage → shows today's record → taps "打卡上班" → AttendanceRepository.update({ clock_in: Date.now() })
2. **Clock Out**: Later, tap name again → taps "打卡下班" → AttendanceRepository.update({ clock_out: Date.now() })
3. **Vacation**: Select leave type → AttendanceRepository.update({ type: "paid_leave", clock_in: null, clock_out: null })
4. **Admin Edit**: RecordsPage allows editing → AttendanceRepository.update({ clock_in, clock_out, type })
5. **Analytics**: StatisticsRepository aggregates hours worked, vacation usage

**Relationships**:
- M:1 with `employees` (child time record)

**Type Definition**:
```typescript
export type AttendanceType = 'regular' | 'paid_leave' | 'sick_leave' | 'personal_leave' | 'absent';

export interface Attendance {
  id: string;
  employee_id: string;
  date: string; // ISO date
  clock_in: number | null;
  clock_out: number | null;
  type: AttendanceType;
  created_at: number;
  updated_at: number;
}

export const attendanceSchema = z.object({
  id: z.string(),
  employee_id: z.string(),
  date: z.string().date(),
  clock_in: z.number().nullable(),
  clock_out: z.number().nullable(),
  type: z.enum(['regular', 'paid_leave', 'sick_leave', 'personal_leave', 'absent']),
  created_at: z.number(),
  updated_at: z.number(),
});
```

**File Locations**:
- Schema: `src/lib/schema.ts:107–118`
- Type/Zod: `src/lib/schemas.ts` (attendanceSchema, attendanceTypeEnum)
- Repository: `src/lib/repositories/attendance-repository.ts`
- UI: `src/pages/clock-in` (punch), `src/pages/records` (admin view/edit)

---

## Auditing & Analytics

### 9. BackupLog

**Purpose**: Audit trail for backup operations — tracks success/failure, file size, duration, retention.

**Schema** (src/lib/schema.ts:175–187):
```sql
CREATE TABLE backup_logs (
  id TEXT PRIMARY KEY,
  type TEXT,                        -- "manual" | "auto" | "v1-import" (CHECK)
  status TEXT,                      -- "success" | "failed" (CHECK)
  filename TEXT,                    -- Backup file name (nullable)
  size INTEGER,                     -- Compressed file size (bytes)
  duration_ms INTEGER,              -- Compression + upload time
  error_message TEXT,               -- Error detail if failed (nullable)
  created_at INTEGER,
  updated_at INTEGER
);
```

**Key Fields**:
- `id`: Nanoid primary key
- `type`: "manual", "auto", or "v1-import" (CHECK)
- `status`: "success" or "failed"
- `filename`: Backup file name (e.g., "tianwen-ipad-2026-04-11_14-30-00.sqlite.gz")
- `size`: Compressed file size in bytes
- `duration_ms`: Milliseconds taken to compress and upload
- `error_message`: Error detail if failed

**Lifecycle**:
1. **Manual Backup**: User taps "Backup Now" on Settings → executes backup → BackupLogRepository.create({ type: 'manual', status: 'success', ... })
2. **Auto Backup**: App startup checks schedule → if overdue, triggers backup → type='auto'
3. **V1 Import**: Legacy data migrated → type='v1-import' (logged once)
4. **Hydration**: `hydrateBackupScheduleFromDb()` queries max(created_at) WHERE status='success' to determine if next backup due

**Relationships**:
- 1:1 conceptual with R2 backup file (filename points to S3 object)

**Type Definition**:
```typescript
export interface BackupLog {
  id: string;
  type: 'manual' | 'auto' | 'v1-import';
  status: 'success' | 'failed';
  filename: string | null;
  size: number;
  duration_ms: number;
  error_message: string | null;
  created_at: number;
  updated_at: number;
}
```

**File Locations**:
- Schema: `src/lib/schema.ts:175–187`
- Repository: `src/lib/repositories/backup-log-repository.ts`
- UI/Logic: `src/components/settings/cloud-backup` (manual), `src/hooks/use-auto-backup` (auto)
- Hydration: `src/stores/backup-store.ts:62–84`

---

### 10. ErrorLog

**Purpose**: Application error persistence — captures runtime errors for debugging and diagnostics.

**Schema** (src/lib/schema.ts:163–170):
```sql
CREATE TABLE error_logs (
  id TEXT PRIMARY KEY,
  message TEXT,                     -- Error message text
  source TEXT,                      -- Error origin (e.g., "ClockInPage", default: '')
  stack TEXT,                       -- JavaScript stack trace (nullable)
  created_at INTEGER,
  updated_at INTEGER
);
```

**Key Fields**:
- `id`: Nanoid primary key
- `message`: Error message string
- `source`: Origin identifier (e.g., "ClockInPage", "BackupService")
- `stack`: Full JavaScript stack trace (nullable)

**Lifecycle**:
1. **Catch Error**: Any caught exception → `logError(err, source)` → creates ErrorLog row
2. **Display**: Error shown to user via ErrorOverlay UI
3. **Persist**: Error row stays in DB across sessions
4. **Review**: Admin can view errors in SystemInfo page (future feature)

**Relationships**:
- None (diagnostic/audit table)

**Type Definition**:
```typescript
export interface ErrorLog {
  id: string;
  message: string;
  source: string;
  stack: string | null;
  created_at: number;
  updated_at: number;
}

export const errorLogSchema = z.object({
  id: z.string(),
  message: z.string(),
  source: z.string().default(''),
  stack: z.string().nullable(),
  created_at: z.number(),
  updated_at: z.number(),
});
```

**File Locations**:
- Schema: `src/lib/schema.ts:163–170`
- Type/Zod: `src/lib/schemas.ts` (errorLogSchema)
- Repository: `src/lib/repositories/error-log-repository.ts`
- Logging: `src/lib/error-logger.ts` (logError function)
- UI: `src/components/error-ui` (ErrorOverlay display)

---

### 11. PriceChangeLog

**Purpose**: Price history tracking — records every commodity price modification for audit and analytics.

**Schema** (src/lib/schema.ts:192–202):
```sql
CREATE TABLE price_change_logs (
  id TEXT PRIMARY KEY,
  commodity_id TEXT,                -- Reference to commodity being edited
  commodity_name TEXT,              -- Snapshot of commodity name
  old_price REAL,                   -- Previous price
  new_price REAL,                   -- Updated price
  editor TEXT,                      -- Employee/admin who made change
  created_at INTEGER,
  updated_at INTEGER
);
```

**Key Fields**:
- `id`: Nanoid primary key
- `commodity_id`: Reference to the commodity
- `commodity_name`: Denormalized name snapshot
- `old_price`, `new_price`: Before/after prices
- `editor`: Who made the change

**Lifecycle**:
1. **Edit Price**: Admin edits commodity on ProductManagement page
2. **Trigger**: CommodityRepository.update() compares old vs new price
3. **Create Log**: If different, create PriceChangeLog entry
4. **History**: Viewable in admin audit trail (future feature; currently persisted but not displayed)

**Relationships**:
- Loose reference to `commodities` (no FK; name is denormalized)

**Type Definition**:
```typescript
export interface PriceChangeLog {
  id: string;
  commodity_id: string;
  commodity_name: string;
  old_price: number;
  new_price: number;
  editor: string;
  created_at: number;
  updated_at: number;
}
```

**File Locations**:
- Schema: `src/lib/schema.ts:192–202`
- Repository: `src/lib/repositories/price-change-log-repository.ts`
- Write trigger: `src/lib/repositories/commodity-repository.ts` (update method)

---

### 12. DailyData

**Purpose**: Daily revenue aggregation — pre-computed summary of orders per date for fast analytics queries.

**Schema** (src/lib/schema.ts:75–83):
```sql
CREATE TABLE daily_data (
  id TEXT PRIMARY KEY,
  date TEXT UNIQUE,                 -- ISO date (one row per day)
  total REAL,                       -- Sum of all order.total for date
  original_total REAL,              -- Sum of all order.original_total
  created_at INTEGER,
  updated_at INTEGER,
  editor TEXT                       -- Employee/system that modified
);
```

**Key Fields**:
- `id`: Nanoid primary key
- `date`: ISO date (UNIQUE; one row per day)
- `total`: Total revenue after discounts
- `original_total`: Pre-discount revenue
- `editor`: Who/what modified this row

**Lifecycle**:
1. **Order Submit**: On order creation, fetch daily_data row for that date (or create new)
2. **Aggregate**: Recalculate sum(order.total) and sum(order.original_total) for the date
3. **Update**: Persist aggregated totals to daily_data (atomic operation)
4. **Analytics**: AnalyticsPage queries daily_data for revenue trends, charts
5. **No Cleanup**: Accumulates indefinitely (can be archived manually if needed)

**Relationships**:
- Derived from `orders` (M:1 conceptual)

**Type Definition**:
```typescript
export interface DailyData {
  id: string;
  date: string; // ISO date
  total: number;
  original_total: number;
  created_at: number;
  updated_at: number;
  editor: string;
}
```

**File Locations**:
- Schema: `src/lib/schema.ts:75–83`
- Repository: `src/lib/repositories/daily-data-repository.ts`
- Aggregation: `src/lib/repositories/statistics-repository.ts` (builds charts)

---

### 13. CustomOrderName

**Purpose**: User-defined item names — stores custom item names created via Calculator for fast re-use.

**Schema** (src/lib/schema.ts:155–160):
```sql
CREATE TABLE custom_order_names (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE,                 -- Item name (no duplicates)
  created_at INTEGER,
  updated_at INTEGER
);
```

**Key Fields**:
- `id`: Nanoid primary key
- `name`: Item name (UNIQUE constraint)

**Lifecycle**:
1. **Enter Custom Item**: User types item name in Calculator overlay
2. **Persist**: If name not in history, CustomOrderNameRepository.create({ name })
3. **Suggest**: On next order entry, Calculator queries table → offers name suggestions (autocomplete)
4. **Reduce Re-Typing**: Improves UX for common custom items

**Relationships**:
- None (utility/suggestion table)

**Type Definition**:
```typescript
export interface CustomOrderName {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
}
```

**File Locations**:
- Schema: `src/lib/schema.ts:155–160`
- Repository: `src/lib/repositories/custom-order-name-repository.ts`

---

## Entity Relationship Diagram

```
┌─────────────────┐
│  CommodityType  │ (5 defaults: stall, bento, single, drink, dumpling)
└────────┬────────┘
         │ 1:N
         │
    ┌────v──────────┐
    │  Commodity    │ (menu items)
    └──┬─┬──────┬───┘
       │ │      │ 1:N
       │ │      └──────────────────┐
       │ │                         │
       │ │ 1:N                     │
       │ │                  ┌──────v────────────┐
       │ │                  │ PriceChangeLog    │ (audit)
       │ │                  └───────────────────┘
       │ │
       │ │
   ┌───v─v──────────────────┐
   │  OrderItem             │ (line items)
   └──────┬──────────────────┘
          │ M:1
          │
      ┌───v────────────────────┐
      │  Order                 │ (core transaction)
      └──┬──────────────┬───────┘
         │ 1:N          │ 1:N
         │              │
    ┌────v────────────┐ ┌─────────────────┐
    │ OrderDiscount   │ │ DailyData       │ (aggregate)
    └─────────────────┘ └─────────────────┘


┌──────────────┐
│  Employee    │ (8 defaults; staff)
├──────────────┤
└──┬───┬───┬───┘
   │   │   │
   │   │   └─── editor → Order (loose ref)
   │   │
   │   └─ google_sub, google_email (OAuth)
   │
   │ 1:N
   │
   v
┌──────────────┐
│ Attendance   │ (daily punch-in/out)
└──────────────┘


┌──────────────────┐
│ OrderType        │ (proto; currently unused)
└──────────────────┘

┌──────────────────┐
│ CustomOrderName  │ (utility; calculator suggestions)
└──────────────────┘

┌──────────────────┐
│ BackupLog        │ (audit; manual/auto/v1-import)
└──────────────────┘

┌──────────────────┐
│ ErrorLog         │ (diagnostic; runtime errors)
└──────────────────┘
```

---

## Summary

These 13 entities form the complete domain model for Tianwen V2. Transaction entities (Order, OrderItem, OrderDiscount) represent core ordering logic. Menu entities (Commodity, CommodityType) organize products. Staff entities (Employee, Attendance) manage human resources. Audit & analytics entities (BackupLog, ErrorLog, PriceChangeLog, DailyData) ensure data integrity and provide insights. All entities are persisted in SQLite WASM on the client, with backup snapshots stored in Cloudflare R2. Relationships are clean: orders own items and discounts; commodities belong to types; employees have attendance records; all edits are logged for audit.

---

**Next Steps:**
- For business rules governing these entities, see [03-business-rules.md](03-business-rules.md)
- For workflows using these entities, see [04-operational-flows.md](04-operational-flows.md)
