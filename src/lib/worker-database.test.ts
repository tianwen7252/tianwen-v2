import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createWorkerDatabase } from './worker-database'
import type { WorkerResponse } from './worker-database'

/**
 * Mock Worker that captures postMessage calls and allows
 * simulating responses from the worker thread.
 */
function createMockWorker() {
  const listeners: Array<(e: MessageEvent<WorkerResponse>) => void> = []

  const worker = {
    addEventListener: vi.fn(
      (_event: string, handler: (e: MessageEvent<WorkerResponse>) => void) => {
        listeners.push(handler)
      },
    ),
    removeEventListener: vi.fn(),
    postMessage: vi.fn(),
  } as unknown as Worker

  /** Simulate a response from the worker */
  function respond(data: WorkerResponse): void {
    for (const listener of listeners) {
      listener({ data } as MessageEvent<WorkerResponse>)
    }
  }

  return { worker, respond }
}

describe('createWorkerDatabase', () => {
  let mockWorker: ReturnType<typeof createMockWorker>

  beforeEach(() => {
    mockWorker = createMockWorker()
  })

  describe('exportDatabase()', () => {
    it('should send export-db message to worker', () => {
      const db = createWorkerDatabase(mockWorker.worker)

      // Fire and forget - we just want to check the message was sent
      db.exportDatabase()

      expect(mockWorker.worker.postMessage).toHaveBeenCalledWith({
        type: 'export-db',
        id: expect.any(Number),
      })
    })

    it('should resolve with Uint8Array on success', async () => {
      const db = createWorkerDatabase(mockWorker.worker)
      const expectedData = new Uint8Array([1, 2, 3, 4, 5])

      const promise = db.exportDatabase()

      // Simulate worker responding with export-db-result
      const sentMessage = (
        mockWorker.worker.postMessage as ReturnType<typeof vi.fn>
      ).mock.calls[0]?.[0] as { id: number }
      mockWorker.respond({
        type: 'export-db-result',
        id: sentMessage.id,
        data: expectedData.buffer as ArrayBuffer,
      })

      const result = await promise

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result).toEqual(expectedData)
    })

    it('should reject on error response', async () => {
      const db = createWorkerDatabase(mockWorker.worker)

      const promise = db.exportDatabase()

      // Simulate worker responding with export-db-error
      const sentMessage = (
        mockWorker.worker.postMessage as ReturnType<typeof vi.fn>
      ).mock.calls[0]?.[0] as { id: number }
      mockWorker.respond({
        type: 'export-db-error',
        id: sentMessage.id,
        error: 'Database not initialized',
      })

      await expect(promise).rejects.toThrow('Database not initialized')
    })

    it('should use unique IDs for concurrent export requests', () => {
      const db = createWorkerDatabase(mockWorker.worker)

      db.exportDatabase()
      db.exportDatabase()

      const calls = (mockWorker.worker.postMessage as ReturnType<typeof vi.fn>)
        .mock.calls
      const id1 = (calls[0]?.[0] as { id: number }).id
      const id2 = (calls[1]?.[0] as { id: number }).id

      expect(id1).not.toBe(id2)
    })

    it('should not interfere with exec() message ID counter', async () => {
      const db = createWorkerDatabase(mockWorker.worker)

      // Send an exec first, then export
      db.exec('SELECT 1')
      db.exportDatabase()

      const calls = (mockWorker.worker.postMessage as ReturnType<typeof vi.fn>)
        .mock.calls
      const execId = (calls[0]?.[0] as { id: number }).id
      const exportId = (calls[1]?.[0] as { id: number }).id

      // IDs should be sequential and unique
      expect(exportId).toBe(execId + 1)
    })
  })

  // ── importDatabase ────────────────────────────────────────────────────────

  describe('importDatabase()', () => {
    it('should send import-db message to worker with the provided ArrayBuffer', () => {
      const db = createWorkerDatabase(mockWorker.worker)
      const buf = new ArrayBuffer(8)

      db.importDatabase(buf)

      expect(mockWorker.worker.postMessage).toHaveBeenCalledWith({
        type: 'import-db',
        id: expect.any(Number),
        data: buf,
      })
    })

    it('should resolve with undefined on import-db-result', async () => {
      const db = createWorkerDatabase(mockWorker.worker)
      const buf = new ArrayBuffer(8)

      const promise = db.importDatabase(buf)

      const sentMessage = (
        mockWorker.worker.postMessage as ReturnType<typeof vi.fn>
      ).mock.calls[0]?.[0] as { id: number }
      mockWorker.respond({ type: 'import-db-result', id: sentMessage.id })

      await expect(promise).resolves.toBeUndefined()
    })

    it('should reject with error message on import-db-error', async () => {
      const db = createWorkerDatabase(mockWorker.worker)
      const buf = new ArrayBuffer(8)

      const promise = db.importDatabase(buf)

      const sentMessage = (
        mockWorker.worker.postMessage as ReturnType<typeof vi.fn>
      ).mock.calls[0]?.[0] as { id: number }
      mockWorker.respond({
        type: 'import-db-error',
        id: sentMessage.id,
        error: 'Integrity check failed',
      })

      await expect(promise).rejects.toThrow('Integrity check failed')
    })

    it('should use unique IDs for concurrent import requests', () => {
      const db = createWorkerDatabase(mockWorker.worker)

      db.importDatabase(new ArrayBuffer(4))
      db.importDatabase(new ArrayBuffer(4))

      const calls = (mockWorker.worker.postMessage as ReturnType<typeof vi.fn>)
        .mock.calls
      const id1 = (calls[0]?.[0] as { id: number }).id
      const id2 = (calls[1]?.[0] as { id: number }).id

      expect(id1).not.toBe(id2)
    })

    it('should not resolve wrong pending request when multiple are in-flight', async () => {
      const db = createWorkerDatabase(mockWorker.worker)

      const p1 = db.importDatabase(new ArrayBuffer(4))
      const p2 = db.importDatabase(new ArrayBuffer(4))

      const calls = (mockWorker.worker.postMessage as ReturnType<typeof vi.fn>)
        .mock.calls
      const id1 = (calls[0]?.[0] as { id: number }).id
      const id2 = (calls[1]?.[0] as { id: number }).id

      // Resolve p2 first
      mockWorker.respond({ type: 'import-db-result', id: id2 })
      mockWorker.respond({ type: 'import-db-result', id: id1 })

      await expect(p1).resolves.toBeUndefined()
      await expect(p2).resolves.toBeUndefined()
    })
  })

  // ── restorePreviousDatabase ───────────────────────────────────────────────

  describe('restorePreviousDatabase()', () => {
    it('should send restore-prev-db message to worker', () => {
      const db = createWorkerDatabase(mockWorker.worker)

      db.restorePreviousDatabase()

      expect(mockWorker.worker.postMessage).toHaveBeenCalledWith({
        type: 'restore-prev-db',
        id: expect.any(Number),
      })
    })

    it('should resolve with undefined on restore-prev-db-result', async () => {
      const db = createWorkerDatabase(mockWorker.worker)

      const promise = db.restorePreviousDatabase()

      const sentMessage = (
        mockWorker.worker.postMessage as ReturnType<typeof vi.fn>
      ).mock.calls[0]?.[0] as { id: number }
      mockWorker.respond({ type: 'restore-prev-db-result', id: sentMessage.id })

      await expect(promise).resolves.toBeUndefined()
    })

    it('should reject with error message on restore-prev-db-error', async () => {
      const db = createWorkerDatabase(mockWorker.worker)

      const promise = db.restorePreviousDatabase()

      const sentMessage = (
        mockWorker.worker.postMessage as ReturnType<typeof vi.fn>
      ).mock.calls[0]?.[0] as { id: number }
      mockWorker.respond({
        type: 'restore-prev-db-error',
        id: sentMessage.id,
        error: 'No previous database',
      })

      await expect(promise).rejects.toThrow('No previous database')
    })
  })

  // ── hasPreviousDatabase ───────────────────────────────────────────────────

  describe('hasPreviousDatabase()', () => {
    it('should send has-prev-db message to worker', () => {
      const db = createWorkerDatabase(mockWorker.worker)

      db.hasPreviousDatabase()

      expect(mockWorker.worker.postMessage).toHaveBeenCalledWith({
        type: 'has-prev-db',
        id: expect.any(Number),
      })
    })

    it('should resolve with true when hasPrev is true', async () => {
      const db = createWorkerDatabase(mockWorker.worker)

      const promise = db.hasPreviousDatabase()

      const sentMessage = (
        mockWorker.worker.postMessage as ReturnType<typeof vi.fn>
      ).mock.calls[0]?.[0] as { id: number }
      mockWorker.respond({
        type: 'has-prev-db-result',
        id: sentMessage.id,
        hasPrev: true,
      })

      await expect(promise).resolves.toBe(true)
    })

    it('should resolve with false when hasPrev is false', async () => {
      const db = createWorkerDatabase(mockWorker.worker)

      const promise = db.hasPreviousDatabase()

      const sentMessage = (
        mockWorker.worker.postMessage as ReturnType<typeof vi.fn>
      ).mock.calls[0]?.[0] as { id: number }
      mockWorker.respond({
        type: 'has-prev-db-result',
        id: sentMessage.id,
        hasPrev: false,
      })

      await expect(promise).resolves.toBe(false)
    })

    it('should use unique IDs for concurrent hasPreviousDatabase requests', () => {
      const db = createWorkerDatabase(mockWorker.worker)

      db.hasPreviousDatabase()
      db.hasPreviousDatabase()

      const calls = (mockWorker.worker.postMessage as ReturnType<typeof vi.fn>)
        .mock.calls
      const id1 = (calls[0]?.[0] as { id: number }).id
      const id2 = (calls[1]?.[0] as { id: number }).id

      expect(id1).not.toBe(id2)
    })
  })
})
