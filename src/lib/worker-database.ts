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

/** Async database interface for use on the main thread */
export interface AsyncDatabase {
  exec<T = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<QueryResult<T>>
  exportDatabase(): Promise<Uint8Array>
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

// ─── Factory ────────────────────────────────────────────────────────────────

/**
 * Create an AsyncDatabase proxy that sends SQL to the worker
 * and resolves/rejects Promises based on worker responses.
 */
export function createWorkerDatabase(worker: Worker): AsyncDatabase {
  let nextId = 0
  const pending = new Map<number, PendingRequest>()
  const pendingExports = new Map<number, PendingExportRequest>()

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
