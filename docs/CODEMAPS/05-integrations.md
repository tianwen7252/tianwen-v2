# Tianwen V2 External Integrations

**Last Updated:** 2026-04-11

This document describes the 6 external systems and libraries that Tianwen V2 integrates with, including connection details, API endpoints, usage patterns, and file:line citations.

---

## Integration Overview

| System | Category | Purpose | File:Line |
|--------|----------|---------|-----------|
| **Cloudflare R2** | Cloud Storage | Backup file storage (S3-compatible) | api/backup/*.ts |
| **Vercel Functions** | Backend/API | Serverless endpoints (presigned URLs, cleanup) | api/*.ts |
| **Google Identity Services** | Authentication | OAuth for staff account binding | src/components/settings/google-oauth.tsx |
| **SQLite WASM + OPFS** | Database | Client-side persistent DB with offline support | src/lib/database.ts, src/lib/db-worker.ts |
| **TanStack Query** | State Management | Server state caching (mostly unused; future ready) | src/providers/query-provider.tsx |
| **Zustand** | State Management | Session state (orders, app config) | src/stores/*.ts |

---

## 1. Cloudflare R2 (S3-Compatible Object Storage)

**Purpose**: Durable cloud backup file storage with automatic retention cleanup.

**Connection Details**:
- **Endpoint**: `https://{accountId}.r2.cloudflarestorage.com`
- **Authentication**: AWS SDK v3 with Cloudflare R2 credentials
  - `R2_ACCOUNT_ID` — Cloudflare account ID
  - `R2_BUCKET_NAME` — R2 bucket name (e.g., "tianwen-backups")
  - `R2_ACCESS_KEY_ID` — S3-compatible access key
  - `R2_SECRET_ACCESS_KEY` — S3-compatible secret key
- **Protocol**: HTTPS (S3 API)
- **File Format**: `tianwen-{device}-{YYYY-MM-DD_HH-mm-ss}.sqlite.gz` (gzip-compressed SQLite)
- **Max File Size**: ~4.5MB (Vercel payload limit; mitigated by presigned URLs)

**Operations**:
- **PutObject** — Upload backup file
- **GetObject** — Download backup file
- **HeadObject** — Verify file exists (after upload)
- **ListObjectsV2** — List all backups in bucket
- **DeleteObject** — Delete old files (cleanup)

**API Endpoints**:

### `/api/backup/presign` (POST)
Generates presigned URLs to bypass Vercel 4.5MB payload limit.

**Request**:
```json
{
  "action": "upload" | "download",
  "filename": "tianwen-ipad-2026-04-11_14-30-00.sqlite.gz"
}
```

**Response**:
```json
{
  "url": "https://r2.cloudflarestorage.com/bucket/...",
  "expires_in": 600
}
```

**Usage**: Browser client calls presigned URL directly (PUT for upload, GET for download)

**File**: `api/backup/presign.ts`

### `/api/backup/complete` (POST)
Verifies uploaded file, cleans up old backups if count > MAX_BACKUPS (30).

**Request**:
```json
{
  "filename": "tianwen-ipad-2026-04-11_14-30-00.sqlite.gz"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Backup verified and cleanup complete"
}
```

**Logic**:
1. HeadObject to verify file exists
2. ListObjectsV2 to list all `.sqlite.gz` files
3. Sort by LastModified descending (newest first)
4. If count > 30, delete oldest (count - 30) files

**File**: `api/backup/complete.ts`

### `/api/backup` (GET)
Lists all available backups for restore.

**Response**:
```json
{
  "backups": [
    {
      "key": "tianwen-ipad-2026-04-11_14-30-00.sqlite.gz",
      "size": 1310720,
      "last_modified": 1712808600000,
      "device": "ipad"
    }
  ]
}
```

**Usage**: CloudBackup component populates modal with restore options

**File**: `api/backup/index.ts`

**Configuration** (via environment variables):
```env
# .env.local or Vercel dashboard
R2_ACCOUNT_ID=xxxxxxxxxxxxx
R2_BUCKET_NAME=tianwen-backups
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Usage in Code**:
- **Upload**: `src/lib/backup.ts:upload()` → calls `/api/backup/presign` → PUT to presigned URL
- **Download**: `src/lib/backup.ts:restoreDatabase()` → calls `/api/backup/presign` → GET from presigned URL
- **List**: `src/components/settings/cloud-backup.tsx` → calls `/api/backup` → shows restore options
- **Cleanup**: `api/backup/complete.ts` → auto-deletes oldest files if > 30

**File References**:
- Backend: `api/backup/presign.ts:1–50`, `api/backup/complete.ts:1–70`, `api/backup/index.ts:1–40`
- Client: `src/lib/backup.ts:1–150`, `src/components/settings/cloud-backup.tsx:1–200`

---

## 2. Vercel Serverless Functions (API Layer)

**Purpose**: Stateless backend for presigned URL generation, backup verification, and device identification.

**Deployment**: Vercel (automatic via `/api` directory)

**Environment**: Node.js runtime (currently using AWS SDK v3)

**Endpoints**:

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/backup/presign` | POST | Generate presigned URLs | None (R2 creds server-side) |
| `/api/backup/complete` | POST | Verify + cleanup | None |
| `/api/backup` | GET | List backups | None |
| `/api/health` | GET | Health check (optional) | None |
| `/api/device` | GET | Device identity (future) | None |

**Implementation Pattern**:
```typescript
// api/backup/presign.ts (example)
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const s3 = new S3Client({
    region: 'auto',
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  });
  
  const { action, filename } = req.body;
  
  const command = action === 'upload'
    ? new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: filename })
    : new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: filename });
  
  const url = await getSignedUrl(s3, command, { expiresIn: 600 }); // 10 minutes
  
  return res.json({ url });
}
```

**Cold Start**: ~500–2000ms (first invocation slower; subsequent cached)

**Timeout**: 60 seconds (Vercel default; sufficient for most operations)

**File References**:
- `api/backup/presign.ts` — Presigned URL generation
- `api/backup/complete.ts` — Verify + cleanup
- `api/backup/index.ts` — List backups
- `vercel.json` — Optional: Vercel config (build settings, env vars)

**Development**:
```bash
# Local testing with Vercel Functions
vercel env pull   # Pull env vars from Vercel dashboard
vercel dev        # Local dev server (exposes /api endpoints on http://localhost:3000/api/*)
```

---

## 3. Google Identity Services (OAuth)

**Purpose**: Staff account binding for multi-device account linking.

**Integration Library**: `@react-oauth/google` (React wrapper around Google Identity Services)

**Configuration**:
- **Google Client ID**: Set in environment (e.g., `VITE_GOOGLE_CLIENT_ID`)
- **Scope**: `profile email`
- **Login Flow**: Implicit (popup-based, no backend auth code exchange needed for this MVP)

**Usage in Code** (src/components/settings/google-oauth.tsx):
```typescript
import { useGoogleLogin } from '@react-oauth/google';

function GoogleOAuthComponent({ employeeId, onSuccess }) {
  const login = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      // credentialResponse.credential is JWT; decode to get { sub, email, name }
      const decoded = parseJwt(credentialResponse.credential);
      
      // Update employee record with OAuth identifiers
      await EmployeeRepository.update(employeeId, {
        google_sub: decoded.sub,
        google_email: decoded.email,
      });
      
      onSuccess();
    },
    onError: () => {
      // Handle error
    },
  });
  
  return <button onClick={() => login()}>Link Google</button>;
}
```

**OAuth Response**:
```typescript
{
  sub: "1234567890",           // Google unique subject ID
  email: "user@gmail.com",
  email_verified: true,
  name: "John Doe",
  given_name: "John",
  family_name: "Doe",
  picture: "https://...",
  aud: "YOUR_CLIENT_ID.apps.googleusercontent.com",
  iat: 1234567890,
  exp: 1234571490,
}
```

**Stored in Database**:
- `employees.google_sub` — Unique Google identifier
- `employees.google_email` — Bound email address

**Future Use Cases**:
1. **Multi-Device Recognition**: Log in on Device B, app recognizes employee from Google account
2. **Sync Settings**: Cloud-persist user preferences (theme, language) across devices
3. **Backup Restoration**: Tie backups to employee account instead of device

**Setup Instructions**:
1. Create Google OAuth app at https://console.cloud.google.com/
2. Set authorized redirect URIs: `http://localhost:5173`, `https://tianwen.vercel.app`
3. Generate Client ID
4. Set `VITE_GOOGLE_CLIENT_ID` in `.env.local` or Vercel dashboard

**File References**:
- `src/components/settings/google-oauth.tsx` — OAuth component
- `.env.example` — Example config
- `src/main.tsx` — GoogleOAuthProvider wrapper (around app root)

---

## 4. SQLite WASM + OPFS (Client-Side Database)

**Purpose**: Persistent client-side database with offline capability.

**Integration**:
- **SQLite WASM**: `@sqlite.org/sqlite-wasm` npm package (SQLite compiled to WebAssembly)
- **OPFS**: Open File System Access API (standard browser API; persists files to device storage)
- **VFS**: `opfs-sahpool` (Virtual File System abstraction for SQLite to use OPFS)

**Architecture**:
```
Browser Thread → AsyncDatabase (wrapper) → Web Worker (db-worker.ts)
                                               ↓
                                          SQLiteWasmDatabase
                                               ↓
                                          OPFS (opfs-sahpool VFS)
                                               ↓
                                          Device persistent storage
```

**Initialization** (src/lib/database.ts):
```typescript
import { initDatabase, AsyncDatabase } from '@/lib/worker-database';

// On app start:
const db = await initDatabase(); // Returns AsyncDatabase instance
```

**Web Worker** (src/lib/db-worker.ts):
```typescript
// Runs in separate thread; non-blocking I/O
import { initSchema } from '@/lib/schema';
import { SQLiteWasm } from '@/lib/sqlite-wasm';

const sqlite = new SQLiteWasm();
await sqlite.init();
await initSchema(sqlite); // Create tables, run migrations
```

**Query Interface** (AsyncDatabase):
```typescript
// Main thread can now query without blocking UI
const result = await db.all('SELECT * FROM orders WHERE date = ?', [today]);
const row = await db.get('SELECT * FROM employees WHERE id = ?', [empId]);
await db.run('INSERT INTO orders (...) VALUES (...)', [values]);
```

**Offline Capability**:
- All queries routed through Web Worker (non-blocking)
- SQLite persisted to OPFS (survives app close, device reboot)
- Order entry, employee management, analytics all work without internet
- Backup/restore require network (presigned URLs)

**Browser Support**:
- Chrome/Edge: OPFS supported (persistent)
- Safari: Requires polyfill (opfs-sahpool handles quirks)
- Firefox: Limited OPFS support; fallback to IndexedDB

**File References**:
- `src/lib/database.ts` — Main DB interface
- `src/lib/sqlite-wasm.ts` — SQLite WASM binary wrapper
- `src/lib/db-worker.ts` — Web Worker entry point
- `src/lib/worker-database.ts` — AsyncDatabase (main ↔ worker communication)
- `src/lib/schema.ts` — Schema definition + migrations

**Performance**:
- Query latency: ~1–5ms (in-process, no network)
- Backup size: ~5MB raw → ~1–2MB gzipped
- Typical dataset: 50+ orders/day, 50+ products, 20+ employees (< 10MB raw)

---

## 5. TanStack Query (Server State Management)

**Purpose**: Efficient server state caching and synchronization.

**Integration Library**: `@tanstack/react-query` (formerly React Query)

**Current Usage**: Minimal (mostly client-side SQLite; TanStack Query is future-ready for API expansion)

**Setup** (src/providers/query-provider.tsx):
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5 }, // 5 min
    mutations: { retry: 2 },
  },
});

export function QueryProvider({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

**Wrapped at App Root** (src/main.tsx):
```typescript
<QueryProvider>
  <App />
</QueryProvider>
```

**Potential Future Uses**:
1. **Sync Backup List**: `useQuery('backups', () => fetch('/api/backup'))`
2. **Multi-Device Sync**: `useQuery('sync', () => fetch('/api/sync/state'))` — watch other devices' changes
3. **Cloud Analytics**: `useQuery('analytics', () => fetch('/api/analytics'))` — cache remote KPIs
4. **Optimistic Updates**: Mutations with rollback for order edits
5. **Prefetch Routes**: Pre-fetch analytics data before user navigates

**File References**:
- `src/providers/query-provider.tsx` — Provider setup
- Potential usage: Any future API integration (currently none in use)

---

## 6. Zustand (State Management)

**Purpose**: Lightweight, persistent session state for app-wide configuration.

**Integration Library**: `zustand` (React store management)

**Stores**:

### `useOrderStore` (src/stores/order-store.ts)
**Purpose**: Cart session state (items, discounts, editing context)

**State Shape**:
```typescript
{
  operatorId: string | null;     // Store API exists, but NOT set by UI (always null)
  operatorName: string | null;   // Same — planned but not wired to any UI component
  items: CartItem[];             // Commodity items in cart
  discounts: Discount[];         // Applied discounts
  lastAddedItemId: string | null; // For scroll hints
  editingOrderId: string | null;  // If editing existing order
}
```

**Key Actions**:
- `setOperator(id, name)` — Store API exists but **no UI calls this** (only tests)
- `addItem(commodity)` — Add item to cart
- `removeItem(itemId)` — Remove item
- `updateQuantity(itemId, qty)` — Adjust quantity
- `addDiscount(label, amount)` — Add discount
- `removeDiscount(discountId)` — Remove discount
- `submitOrder(memoTags, editingOrderId)` — Create order (calls repository)
- `clearCart()` — Empty cart post-submit
- `startEditOrder(orderId, order, typeIdMap)` — Load order for editing

**Usage**:
```typescript
const { operatorName, items, addItem } = useOrderStore();
```

### `useBackupStore` (src/stores/backup-store.ts)
**Purpose**: Backup schedule preference, last backup time, progress

**State Shape**:
```typescript
{
  scheduleType: 'none' | 'daily' | 'weekly';
  lastBackupTime: number | null;
  isBackingUp: boolean;
  progress: number; // 0–100
}
```

**Key Actions**:
- `setScheduleType(type)` — Set backup frequency
- `setLastBackupTime(time)` — Record successful backup
- `startBackup()` — Begin backup (set progress=0)
- `finishBackup()` — Complete backup (set progress=100, isBackingUp=false)
- `hydrateFromDb()` — Load schedule from DB on app start

### `useInitStore` (src/stores/init-store.ts)
**Purpose**: Bootstrap status, overlay visibility, error messages

**State Shape**:
```typescript
{
  showInitUI: boolean;
  bootstrapDone: boolean;
  dbReady: boolean;
  shownAt: number | null; // For min 5s init duration
  v1ImportProgress: { phase: string; current: number; total: number };
  error: string | null;
}
```

**Key Actions**:
- `setShowInitUI()` — Show InitOverlay (records timestamp)
- `setBootstrapDone(done)` — Bootstrap complete
- `setError(msg)` — Set error state
- `setV1ImportProgress(phase, current, total)` — Track import

### `useAppStore` (src/stores/app-store.ts)
**Purpose**: General app config (theme, language, device settings)

**State Shape**:
```typescript
{
  theme: 'light' | 'dark';
  language: 'zh-TW' | 'en';
  deviceId: string;
}
```

**Persistence**:
- Some state hydrated from SQLite on app startup (e.g., backup schedule)
- Some state persisted to localStorage (e.g., theme preference)
- Some state transient (e.g., cart state; cleared on order submit)

**File References**:
- `src/stores/order-store.ts` — Order state
- `src/stores/backup-store.ts` — Backup state
- `src/stores/init-store.ts` — Bootstrap state
- `src/stores/app-store.ts` — App config

**Usage Pattern**:
```typescript
// Subscribe to state
const { operatorName, addItem } = useOrderStore();

// Subscribe to subset
const items = useOrderStore(state => state.items);

// Batch actions
useOrderStore.setState({ operatorId: 'emp-123', operatorName: 'John' });
```

---

## Integration Dependency Graph

```
┌─────────────────────────────────────────────────────────┐
│                   React App (UI)                        │
└──────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────┐
│  Zustand Stores (OrderStore, BackupStore, InitStore)    │
└──┬──────────────────────────────┬──────────────┬────────┘
   │                              │              │
   │ (session state)              │ (bootstrap)  │ (backup schedule)
   ↓                              ↓              ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Order Flow      │  │ Database Init    │  │  Backup Logic    │
│  (add items,     │  │ (WASM setup)     │  │  (compression,   │
│  submit)         │  │                  │  │   scheduling)    │
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               ↓
                    ┌──────────────────────┐
                    │  Repository Layer    │
                    │  (Data Access)       │
                    └────────┬─────────────┘
                             ↓
                    ┌──────────────────────┐
                    │ SQLite WASM + OPFS   │
                    │ (Persistent DB)      │
                    └────────┬─────────────┘
                             ↓
                    ┌──────────────────────┐
                    │ Vercel Functions     │
                    │ (Backup API)         │
                    └────────┬─────────────┘
                             ↓
        ┌────────────────────┬────────────────────┐
        ↓                    ↓                    ↓
   ┌─────────┐        ┌──────────────┐    ┌──────────────┐
   │Cloudflare R2│    │Google OAuth  │    │TanStack Query│
   │(Backup      │    │(Staff binding)      │(Future API)  │
   │Storage)     │    │              │    │              │
   └─────────┘        └──────────────┘    └──────────────┘
```

---

## Environment Configuration

**Required Environment Variables**:

```env
# Cloudflare R2
R2_ACCOUNT_ID=xxxxxxxxxxxxx
R2_BUCKET_NAME=tianwen-backups
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google OAuth
VITE_GOOGLE_CLIENT_ID=xxxxxxxxx.apps.googleusercontent.com

# Optional
VITE_API_URL=https://tianwen.vercel.app  # For local dev
VITE_LOG_LEVEL=debug                      # For verbose logging
```

**Setup**:
1. Create `.env.local` in project root
2. Copy `.env.example` and fill in values
3. For Vercel deployment, add to dashboard "Settings → Environment Variables"

---

## Testing Integrations

**Manual Testing**:
```bash
# Test Vercel Functions locally
vercel env pull && vercel dev

# Test R2 connection
curl -X POST http://localhost:3000/api/backup/presign \
  -H "Content-Type: application/json" \
  -d '{"action":"upload","filename":"test.sqlite.gz"}'

# Test SQLite WASM
npm run dev  # Open browser console, test DB queries
```

**Integration Tests**:
- `src/lib/__tests__/database.test.ts` — SQLite WASM + OPFS
- `api/__tests__/backup.test.ts` — R2 presigned URLs and cleanup
- `src/stores/__tests__/order-store.test.ts` — Zustand stores

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "Presigned URL invalid" | Credentials expired or missing | Check R2 env vars in Vercel |
| "OPFS not available" | Safari/Firefox OPFS not supported | polyfill in opfs-sahpool handles quirks |
| "Backup upload timeout" | File > 4.5MB or slow network | Presigned URL handles large files |
| "OAuth fails to bind" | Google Client ID mismatch | Verify VITE_GOOGLE_CLIENT_ID matches Google Console |
| "Zustand state not persisting" | No hydration from DB | Run hydrateFromDb() on app startup |

---

## Summary

Tianwen V2 integrates six external systems:

1. **Cloudflare R2** — S3-compatible backup storage with automatic retention
2. **Vercel Functions** — Serverless API for presigned URLs and backup verification
3. **Google OAuth** — Staff account binding (future multi-device sync)
4. **SQLite WASM + OPFS** — Client-side persistent database (offline-first)
5. **TanStack Query** — Future server state caching (currently minimal use)
6. **Zustand** — Session state management (orders, app config, bootstrap)

All integrations are modular, testable, and documented with file:line citations for easy navigation.

---

**Next Steps:**
- For architecture subsystems, see [06-architecture.md](06-architecture.md)
- For operational flows using these integrations, see [04-operational-flows.md](04-operational-flows.md)
