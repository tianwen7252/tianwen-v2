/**
 * SQLite WASM implementation using @sqlite.org/sqlite-wasm.
 * Uses OpfsSAHPool VFS for Safari/iPad compatibility (no sub-workers needed).
 * Note: opfs-sahpool does NOT require COOP/COEP headers.
 */

import type {
  Database,
  DatabaseConfig,
  DatabaseFactory,
  QueryResult,
} from './database'

// Use the library's own types via dynamic import
type Sqlite3Static = Awaited<
  ReturnType<(typeof import('@sqlite.org/sqlite-wasm'))['default']>
>
type Sqlite3DB = InstanceType<Sqlite3Static['oo1']['DB']>

class SqliteWasmDatabase implements Database {
  private readonly db: Sqlite3DB

  constructor(db: Sqlite3DB) {
    this.db = db
  }

  get isReady(): boolean {
    return true
  }

  exec<T = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): QueryResult<T> {
    const rows = this.db.exec(sql, {
      returnValue: 'resultRows',
      rowMode: 'object',
      bind: params as (
        | string
        | number
        | null
        | bigint
        | Uint8Array
        | Int8Array
        | ArrayBuffer
      )[],
    }) as T[]

    return {
      rows,
      changes: this.db.changes(),
    }
  }

  close(): void {
    this.db.close()
  }
}

export const sqliteWasmFactory: DatabaseFactory = {
  async init(config: DatabaseConfig): Promise<Database> {
    // Dynamic import to avoid loading WASM in test environment
    const sqlite3InitModule = (await import('@sqlite.org/sqlite-wasm')).default

    const sqlite3 = await sqlite3InitModule()

    let db: Sqlite3DB

    if (config.mode === 'opfs-sahpool') {
      // Use SAH pool VFS for Safari compatibility (no sub-workers needed)
      const sahPoolUtil = await sqlite3.installOpfsSAHPoolVfs({
        clearOnInit: false,
        initialCapacity: 6,
      })

      db = new sahPoolUtil.OpfsSAHPoolDb(
        config.filename,
      ) as unknown as Sqlite3DB
    } else {
      // In-memory mode
      // db = new sqlite3.oo1.DB(':memory:')
      db = undefined as unknown as Sqlite3DB
      console.error('Unable to create OPFS database')
    }

    return new SqliteWasmDatabase(db)
  },
}
