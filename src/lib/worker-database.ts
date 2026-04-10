/**
 * Async database proxy for the main thread.
 * Communicates with the SQLite Web Worker via postMessage.
 */

import type { QueryResult } from './database'

// ─── Types ──────────────────────────────────────────────────────────────────

/** Main → Worker message types */
export type WorkerRequest =
  | {
      readonly type: 'init'
      readonly enableDefaultData: boolean
      readonly deleteDefaultData: boolean
      readonly clearDbData: boolean
      readonly shouldResetData: boolean
    }
  | {
      readonly type: 'exec'
      readonly id: number
      readonly sql: string
      readonly params?: readonly unknown[]
    }
  | { readonly type: 'export-db'; readonly id: number }
  | {
      readonly type: 'import-db'
      readonly id: number
      readonly data: ArrayBuffer
    }
  | { readonly type: 'restore-prev-db'; readonly id: number }
  | { readonly type: 'has-prev-db'; readonly id: number }
  | { readonly type: 'get-db-sizes'; readonly id: number }
  | { readonly type: 'delete-prev-db'; readonly id: number }

/** Worker → Main message types */
export type WorkerResponse =
  | { readonly type: 'ready' }
  | { readonly type: 'init-done' }
  | { readonly type: 'init-error'; readonly error: string }
  | {
      readonly type: 'exec-result'
      readonly id: number
      readonly rows: unknown[]
      readonly changes: number
    }
  | { readonly type: 'exec-error'; readonly id: number; readonly error: string }
  | {
      readonly type: 'export-db-result'
      readonly id: number
      readonly data: ArrayBuffer
    }
  | {
      readonly type: 'export-db-error'
      readonly id: number
      readonly error: string
    }
  | { readonly type: 'import-db-result'; readonly id: number }
  | {
      readonly type: 'import-db-error'
      readonly id: number
      readonly error: string
    }
  | { readonly type: 'restore-prev-db-result'; readonly id: number }
  | {
      readonly type: 'restore-prev-db-error'
      readonly id: number
      readonly error: string
    }
  | {
      readonly type: 'has-prev-db-result'
      readonly id: number
      readonly hasPrev: boolean
    }
  | {
      readonly type: 'get-db-sizes-result'
      readonly id: number
      readonly currentRaw: number
      readonly currentCompressed: number
      readonly prevRaw: number
      readonly prevCompressed: number
    }
  | {
      readonly type: 'get-db-sizes-error'
      readonly id: number
      readonly error: string
    }
  | { readonly type: 'delete-prev-db-result'; readonly id: number }
  | {
      readonly type: 'delete-prev-db-error'
      readonly id: number
      readonly error: string
    }

/**
 * Raw and gzip-compressed byte counts for a database file. `raw` is the
 * uncompressed SQLite file size; `compressed` is the size it would be
 * after gzip (matching the unit used by `.sqlite.gz` files on R2).
 */
export interface DatabaseByteSizes {
  readonly raw: number
  readonly compressed: number
}

/**
 * Byte-size report for both the active DB and the previous snapshot.
 * Each field is 0 when the corresponding file does not exist.
 */
export interface DatabaseSizes {
  readonly current: DatabaseByteSizes
  readonly prev: DatabaseByteSizes
}

/** Async database interface for use on the main thread */
export interface AsyncDatabase {
  exec<T = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<QueryResult<T>>
  exportDatabase(): Promise<Uint8Array>
  importDatabase(data: ArrayBuffer): Promise<void>
  restorePreviousDatabase(): Promise<void>
  hasPreviousDatabase(): Promise<boolean>
  /**
   * Raw + gzipped byte counts for the active DB and the previous
   * snapshot. Combined into a single call so the worker can compute
   * both reports in one pass and the main thread can populate the
   * cloud-backup panel in a single React Query fetch.
   */
  getDatabaseSizes(): Promise<DatabaseSizes>
  /**
   * Delete the previous database snapshot. No-op if it does not exist.
   */
  deletePreviousDatabase(): Promise<void>
}

// ─── Pending request tracking ───────────────────────────────────────────────

interface PendingRequest {
  readonly resolve: (value: QueryResult<unknown>) => void
  readonly reject: (reason: Error) => void
}

interface PendingExportRequest {
  readonly resolve: (value: Uint8Array) => void
  readonly reject: (reason: Error) => void
}

interface PendingVoidRequest {
  readonly resolve: () => void
  readonly reject: (reason: Error) => void
}

interface PendingBoolRequest {
  readonly resolve: (value: boolean) => void
  readonly reject: (reason: Error) => void
}

interface PendingDatabaseSizesRequest {
  readonly resolve: (value: DatabaseSizes) => void
  readonly reject: (reason: Error) => void
}

// ─── Factory ────────────────────────────────────────────────────────────────

/**
 * Create an AsyncDatabase proxy that sends SQL to the worker
 * and resolves/rejects Promises based on worker responses.
 */
export function createWorkerDatabase(worker: Worker): AsyncDatabase {
  let nextId = 0
  const pending = new Map<number, PendingRequest>()
  const pendingExports = new Map<number, PendingExportRequest>()
  const pendingImports = new Map<number, PendingVoidRequest>()
  const pendingRestores = new Map<number, PendingVoidRequest>()
  const pendingHasPrev = new Map<number, PendingBoolRequest>()
  const pendingDbSizes = new Map<number, PendingDatabaseSizesRequest>()
  const pendingDeletePrev = new Map<number, PendingVoidRequest>()

  worker.addEventListener('message', (e: MessageEvent<WorkerResponse>) => {
    const msg = e.data

    if (msg.type === 'exec-result') {
      const p = pending.get(msg.id)
      if (p) {
        pending.delete(msg.id)
        p.resolve({ rows: msg.rows, changes: msg.changes })
      }
    }

    if (msg.type === 'exec-error') {
      const p = pending.get(msg.id)
      if (p) {
        pending.delete(msg.id)
        p.reject(new Error(msg.error))
      }
    }

    if (msg.type === 'export-db-result') {
      const p = pendingExports.get(msg.id)
      if (p) {
        pendingExports.delete(msg.id)
        p.resolve(new Uint8Array(msg.data))
      }
    }

    if (msg.type === 'export-db-error') {
      const p = pendingExports.get(msg.id)
      if (p) {
        pendingExports.delete(msg.id)
        p.reject(new Error(msg.error))
      }
    }

    if (msg.type === 'import-db-result') {
      const p = pendingImports.get(msg.id)
      if (p) {
        pendingImports.delete(msg.id)
        p.resolve()
      }
    }

    if (msg.type === 'import-db-error') {
      const p = pendingImports.get(msg.id)
      if (p) {
        pendingImports.delete(msg.id)
        p.reject(new Error(msg.error))
      }
    }

    if (msg.type === 'restore-prev-db-result') {
      const p = pendingRestores.get(msg.id)
      if (p) {
        pendingRestores.delete(msg.id)
        p.resolve()
      }
    }

    if (msg.type === 'restore-prev-db-error') {
      const p = pendingRestores.get(msg.id)
      if (p) {
        pendingRestores.delete(msg.id)
        p.reject(new Error(msg.error))
      }
    }

    if (msg.type === 'has-prev-db-result') {
      const p = pendingHasPrev.get(msg.id)
      if (p) {
        pendingHasPrev.delete(msg.id)
        p.resolve(msg.hasPrev)
      }
    }

    if (msg.type === 'get-db-sizes-result') {
      const p = pendingDbSizes.get(msg.id)
      if (p) {
        pendingDbSizes.delete(msg.id)
        p.resolve({
          current: { raw: msg.currentRaw, compressed: msg.currentCompressed },
          prev: { raw: msg.prevRaw, compressed: msg.prevCompressed },
        })
      }
    }

    if (msg.type === 'get-db-sizes-error') {
      const p = pendingDbSizes.get(msg.id)
      if (p) {
        pendingDbSizes.delete(msg.id)
        p.reject(new Error(msg.error))
      }
    }

    if (msg.type === 'delete-prev-db-result') {
      const p = pendingDeletePrev.get(msg.id)
      if (p) {
        pendingDeletePrev.delete(msg.id)
        p.resolve()
      }
    }

    if (msg.type === 'delete-prev-db-error') {
      const p = pendingDeletePrev.get(msg.id)
      if (p) {
        pendingDeletePrev.delete(msg.id)
        p.reject(new Error(msg.error))
      }
    }
  })

  return {
    exec<T = Record<string, unknown>>(
      sql: string,
      params?: readonly unknown[],
    ): Promise<QueryResult<T>> {
      return new Promise<QueryResult<T>>((resolve, reject) => {
        const id = nextId++
        pending.set(id, {
          resolve: resolve as (value: QueryResult<unknown>) => void,
          reject,
        })
        worker.postMessage({
          type: 'exec',
          id,
          sql,
          params: params ? [...params] : [],
        })
      })
    },

    exportDatabase(): Promise<Uint8Array> {
      return new Promise<Uint8Array>((resolve, reject) => {
        const id = nextId++
        pendingExports.set(id, { resolve, reject })
        worker.postMessage({ type: 'export-db', id })
      })
    },

    importDatabase(data: ArrayBuffer): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        const id = nextId++
        pendingImports.set(id, { resolve, reject })
        worker.postMessage({ type: 'import-db', id, data })
      })
    },

    restorePreviousDatabase(): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        const id = nextId++
        pendingRestores.set(id, { resolve, reject })
        worker.postMessage({ type: 'restore-prev-db', id })
      })
    },

    hasPreviousDatabase(): Promise<boolean> {
      return new Promise<boolean>((resolve, reject) => {
        const id = nextId++
        pendingHasPrev.set(id, { resolve, reject })
        worker.postMessage({ type: 'has-prev-db', id })
      })
    },

    getDatabaseSizes(): Promise<DatabaseSizes> {
      return new Promise<DatabaseSizes>((resolve, reject) => {
        const id = nextId++
        pendingDbSizes.set(id, { resolve, reject })
        worker.postMessage({ type: 'get-db-sizes', id })
      })
    },

    deletePreviousDatabase(): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        const id = nextId++
        pendingDeletePrev.set(id, { resolve, reject })
        worker.postMessage({ type: 'delete-prev-db', id })
      })
    },
  }
}

// ─── Lifecycle helpers ──────────────────────────────────────────────────────

/**
 * Wait for the worker to signal it is ready.
 * The worker posts { type: 'ready' } immediately on load.
 */
export function waitForWorkerReady(worker: Worker): Promise<void> {
  return new Promise(resolve => {
    const handler = (e: MessageEvent<WorkerResponse>) => {
      if (e.data.type === 'ready') {
        worker.removeEventListener('message', handler)
        resolve()
      }
    }
    worker.addEventListener('message', handler)
  })
}

/**
 * Send init message to the worker and wait for init-done or init-error.
 */
export function initWorkerDb(
  worker: Worker,
  enableDefaultData: boolean,
  deleteDefaultData: boolean,
  clearDbData: boolean,
  shouldResetData: boolean,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const handler = (e: MessageEvent<WorkerResponse>) => {
      if (e.data.type === 'init-done') {
        worker.removeEventListener('message', handler)
        resolve()
      }
      if (e.data.type === 'init-error') {
        worker.removeEventListener('message', handler)
        reject(new Error(e.data.error))
      }
    }
    worker.addEventListener('message', handler)
    worker.postMessage({
      type: 'init',
      enableDefaultData,
      deleteDefaultData,
      clearDbData,
      shouldResetData,
    })
  })
}
