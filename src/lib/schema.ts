/**
 * V2 SQLite database schema definition.
 * Mirrors the V1 Dexie/IndexedDB data model with SQL-native improvements.
 */

export const SCHEMA_VERSION = 1

// SQL statements for creating the database schema
export const CREATE_TABLES = `
  -- Product categories
  CREATE TABLE IF NOT EXISTS commodity_types (
    id TEXT PRIMARY KEY,
    type_id TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '',
    priority INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
  );

  -- Products
  CREATE TABLE IF NOT EXISTS commodities (
    id TEXT PRIMARY KEY,
    type_id TEXT NOT NULL,
    name TEXT NOT NULL,
    image TEXT,
    price REAL NOT NULL DEFAULT 0,
    priority INTEGER NOT NULL DEFAULT 0,
    on_market INTEGER NOT NULL DEFAULT 1,
    hide_on_mode TEXT,
    editor TEXT,
    includes_soup INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
    FOREIGN KEY (type_id) REFERENCES commodity_types(type_id)
  );

  -- Orders
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    number INTEGER NOT NULL,
    memo TEXT NOT NULL DEFAULT '[]',
    soups INTEGER NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    original_total REAL,
    edited_memo TEXT,
    editor TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
  );

  CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

  -- Order types
  CREATE TABLE IF NOT EXISTS order_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 0,
    type TEXT NOT NULL DEFAULT 'order',
    color TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
    editor TEXT
  );

  -- Daily aggregated data
  CREATE TABLE IF NOT EXISTS daily_data (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    total REAL NOT NULL DEFAULT 0,
    original_total REAL NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
    editor TEXT NOT NULL DEFAULT ''
  );

  CREATE INDEX IF NOT EXISTS idx_daily_data_date ON daily_data(date);

  -- Employees
  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    shift_type TEXT DEFAULT 'regular',
    employee_no TEXT UNIQUE,
    is_admin INTEGER NOT NULL DEFAULT 0,
    hire_date TEXT,
    resignation_date TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
  );

  -- Attendance records
  CREATE TABLE IF NOT EXISTS attendances (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    date TEXT NOT NULL,
    clock_in INTEGER,
    clock_out INTEGER,
    type TEXT NOT NULL DEFAULT 'regular',
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );

  CREATE INDEX IF NOT EXISTS idx_attendances_employee_date
    ON attendances(employee_id, date);

  -- Order line items (normalized from orders.data JSON)
  CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    commodity_id TEXT NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 1,
    includes_soup INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

  -- Order discounts (normalized from orders.data JSON)
  CREATE TABLE IF NOT EXISTS order_discounts (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    label TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE INDEX IF NOT EXISTS idx_order_discounts_order_id ON order_discounts(order_id);

  -- Custom order names (for calculator overlay)
  CREATE TABLE IF NOT EXISTS custom_order_names (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
  );

  -- Error logs
  CREATE TABLE IF NOT EXISTS error_logs (
    id TEXT PRIMARY KEY,
    message TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT '',
    stack TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
  );

  CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);

  -- Backup logs
  CREATE TABLE IF NOT EXISTS backup_logs (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'manual',
    status TEXT NOT NULL DEFAULT 'success',
    filename TEXT,
    size INTEGER DEFAULT 0,
    duration_ms INTEGER DEFAULT 0,
    error_message TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
  );

  CREATE INDEX IF NOT EXISTS idx_backup_logs_created_at ON backup_logs(created_at);

  -- Price change logs
  CREATE TABLE IF NOT EXISTS price_change_logs (
    id TEXT PRIMARY KEY,
    commodity_id TEXT NOT NULL,
    commodity_name TEXT NOT NULL,
    old_price REAL NOT NULL,
    new_price REAL NOT NULL,
    editor TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
  );

  CREATE INDEX IF NOT EXISTS idx_price_change_logs_created_at ON price_change_logs(created_at);

  -- Schema version tracking
  CREATE TABLE IF NOT EXISTS schema_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  INSERT OR IGNORE INTO schema_meta (key, value)
    VALUES ('version', '${SCHEMA_VERSION}');
` as const

/**
 * Migrations for existing databases that predate schema changes.
 * Each migration is idempotent — safe to run on any database state.
 */
function runMigrations(exec: (sql: string) => void): void {
  // V2-76: Rename misspelled table names from V1
  try {
    exec('ALTER TABLE commondity_types RENAME TO commodity_types')
  } catch {
    // Table already renamed or was created with correct name
  }
  try {
    exec('ALTER TABLE commondities RENAME TO commodities')
  } catch {
    // Table already renamed or was created with correct name
  }

  // V2-29: Add image column to commodities (may not exist on older DBs)
  try {
    exec('ALTER TABLE commodities ADD COLUMN image TEXT')
  } catch {
    // Column already exists — safe to ignore
  }

  // V2-52: Add includes_soup column to commodities (may not exist on older DBs)
  try {
    exec(
      'ALTER TABLE commodities ADD COLUMN includes_soup INTEGER NOT NULL DEFAULT 0',
    )
  } catch {
    // Column already exists — safe to ignore
  }

  // V2-53: Add order_items table
  exec(`CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    commodity_id TEXT NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 1,
    includes_soup INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
    FOREIGN KEY (order_id) REFERENCES orders(id)
  )`)
  exec(
    'CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)',
  )

  // V2-53: Add order_discounts table
  exec(`CREATE TABLE IF NOT EXISTS order_discounts (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    label TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
    FOREIGN KEY (order_id) REFERENCES orders(id)
  )`)
  exec(
    'CREATE INDEX IF NOT EXISTS idx_order_discounts_order_id ON order_discounts(order_id)',
  )

  // V2-119: Add custom_order_names table (calculator overlay)
  exec(`CREATE TABLE IF NOT EXISTS custom_order_names (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
  )`)

  // V2-116: Add error_logs table
  exec(`CREATE TABLE IF NOT EXISTS error_logs (
    id TEXT PRIMARY KEY,
    message TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT '',
    stack TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
  )`)
  exec(
    'CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at)',
  )

  // V2-PM: Add priority column to commodity_types for drag-and-drop reorder
  try {
    exec(
      'ALTER TABLE commodity_types ADD COLUMN priority INTEGER NOT NULL DEFAULT 0',
    )
    // Backfill priority for existing rows based on rowid order
    exec(`
      UPDATE commodity_types SET priority = (
        SELECT COUNT(*) FROM commodity_types AS ct2 WHERE ct2.rowid <= commodity_types.rowid
      ) WHERE priority = 0
    `)
  } catch {
    // Column already exists -- safe to ignore
  }

  // V2-PM: Add price_change_logs table for tracking commodity price history
  exec(`CREATE TABLE IF NOT EXISTS price_change_logs (
    id TEXT PRIMARY KEY,
    commodity_id TEXT NOT NULL,
    commodity_name TEXT NOT NULL,
    old_price REAL NOT NULL,
    new_price REAL NOT NULL,
    editor TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
  )`)
  exec(
    'CREATE INDEX IF NOT EXISTS idx_price_change_logs_created_at ON price_change_logs(created_at)',
  )

  // V2-130: Add backup_logs table
  exec(`CREATE TABLE IF NOT EXISTS backup_logs (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'manual',
    status TEXT NOT NULL DEFAULT 'success',
    filename TEXT,
    size INTEGER DEFAULT 0,
    duration_ms INTEGER DEFAULT 0,
    error_message TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
  )`)
  exec(
    'CREATE INDEX IF NOT EXISTS idx_backup_logs_created_at ON backup_logs(created_at)',
  )

  // DEV-100: Strip images/aminals/ prefix from employee avatars.
  // Avatar values are now stored as filename-only (e.g. '1308845.png').
  exec(
    "UPDATE employees SET avatar = REPLACE(avatar, 'images/aminals/', '') WHERE avatar LIKE 'images/aminals/%'",
  )
}

/**
 * Initialize the database schema.
 * Idempotent — safe to call multiple times.
 */
export function initSchema(exec: (sql: string) => void): void {
  exec('PRAGMA foreign_keys = ON')
  exec(CREATE_TABLES)
  runMigrations(exec)
}
