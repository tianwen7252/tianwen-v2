/**
 * Tests for useAutoBackup hook.
 * Covers scheduling, overdue detection, visibility API, and backup execution.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// ── Hoisted Mocks ─────────────────────────────────────��────────────────────

const mockStartBackup = vi.fn()
const mockFinishBackup = vi.fn()
const mockSetLastBackupTime = vi.fn()

const mockStoreState = vi.hoisted(() => ({
  scheduleType: 'daily' as 'daily' | 'weekly' | 'none',
  scheduleHour: 22,
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

const mockCalculateNextDaily = vi.hoisted(() =>
  vi.fn(() => Date.now() + 3600000),
)
const mockCalculateNextWeekly = vi.hoisted(() =>
  vi.fn(() => Date.now() + 604800000),
)
const mockIsOverdue = vi.hoisted(() => vi.fn(() => false))

vi.mock('@/lib/backup-schedule', () => ({
  calculateNextDailyBackup: mockCalculateNextDaily,
  calculateNextWeeklyBackup: mockCalculateNextWeekly,
  isBackupOverdue: mockIsOverdue,
}))

// ── Import after mocks ─────────────────────────────────────────────────────

import { useAutoBackup } from './use-auto-backup'

// ── Tests ──────────────────────────────────────────────────────────────────

describe('useAutoBackup', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    mockStoreState.scheduleType = 'daily'
    mockStoreState.scheduleHour = 22
    mockStoreState.lastBackupTime = null
    mockStoreState.isBackingUp = false
    mockIsConfigured.value = false
    mockIsOverdue.mockReturnValue(false)
    mockCalculateNextDaily.mockReturnValue(Date.now() + 3600000)
    mockCalculateNextWeekly.mockReturnValue(Date.now() + 604800000)
    mockPerformBackup.mockResolvedValue({
      filename: 'backup-1234.sqlite.gz',
      size: 1024,
      durationMs: 500,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── enabled=false ──────────────────────────────────────────────────────

  it('does nothing when enabled is false', () => {
    renderHook(() => useAutoBackup({ enabled: false }))

    expect(vi.getTimerCount()).toBe(0)
    expect(mockCalculateNextDaily).not.toHaveBeenCalled()
    expect(mockCalculateNextWeekly).not.toHaveBeenCalled()
  })

  // ── scheduleType='none' ────────────────────────────────────────────────

  it('does nothing when scheduleType is none', () => {
    mockStoreState.scheduleType = 'none'
    renderHook(() => useAutoBackup({ enabled: true }))

    expect(vi.getTimerCount()).toBe(0)
    expect(mockCalculateNextDaily).not.toHaveBeenCalled()
  })

  // ── Daily schedule ─────────────────────────────────────────────────────

  it('sets a timeout for daily schedule', () => {
    mockStoreState.scheduleType = 'daily'
    const futureTime = Date.now() + 5000
    mockCalculateNextDaily.mockReturnValue(futureTime)

    renderHook(() => useAutoBackup({ enabled: true }))

    expect(mockCalculateNextDaily).toHaveBeenCalledWith(22, expect.any(Number))
    expect(vi.getTimerCount()).toBe(1)
  })

  // ── Weekly schedule ────────────────────────────────────────────────────

  it('sets a timeout for weekly schedule', () => {
    mockStoreState.scheduleType = 'weekly'
    const futureTime = Date.now() + 10000
    mockCalculateNextWeekly.mockReturnValue(futureTime)

    renderHook(() => useAutoBackup({ enabled: true }))

    expect(mockCalculateNextWeekly).toHaveBeenCalledWith(22, expect.any(Number))
    expect(vi.getTimerCount()).toBe(1)
  })

  // ── Backup not configured ─────────────────────────────────────────────

  it('skips backup silently when cloud backup is not configured', async () => {
    mockIsConfigured.value = false
    mockStoreState.scheduleType = 'daily'
    const futureTime = Date.now() + 1000
    mockCalculateNextDaily.mockReturnValue(futureTime)

    renderHook(() => useAutoBackup({ enabled: true }))

    await vi.advanceTimersByTimeAsync(1000)

    expect(mockStartBackup).not.toHaveBeenCalled()
    expect(mockPerformBackup).not.toHaveBeenCalled()
  })

  // ── Backup configured and triggers ────────────────────────────────────

  it('calls performBackup("auto") when configured and timer fires', async () => {
    mockIsConfigured.value = true
    mockStoreState.scheduleType = 'daily'
    const futureTime = Date.now() + 1000
    mockCalculateNextDaily.mockReturnValue(futureTime)

    renderHook(() => useAutoBackup({ enabled: true }))

    await vi.advanceTimersByTimeAsync(1000)

    expect(mockStartBackup).toHaveBeenCalledOnce()
    expect(mockPerformBackup).toHaveBeenCalledWith('auto')
    expect(mockFinishBackup).toHaveBeenCalledOnce()
    expect(mockSetLastBackupTime).toHaveBeenCalledOnce()
  })

  // ── Cleanup on unmount ─────────────────────────────────────────────────

  it('clears timeout on unmount', () => {
    mockStoreState.scheduleType = 'daily'
    const futureTime = Date.now() + 60000
    mockCalculateNextDaily.mockReturnValue(futureTime)

    const { unmount } = renderHook(() => useAutoBackup({ enabled: true }))

    expect(vi.getTimerCount()).toBe(1)

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })

  // ── Recalculates when schedule changes ─────────────────────────────────

  it('recalculates timeout when schedule changes', () => {
    mockStoreState.scheduleType = 'daily'
    const futureTime1 = Date.now() + 5000
    mockCalculateNextDaily.mockReturnValue(futureTime1)

    const { rerender } = renderHook(() => useAutoBackup({ enabled: true }))

    expect(vi.getTimerCount()).toBe(1)
    expect(mockCalculateNextDaily).toHaveBeenCalledTimes(1)

    mockStoreState.scheduleType = 'weekly'
    const futureTime2 = Date.now() + 100000
    mockCalculateNextWeekly.mockReturnValue(futureTime2)

    rerender()

    expect(mockCalculateNextWeekly).toHaveBeenCalled()
  })

  // ── Overdue check on mount ─────────────────────────────────────────────

  it('checks for overdue backup on mount', () => {
    mockStoreState.scheduleType = 'daily'
    mockStoreState.lastBackupTime = '2025-01-01T00:00:00Z'

    renderHook(() => useAutoBackup({ enabled: true }))

    expect(mockIsOverdue).toHaveBeenCalledWith(
      'daily',
      22,
      '2025-01-01T00:00:00Z',
    )
  })

  it('triggers performBackup when overdue and configured', async () => {
    mockIsConfigured.value = true
    mockStoreState.scheduleType = 'daily'
    mockIsOverdue.mockReturnValue(true)

    renderHook(() => useAutoBackup({ enabled: true }))

    await vi.advanceTimersByTimeAsync(100)

    expect(mockStartBackup).toHaveBeenCalled()
    expect(mockPerformBackup).toHaveBeenCalledWith('auto')
  })

  it('does not trigger backup when overdue but not configured', async () => {
    mockIsConfigured.value = false
    mockStoreState.scheduleType = 'daily'
    mockIsOverdue.mockReturnValue(true)

    renderHook(() => useAutoBackup({ enabled: true }))

    await vi.advanceTimersByTimeAsync(100)

    expect(mockStartBackup).not.toHaveBeenCalled()
    expect(mockPerformBackup).not.toHaveBeenCalled()
  })

  // ── Backup error handling ──────────────────────────────────────────────

  it('calls finishBackup with error message on performBackup failure', async () => {
    mockIsConfigured.value = true
    mockStoreState.scheduleType = 'daily'
    mockIsOverdue.mockReturnValue(true)

    mockPerformBackup.mockRejectedValueOnce(new Error('Upload failed'))

    renderHook(() => useAutoBackup({ enabled: true }))

    await vi.advanceTimersByTimeAsync(100)

    expect(mockStartBackup).toHaveBeenCalled()
    expect(mockFinishBackup).toHaveBeenCalledWith('Upload failed')
  })
})
