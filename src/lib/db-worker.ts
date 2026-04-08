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
      const rawDb = new sahPoolUtil.OpfsSAHPoolDb('tianwen.db')
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

    try {
      const pool = sahPoolUtilRef

      // 1. Write the import data into a temporary OPFS slot for validation
      await pool.importDb('tianwen-import.db', msg.data)

      // 2. Open a temporary connection and run integrity check
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tempDb = new (pool as any).OpfsSAHPoolDb('tianwen-import.db')
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
        pool.unlink('tianwen-import.db')
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

      // 4. Back up the current DB to tianwen-prev.db (replace if exists)
      try {
        pool.unlink('tianwen-prev.db')
      } catch {
        // tianwen-prev.db may not exist — ignore
      }
      const currentBytes = await pool.exportFile('tianwen.db')
      await pool.importDb('tianwen-prev.db', currentBytes)

      // 5. Replace tianwen.db with the import candidate
      pool.unlink('tianwen.db')
      const importBytes = await pool.exportFile('tianwen-import.db')
      await pool.importDb('tianwen.db', importBytes)
      pool.unlink('tianwen-import.db')

      // 6. Reopen the active connection on the new DB
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newRawDb = new (pool as any).OpfsSAHPoolDb('tianwen.db')
      rawDbHandle = newRawDb
      db = wrapSahPoolDb(newRawDb)
      initSchema((sql: string) => db!.exec(sql))

      post({ type: 'import-db-result', id: msg.id })
    } catch (err) {
      post({ type: 'import-db-error', id: msg.id, error: String(err) })
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

    try {
      const pool = sahPoolUtilRef
      const fileNames = pool.getFileNames()

      // SAHPool filenames may have a leading slash — check both forms
      const hasPrev =
        fileNames.includes('tianwen-prev.db') ||
        fileNames.includes('/tianwen-prev.db')

      if (!hasPrev) {
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

      // Copy tianwen-prev.db over tianwen.db
      const prevBytes = await pool.exportFile('tianwen-prev.db')
      pool.unlink('tianwen.db')
      await pool.importDb('tianwen.db', prevBytes)

      // Reopen the active connection
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newRawDb = new (pool as any).OpfsSAHPoolDb('tianwen.db')
      rawDbHandle = newRawDb
      db = wrapSahPoolDb(newRawDb)
      initSchema((sql: string) => db!.exec(sql))

      post({ type: 'restore-prev-db-result', id: msg.id })
    } catch (err) {
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
      const fileNames = sahPoolUtilRef.getFileNames()
      const hasPrev =
        fileNames.includes('tianwen-prev.db') ||
        fileNames.includes('/tianwen-prev.db')
      post({ type: 'has-prev-db-result', id: msg.id, hasPrev })
    } catch (err) {
      // On unexpected error fall back to false
      post({ type: 'has-prev-db-result', id: msg.id, hasPrev: false })
    }
  }
}

// Signal readiness
post({ type: 'ready' })
