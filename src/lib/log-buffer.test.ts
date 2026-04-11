/**
 * Tests for the in-memory error log buffer used by cloud-backup import
 * and restore flows. Verifies buffering semantics, flush success and
 * failure, and module-level state isolation between tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockCreate = vi.hoisted(() => vi.fn())

vi.mock('@/lib/repositories/provider', () => ({
  getErrorLogRepo: () => ({
    create: mockCreate,
  }),
}))

// ── Import under test (after mocks) ────────────────────────────────────────

import {
  bufferLog,
  flushLogBuffer,
  clearLogBuffer,
  getLogBufferSize,
} from './log-buffer'

// ── Tests ──────────────────────────────────────────────────────────────────

describe('log-buffer', () => {
  beforeEach(() => {
    clearLogBuffer()
    mockCreate.mockReset()
    mockCreate.mockResolvedValue({})
  })

  describe('bufferLog', () => {
    it('adds an entry to the buffer without calling the repo', () => {
      bufferLog('boom', 'unit-test')
      expect(getLogBufferSize()).toBe(1)
      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('preserves the optional stack string', async () => {
      bufferLog('boom', 'unit-test', 'Error: boom\n  at foo')
      await flushLogBuffer()
      expect(mockCreate).toHaveBeenCalledWith(
        'boom',
        'unit-test',
        'Error: boom\n  at foo',
      )
    })

    it('supports multiple entries in order', async () => {
      bufferLog('first', 'unit-test')
      bufferLog('second', 'unit-test')
      bufferLog('third', 'unit-test')
      expect(getLogBufferSize()).toBe(3)

      await flushLogBuffer()
      expect(mockCreate).toHaveBeenCalledTimes(3)
      expect(mockCreate.mock.calls[0]?.[0]).toBe('first')
      expect(mockCreate.mock.calls[1]?.[0]).toBe('second')
      expect(mockCreate.mock.calls[2]?.[0]).toBe('third')
    })
  })

  describe('flushLogBuffer', () => {
    it('is a no-op when the buffer is empty', async () => {
      await flushLogBuffer()
      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('clears the buffer after a successful flush', async () => {
      bufferLog('boom', 'unit-test')
      await flushLogBuffer()
      expect(getLogBufferSize()).toBe(0)
    })

    it('re-buffers entries that fail to persist', async () => {
      mockCreate
        .mockResolvedValueOnce({}) // first entry succeeds
        .mockRejectedValueOnce(new Error('db write failed')) // second fails
        .mockResolvedValueOnce({}) // third succeeds

      bufferLog('first', 'unit-test')
      bufferLog('second', 'unit-test')
      bufferLog('third', 'unit-test')

      await flushLogBuffer()

      // Only the failed entry should remain buffered for retry
      expect(getLogBufferSize()).toBe(1)
      expect(mockCreate).toHaveBeenCalledTimes(3)
    })

    it('keeps failed entries available for a subsequent retry', async () => {
      // First flush — repo always rejects
      mockCreate.mockRejectedValue(new Error('offline'))
      bufferLog('boom', 'unit-test')
      await flushLogBuffer()
      expect(getLogBufferSize()).toBe(1)

      // Second flush — repo now succeeds, entry should finally drain
      mockCreate.mockReset()
      mockCreate.mockResolvedValue({})
      await flushLogBuffer()
      expect(mockCreate).toHaveBeenCalledWith('boom', 'unit-test', undefined)
      expect(getLogBufferSize()).toBe(0)
    })
  })

  describe('clearLogBuffer', () => {
    it('empties the buffer without persisting', () => {
      bufferLog('boom', 'unit-test')
      bufferLog('bang', 'unit-test')
      clearLogBuffer()
      expect(getLogBufferSize()).toBe(0)
      expect(mockCreate).not.toHaveBeenCalled()
    })
  })
})
