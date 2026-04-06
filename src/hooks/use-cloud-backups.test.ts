import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockListBackups = vi.hoisted(() =>
  vi.fn().mockResolvedValue([
    {
      filename: 'backup-300.sqlite.gz',
      size: 1024,
      createdAt: '2026-04-03T10:00:00Z',
    },
    {
      filename: 'backup-200.sqlite.gz',
      size: 2048,
      createdAt: '2026-04-02T10:00:00Z',
    },
    {
      filename: 'backup-100.sqlite.gz',
      size: 512,
      createdAt: '2026-04-01T10:00:00Z',
    },
  ]),
)

vi.mock('@/lib/backup', () => ({
  createBackupService: () => ({
    listBackups: mockListBackups,
  }),
}))

// ── Import after mocks ─────────────────────────────────────────────────────

import { useCloudBackups } from './use-cloud-backups'

// ── Helpers ────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('useCloudBackups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListBackups.mockResolvedValue([
      {
        filename: 'backup-300.sqlite.gz',
        size: 1024,
        createdAt: '2026-04-03T10:00:00Z',
      },
      {
        filename: 'backup-200.sqlite.gz',
        size: 2048,
        createdAt: '2026-04-02T10:00:00Z',
      },
      {
        filename: 'backup-100.sqlite.gz',
        size: 512,
        createdAt: '2026-04-01T10:00:00Z',
      },
    ])
  })

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useCloudBackups(), {
      wrapper: createWrapper(),
    })
    expect(result.current.isLoading).toBe(true)
  })

  it('returns backups list on success', async () => {
    const { result } = renderHook(() => useCloudBackups(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.backups).toHaveLength(3)
    expect(result.current.backups[0]?.filename).toBe('backup-300.sqlite.gz')
  })

  it('returns totalSize as sum of all backup sizes', async () => {
    const { result } = renderHook(() => useCloudBackups(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.totalSize).toBe(1024 + 2048 + 512)
  })

  it('returns backupCount', async () => {
    const { result } = renderHook(() => useCloudBackups(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.backupCount).toBe(3)
  })

  it('returns latestBackup as the most recent by createdAt', async () => {
    const { result } = renderHook(() => useCloudBackups(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.latestBackup?.filename).toBe('backup-300.sqlite.gz')
  })

  it('returns empty state when no backups exist', async () => {
    mockListBackups.mockResolvedValue([])

    const { result } = renderHook(() => useCloudBackups(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.backups).toHaveLength(0)
    expect(result.current.totalSize).toBe(0)
    expect(result.current.backupCount).toBe(0)
    expect(result.current.latestBackup).toBeNull()
  })

  it('returns error state on fetch failure', async () => {
    mockListBackups.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useCloudBackups(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.backups).toHaveLength(0)
  })
})
