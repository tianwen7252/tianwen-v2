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
})
