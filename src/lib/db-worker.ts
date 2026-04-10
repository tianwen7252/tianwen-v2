/**
 * Web Worker script for SQLite WASM + OPFS.
 * Runs in a dedicated worker thread; main thread communicates via postMessage.
 *
 * Vite processes this file via the URL constructor pattern, so @/ aliases work.
 */

import sqlite3InitModule from '@sqlite.org/sqlite-wasm'
import { initSchema } from '@/lib/schema'
import {
  insertDefaultCommodities,
  insertDefaultOrderTypes,
  deleteDefaultData,
  clearAllData,
} from '@/lib/default-data'
import type { WorkerRequest, WorkerResponse } from '@/lib/worker-database'
import type { Database } from '@/lib/database'

// ─── State ──────────────────────────────────────────────────────────────────

let db: Database | null = null
/** Raw SQLite db handle, needed for sqlite3_js_db_export */
let rawDbHandle: unknown = null
/** SQLite3 module reference, needed for capi.sqlite3_js_db_export */
let sqlite3Ref: Awaited<ReturnType<typeof sqlite3InitModule>> | null = null
/**
 * SAHPool utility, needed for importDb / exportFile / unlink / getFileNames.
 * Typed as unknown because the sqlite3-wasm type definitions don't export
 * the SAHPool utility type directly.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sahPoolUtilRef: any = null

// ─── File key normalization ────────────────────────────────────────────────
//
// When SQLite opens a file via `new OpfsSAHPoolDb('tianwen.db')`, its xOpen
// hook normalizes the path via `new URL(name, 'file://localhost/').pathname`
// which returns `/tianwen.db` (with a leading slash). That normalized key
// is what gets stored in the SAHPool's internal `mapFilenameToSAH` map.
//
// But the SAHPool's own API (`importDb`/`exportFile`/`unlink`) performs an
// exact-match lookup — `mapFilenameToSAH.get(name)` — with NO normalization.
// So calling `pool.exportFile('tianwen.db')` looks up `'tianwen.db'` (no
// slash) and misses, producing `Error: File not found: tianwen.db`. This
// was the root cause of the V2 cloud-backup import failure reported in
// V2-222.
//
// The helpers below always use the canonical `/`-prefixed key for writes
// (matching what SQLite xOpen will store) and tolerate legacy no-slash
// entries when reading, so existing devices that accidentally wrote a
// no-slash `tianwen-prev.db` still behave correctly after upgrade.

const DB_FILE = '/tianwen.db'
const PREV_DB_FILE = '/tianwen-prev.db'
const IMPORT_DB_FILE = '/tianwen-import.db'

/**
 * Find the actual storage key for a file in the SAH pool. SQLite xOpen
 * stores files with a leading slash; `pool.importDb()` called with a
 * no-slash name stores them without. Check both.
 *
 * Returns null if the file is not in the pool.
 */
function resolveFileKey(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pool: any,
  canonicalKey: string,
): string | null {
  const names: string[] = pool.getFileNames()
  if (names.includes(canonicalKey)) return canonicalKey
  // Fallback: legacy no-slash form
  const noSlash = canonicalKey.startsWith('/')
    ? canonicalKey.slice(1)
    : canonicalKey
  if (names.includes(noSlash)) return noSlash
  return null
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Thin wrapper to adapt the SAHPool DB to our Database interface */
function wrapSahPoolDb(rawDb: unknown): Database {
  const d = rawDb as {
    exec: (sql: string, opts?: Record<string, unknown>) => unknown
    changes: () => number
    close: () => void
  }
  return {
    isReady: true,
    exec<T = Record<string, unknown>>(
      sql: string,
      params?: readonly unknown[],
    ) {
      const rows = d.exec(sql, {
        returnValue: 'resultRows',
        rowMode: 'object',
        bind: params ? [...params] : [],
      }) as T[]
      return { rows, changes: d.changes() }
    },
    close() {
      d.close()
    },
  }
}

// ─── Post typed messages ────────────────────────────────────────────────────

function post(msg: WorkerResponse, transfer?: Transferable[]): void {
  if (transfer) {
    self.postMessage(msg, transfer)
  } else {
    self.postMessage(msg)
  }
}

// ─── Message handler ────────────────────────────────────────────────────────

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data

  if (msg.type === 'init') {
    try {
      const sqlite3 = await sqlite3InitModule()
      // iPad Safari can leave OPFS access handles locked briefly after a page
      // reload. Retry a few times so the previous context has time to release
      // them before we abort with an unrecoverable error.
      let sahPoolUtil: Awaited<
        ReturnType<typeof sqlite3.installOpfsSAHPoolVfs>
      > | null = null
      let lastErr: unknown = null
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          sahPoolUtil = await sqlite3.installOpfsSAHPoolVfs({
            clearOnInit: false,
            initialCapacity: 6,
          })
          break
        } catch (err) {
          lastErr = err
          const errMsg = err instanceof Error ? err.message : String(err)
          const isStaleHandle =
            errMsg.includes('InvalidStateError') ||
            errMsg.includes('invalid state')
          if (!isStaleHandle || attempt === 4) throw err
          // Wait for the previous context to release OPFS access handles
          await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)))
        }
      }
      if (!sahPoolUtil) throw lastErr ?? new Error('SAHPool init failed')
      sahPoolUtilRef = sahPoolUtil
      // Open via DB_FILE so the SAH pool stores the canonical slash-prefixed
      // key; subsequent pool.exportFile/importDb calls in import-db handler
      // use the same key and find the SAH.
      const rawDb = new sahPoolUtil.OpfsSAHPoolDb(DB_FILE)
      rawDbHandle = rawDb
      sqlite3Ref = sqlite3
      db = wrapSahPoolDb(rawDb)

      // Initialize schema + run migrations for existing DBs
      initSchema((sql: string) => db!.exec(sql))

      // Full wipe takes highest precedence
      if (msg.clearDbData) {
        clearAllData(db)
      } else if (msg.deleteDefaultData) {
        // Delete only default data items, leaving user-created data intact
        deleteDefaultData(db)
      }

      // Insert default data when enabled and not in a destructive mode.
      // Note: default employees are NOT inserted here — they are only seeded
      // via the dev test-data page (see insertTestData).
      if (msg.enableDefaultData && !msg.deleteDefaultData && !msg.clearDbData) {
        if (msg.shouldResetData) {
          // Version changed: clean slate for default items then re-insert
          deleteDefaultData(db)
          insertDefaultCommodities(db)
          insertDefaultOrderTypes(db)
        } else {
          // Insert only into empty tables
          const comCount = db.exec<{ cnt: number }>(
            'SELECT COUNT(*) as cnt FROM commodities',
          )
          if (Number(comCount.rows[0]?.cnt) === 0) {
            insertDefaultCommodities(db)
          }

          const otCount = db.exec<{ cnt: number }>(
            'SELECT COUNT(*) as cnt FROM order_types',
          )
          if (Number(otCount.rows[0]?.cnt) === 0) {
            insertDefaultOrderTypes(db)
          }
        }
      }

      post({ type: 'init-done' })
    } catch (err) {
      post({ type: 'init-error', error: String(err) })
    }
  }

  if (msg.type === 'exec') {
    if (!db) {
      post({
        type: 'exec-error',
        id: msg.id,
        error: 'Database not initialized',
      })
      return
    }

    try {
      const result = db.exec(msg.sql, msg.params)
      post({
        type: 'exec-result',
        id: msg.id,
        rows: [...result.rows],
        changes: result.changes,
      })
    } catch (err) {
      post({ type: 'exec-error', id: msg.id, error: String(err) })
    }
  }

  if (msg.type === 'export-db') {
    if (!db || !rawDbHandle || !sqlite3Ref) {
      post({
        type: 'export-db-error',
        id: msg.id,
        error: 'Database not initialized',
      })
      return
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bytes = sqlite3Ref.capi.sqlite3_js_db_export(rawDbHandle as any)
      // Copy into an isolated buffer — bytes.buffer is the live WASM heap,
      // transferring it directly would detach WASM memory and crash the worker.
      const copy = bytes.slice()
      post(
        {
          type: 'export-db-result',
          id: msg.id,
          data: copy.buffer,
        },
        [copy.buffer],
      )
    } catch (err) {
      post({ type: 'export-db-error', id: msg.id, error: String(err) })
    }
  }

  if (msg.type === 'import-db') {
    if (!sahPoolUtilRef) {
      post({
        type: 'import-db-error',
        id: msg.id,
        error: 'Database not initialized',
      })
      return
    }

    const pool = sahPoolUtilRef
    // Track swap progress so the catch block can attempt rollback. `true`
    // means we have already closed the active handle and must reopen one
    // before leaving the worker.
    let swapInProgress = false

    try {
      // 1. Write the import data into a temporary OPFS slot for validation.
      //    We intentionally unlink any leftover import file first so a
      //    previous aborted attempt does not conflict with this one.
      const leftoverImportKey = resolveFileKey(pool, IMPORT_DB_FILE)
      if (leftoverImportKey) {
        try {
          pool.unlink(leftoverImportKey)
        } catch {
          // Ignore — best effort cleanup
        }
      }
      await pool.importDb(IMPORT_DB_FILE, msg.data)

      // 2. Open a temporary connection and run integrity check
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tempDb = new (pool as any).OpfsSAHPoolDb(IMPORT_DB_FILE)
      let integrityResult: string
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = (tempDb as any).exec('PRAGMA integrity_check', {
          returnValue: 'resultRows',
          rowMode: 'array',
        }) as string[][]
        integrityResult = rows[0]?.[0] ?? 'error'
      } finally {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(tempDb as any).close()
      }

      if (integrityResult !== 'ok') {
        try {
          pool.unlink(IMPORT_DB_FILE)
        } catch {
          // Ignore
        }
        post({
          type: 'import-db-error',
          id: msg.id,
          error: `Integrity check failed: ${integrityResult}`,
        })
        return
      }

      // 3. Close the current active DB connection
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(rawDbHandle as any).close()
      db = null
      rawDbHandle = null
      swapInProgress = true

      // 4. Back up the current DB to tianwen-prev.db (replace if exists).
      //    Resolve the actual key in case legacy no-slash entries exist.
      const prevKey = resolveFileKey(pool, PREV_DB_FILE)
      if (prevKey) {
        try {
          pool.unlink(prevKey)
        } catch {
          // tianwen-prev.db may not exist — ignore
        }
      }
      const currentKey = resolveFileKey(pool, DB_FILE)
      if (!currentKey) {
        throw new Error(
          'Active database file is missing from the SAH pool (key mismatch)',
        )
      }
      const currentBytes = await pool.exportFile(currentKey)
      await pool.importDb(PREV_DB_FILE, currentBytes)

      // 5. Replace tianwen.db with the import candidate
      pool.unlink(currentKey)
      const importKey = resolveFileKey(pool, IMPORT_DB_FILE)
      if (!importKey) {
        throw new Error('Import candidate file is missing from the SAH pool')
      }
      const importBytes = await pool.exportFile(importKey)
      await pool.importDb(DB_FILE, importBytes)
      try {
        pool.unlink(importKey)
      } catch {
        // Ignore
      }

      // 6. Reopen the active connection on the new DB
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newRawDb = new (pool as any).OpfsSAHPoolDb(DB_FILE)
      rawDbHandle = newRawDb
      db = wrapSahPoolDb(newRawDb)
      initSchema((sql: string) => db!.exec(sql))
      swapInProgress = false

      post({ type: 'import-db-result', id: msg.id })
    } catch (err) {
      const originalError = String(err)

      // Rollback: if we closed the active handle, we MUST reopen something
      // before returning so the main thread can continue to use the DB.
      // Prefer the original tianwen.db if it still exists (swap failed
      // between close and backup); otherwise fall back to tianwen-prev.db
      // if we already backed it up.
      if (swapInProgress) {
        try {
          const recoverKey =
            resolveFileKey(pool, DB_FILE) ?? resolveFileKey(pool, PREV_DB_FILE)
          if (recoverKey) {
            // If we recovered via the prev snapshot, copy it back to DB_FILE
            // so the main handle opens the expected path.
            if (recoverKey !== DB_FILE && recoverKey !== '/tianwen.db') {
              const bytes = await pool.exportFile(recoverKey)
              await pool.importDb(DB_FILE, bytes)
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const recoveredDb = new (pool as any).OpfsSAHPoolDb(DB_FILE)
            rawDbHandle = recoveredDb
            db = wrapSahPoolDb(recoveredDb)
          }
        } catch {
          // Best-effort rollback — swallow any recovery error so the
          // caller still gets the original import failure.
        }
      }

      post({ type: 'import-db-error', id: msg.id, error: originalError })
    }
  }

  if (msg.type === 'restore-prev-db') {
    if (!sahPoolUtilRef) {
      post({
        type: 'restore-prev-db-error',
        id: msg.id,
        error: 'Database not initialized',
      })
      return
    }

    const pool = sahPoolUtilRef
    let swapInProgress = false

    try {
      const prevKey = resolveFileKey(pool, PREV_DB_FILE)
      if (!prevKey) {
        post({
          type: 'restore-prev-db-error',
          id: msg.id,
          error: 'No previous database',
        })
        return
      }

      // Close the active connection
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(rawDbHandle as any).close()
      db = null
      rawDbHandle = null
      swapInProgress = true

      // Copy tianwen-prev.db over tianwen.db
      const prevBytes = await pool.exportFile(prevKey)
      const currentKey = resolveFileKey(pool, DB_FILE)
      if (currentKey) {
        pool.unlink(currentKey)
      }
      await pool.importDb(DB_FILE, prevBytes)

      // Reopen the active connection
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newRawDb = new (pool as any).OpfsSAHPoolDb(DB_FILE)
      rawDbHandle = newRawDb
      db = wrapSahPoolDb(newRawDb)
      initSchema((sql: string) => db!.exec(sql))

      post({ type: 'restore-prev-db-result', id: msg.id })
    } catch (err) {
      // Attempt to reopen whichever file is still around so the main
      // thread can keep running.
      if (swapInProgress) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const recoveredDb = new (pool as any).OpfsSAHPoolDb(DB_FILE)
          rawDbHandle = recoveredDb
          db = wrapSahPoolDb(recoveredDb)
        } catch {
          // Best-effort
        }
      }
      post({ type: 'restore-prev-db-error', id: msg.id, error: String(err) })
    }
  }

  if (msg.type === 'has-prev-db') {
    if (!sahPoolUtilRef) {
      // No pool yet — report false rather than error
      post({ type: 'has-prev-db-result', id: msg.id, hasPrev: false })
      return
    }

    try {
      const hasPrev = resolveFileKey(sahPoolUtilRef, PREV_DB_FILE) !== null
      post({ type: 'has-prev-db-result', id: msg.id, hasPrev })
    } catch {
      // On unexpected error fall back to false
      post({ type: 'has-prev-db-result', id: msg.id, hasPrev: false })
    }
  }

  if (msg.type === 'get-prev-db-size') {
    if (!sahPoolUtilRef) {
      post({ type: 'get-prev-db-size-result', id: msg.id, size: 0 })
      return
    }

    try {
      const pool = sahPoolUtilRef
      const prevKey = resolveFileKey(pool, PREV_DB_FILE)
      if (!prevKey) {
        post({ type: 'get-prev-db-size-result', id: msg.id, size: 0 })
        return
      }
      // Export the raw SQLite file then gzip it so the size reported
      // matches the unit used by the cloud-backup-history list (which
      // shows `.sqlite.gz` sizes from R2). Showing the raw OPFS byte
      // count here confused users because the same DB appears with two
      // very different numbers (gzip is ~3x on this schema).
      const rawBytes = await pool.exportFile(prevKey)
      const gzipStream = new Blob([rawBytes as BlobPart])
        .stream()
        .pipeThrough(new CompressionStream('gzip'))
      const compressed = await new Response(gzipStream).arrayBuffer()
      post({
        type: 'get-prev-db-size-result',
        id: msg.id,
        size: compressed.byteLength,
      })
    } catch (err) {
      post({
        type: 'get-prev-db-size-error',
        id: msg.id,
        error: String(err),
      })
    }
  }

  if (msg.type === 'delete-prev-db') {
    if (!sahPoolUtilRef) {
      post({
        type: 'delete-prev-db-error',
        id: msg.id,
        error: 'Database not initialized',
      })
      return
    }

    try {
      const pool = sahPoolUtilRef
      const prevKey = resolveFileKey(pool, PREV_DB_FILE)
      if (prevKey) {
        pool.unlink(prevKey)
      }
      post({ type: 'delete-prev-db-result', id: msg.id })
    } catch (err) {
      post({ type: 'delete-prev-db-error', id: msg.id, error: String(err) })
    }
  }
}

// Signal readiness
post({ type: 'ready' })
