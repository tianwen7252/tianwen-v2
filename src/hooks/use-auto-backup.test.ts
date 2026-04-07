/**
 * Tests for useAutoBackup hook.
 * Covers overdue detection, visibility API, and backup execution.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// ── Hoisted Mocks ──────────────────────────────────────────────────────────

const mockStartBackup = vi.fn()
const mockFinishBackup = vi.fn()
const mockSetLastBackupTime = vi.fn()

const mockStoreState = vi.hoisted(() => ({
  scheduleType: 'daily' as 'daily' | 'weekly' | 'none',
  lastBackupTime: null as string | null,
  isBackingUp: false,
}))

vi.mock('@/stores/backup-store', () => ({
  useBackupStore: Object.assign(
    vi.fn(
      (
        selector: (
          state: typeof mockStoreState & {
            startBackup: typeof mockStartBackup
            finishBackup: typeof mockFinishBackup
            setLastBackupTime: typeof mockSetLastBackupTime
          },
        ) => unknown,
      ) =>
        selector({
          ...mockStoreState,
          startBackup: mockStartBackup,
          finishBackup: mockFinishBackup,
          setLastBackupTime: mockSetLastBackupTime,
        }),
    ),
    {
      getState: () => ({
        ...mockStoreState,
        startBackup: mockStartBackup,
        finishBackup: mockFinishBackup,
        setLastBackupTime: mockSetLastBackupTime,
      }),
    },
  ),
}))

const mockIsConfigured = vi.hoisted(() => ({ value: false }))

vi.mock('@/lib/backup-config', () => ({
  isBackupConfigured: () => mockIsConfigured.value,
}))

const mockPerformBackup = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    filename: 'backup-1234.sqlite.gz',
    size: 1024,
    durationMs: 500,
  }),
)

vi.mock('@/lib/perform-backup', () => ({
  performBackup: mockPerformBackup,
}))

const mockIsOverdue = vi.hoisted(() => vi.fn(() => false))

vi.mock('@/lib/backup-schedule', () => ({
  isBackupOverdue: mockIsOverdue,
}))

// ── Import after mocks ─────────────────────────────────────────────────────

import { useAutoBackup } from './use-auto-backup'

// ── Tests ──────────────────────────────────────────────────────────────────

describe('useAutoBackup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStoreState.scheduleType = 'daily'
    mockStoreState.lastBackupTime = null
    mockStoreState.isBackingUp = false
    mockIsConfigured.value = false
    mockIsOverdue.mockReturnValue(false)
    mockPerformBackup.mockResolvedValue({
      filename: 'backup-1234.sqlite.gz',
      size: 1024,
      durationMs: 500,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does nothing when enabled is false', () => {
    renderHook(() => useAutoBackup({ enabled: false }))
    expect(mockIsOverdue).not.toHaveBeenCalled()
  })

  it('does nothing when scheduleType is none', () => {
    mockStoreState.scheduleType = 'none'
    renderHook(() => useAutoBackup({ enabled: true }))
    expect(mockIsOverdue).not.toHaveBeenCalled()
  })

  it('checks isBackupOverdue on mount with correct args', () => {
    mockStoreState.scheduleType = 'daily'
    mockStoreState.lastBackupTime = '2025-01-01T00:00:00Z'

    renderHook(() => useAutoBackup({ enabled: true }))

    expect(mockIsOverdue).toHaveBeenCalledWith('daily', '2025-01-01T00:00:00Z')
  })

  it('skips backup when not overdue', () => {
    mockIsOverdue.mockReturnValue(false)
    renderHook(() => useAutoBackup({ enabled: true }))
    expect(mockStartBackup).not.toHaveBeenCalled()
  })

  it('skips backup when overdue but not configured', async () => {
    vi.useFakeTimers()
    mockIsConfigured.value = false
    mockIsOverdue.mockReturnValue(true)

    renderHook(() => useAutoBackup({ enabled: true }))
    await vi.advanceTimersByTimeAsync(100)

    expect(mockStartBackup).not.toHaveBeenCalled()
    expect(mockPerformBackup).not.toHaveBeenCalled()
  })

  it('calls performBackup("auto") when overdue and configured', async () => {
    vi.useFakeTimers()
    mockIsConfigured.value = true
    mockIsOverdue.mockReturnValue(true)

    renderHook(() => useAutoBackup({ enabled: true }))
    await vi.advanceTimersByTimeAsync(100)

    expect(mockStartBackup).toHaveBeenCalledOnce()
    expect(mockPerformBackup).toHaveBeenCalledWith('auto')
    expect(mockFinishBackup).toHaveBeenCalledOnce()
    expect(mockSetLastBackupTime).toHaveBeenCalledOnce()
  })

  it('calls finishBackup with error on performBackup failure', async () => {
    vi.useFakeTimers()
    mockIsConfigured.value = true
    mockIsOverdue.mockReturnValue(true)
    mockPerformBackup.mockRejectedValueOnce(new Error('Upload failed'))

    renderHook(() => useAutoBackup({ enabled: true }))
    await vi.advanceTimersByTimeAsync(100)

    expect(mockStartBackup).toHaveBeenCalled()
    expect(mockFinishBackup).toHaveBeenCalledWith('Upload failed')
  })
})
