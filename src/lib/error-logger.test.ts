/**
 * Tests for the global error logger utility.
 * Verifies that logError calls the repository and silently handles failures.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the provider module before any imports
vi.mock('@/lib/repositories/provider', () => ({
  getErrorLogRepo: vi.fn(),
}))

import { logError, installGlobalErrorLogger } from './error-logger'
import { getErrorLogRepo } from '@/lib/repositories/provider'

function createMockRepo() {
  return {
    create: vi.fn().mockResolvedValue({
      id: 'log-1',
      message: 'test',
      source: 'test',
      stack: null,
      createdAt: Date.now(),
    }),
    findRecent: vi.fn(),
    findPaginated: vi.fn(async () => []),
    clearAll: vi.fn(),
    count: vi.fn(),
  }
}

describe('error-logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('logError()', () => {
    it('calls getErrorLogRepo().create() with message, source, and stack', () => {
      const mockRepo = createMockRepo()
      vi.mocked(getErrorLogRepo).mockReturnValue(mockRepo)

      logError('test error', 'test-source', 'Error: test\n  at foo.js:1')

      expect(mockRepo.create).toHaveBeenCalledWith(
        'test error',
        'test-source',
        'Error: test\n  at foo.js:1',
      )
    })

    it('calls getErrorLogRepo().create() without stack when not provided', () => {
      const mockRepo = createMockRepo()
      vi.mocked(getErrorLogRepo).mockReturnValue(mockRepo)

      logError('no stack error', 'test-source')

      expect(mockRepo.create).toHaveBeenCalledWith(
        'no stack error',
        'test-source',
        undefined,
      )
    })

    it('silently catches errors when getErrorLogRepo throws', () => {
      vi.mocked(getErrorLogRepo).mockImplementation(() => {
        throw new Error('Repos not initialized')
      })

      // Should NOT throw
      expect(() => logError('error', 'source')).not.toThrow()
    })

    it('silently catches errors when create() rejects', () => {
      const mockRepo = createMockRepo()
      mockRepo.create.mockRejectedValue(new Error('DB write failed'))
      vi.mocked(getErrorLogRepo).mockReturnValue(mockRepo)

      // Should NOT throw
      expect(() => logError('error', 'source')).not.toThrow()
    })
  })

  describe('installGlobalErrorLogger()', () => {
    let addEventListenerSpy: ReturnType<typeof vi.spyOn>
    let handlers: Map<string, EventListener>

    beforeEach(() => {
      handlers = new Map()
      addEventListenerSpy = vi
        .spyOn(window, 'addEventListener')
        .mockImplementation(
          (type: string, handler: EventListenerOrEventListenerObject) => {
            handlers.set(type, handler as EventListener)
          },
        )
    })

    afterEach(() => {
      addEventListenerSpy.mockRestore()
    })

    it('registers an error event listener on window', () => {
      installGlobalErrorLogger()

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'error',
        expect.any(Function),
      )
    })

    it('registers an unhandledrejection event listener on window', () => {
      installGlobalErrorLogger()

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'unhandledrejection',
        expect.any(Function),
      )
    })

    it('logs error events with message, filename, and stack', () => {
      const mockRepo = createMockRepo()
      vi.mocked(getErrorLogRepo).mockReturnValue(mockRepo)

      installGlobalErrorLogger()

      const errorHandler = handlers.get('error')
      expect(errorHandler).toBeDefined()

      // Simulate an error event
      const errorEvent = new ErrorEvent('error', {
        message: 'Uncaught ReferenceError',
        filename: 'app.js',
        error: new Error('x is not defined'),
      })

      errorHandler!(errorEvent)

      expect(mockRepo.create).toHaveBeenCalledWith(
        'Uncaught ReferenceError',
        'app.js',
        expect.any(String),
      )
    })

    it('uses "unknown" as source when filename is not available', () => {
      const mockRepo = createMockRepo()
      vi.mocked(getErrorLogRepo).mockReturnValue(mockRepo)

      installGlobalErrorLogger()

      const errorHandler = handlers.get('error')
      // Simulate an error event without filename by constructing a minimal event object
      const errorEvent = {
        message: 'Uncaught error',
        filename: '',
        error: undefined,
      } as unknown as ErrorEvent

      errorHandler!(errorEvent)

      expect(mockRepo.create).toHaveBeenCalledWith(
        'Uncaught error',
        'unknown',
        undefined,
      )
    })

    it('logs unhandled rejection with Error reason', () => {
      const mockRepo = createMockRepo()
      vi.mocked(getErrorLogRepo).mockReturnValue(mockRepo)

      installGlobalErrorLogger()

      const rejectionHandler = handlers.get('unhandledrejection')
      expect(rejectionHandler).toBeDefined()

      // Simulate an unhandled rejection with Error (PromiseRejectionEvent may not exist in happy-dom)
      const reason = new Error('Promise failed')
      const event = {
        reason,
        promise: Promise.resolve(),
      } as unknown as PromiseRejectionEvent

      rejectionHandler!(event)

      expect(mockRepo.create).toHaveBeenCalledWith(
        'Promise failed',
        'unhandledrejection',
        reason.stack,
      )
    })

    it('logs unhandled rejection with non-Error reason as string', () => {
      const mockRepo = createMockRepo()
      vi.mocked(getErrorLogRepo).mockReturnValue(mockRepo)

      installGlobalErrorLogger()

      const rejectionHandler = handlers.get('unhandledrejection')

      const event = {
        reason: 'string rejection',
        promise: Promise.resolve(),
      } as unknown as PromiseRejectionEvent

      rejectionHandler!(event)

      expect(mockRepo.create).toHaveBeenCalledWith(
        'string rejection',
        'unhandledrejection',
        undefined,
      )
    })
  })
})
