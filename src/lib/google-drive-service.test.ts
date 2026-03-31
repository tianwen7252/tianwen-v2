/**
 * Tests for Google Drive service — list and download backup files.
 * Covers folder lookup, file listing, and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AuthExpiredError } from './errors'

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockFetch = vi.fn()

beforeEach(() => {
  mockFetch.mockReset()
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.restoreAllMocks()
})

import {
  listDriveBackupFiles,
  downloadDriveFile,
  type DriveFile,
} from './google-drive-service'

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Mock a successful folder lookup returning the given folder ID */
function mockFolderFound(folderId: string) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ files: [{ id: folderId, name: 'backup' }] }),
  })
}

/** Mock a folder lookup that finds no "backup" folder */
function mockFolderNotFound() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ files: [] }),
  })
}

// ── listDriveBackupFiles ────────────────────────────────────────────────────

describe('listDriveBackupFiles', () => {
  const TOKEN = 'test-access-token'

  it('first searches for backup folder, then lists files in it', async () => {
    mockFolderFound('folder-123')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ files: [] }),
    })

    await listDriveBackupFiles(TOKEN)

    expect(mockFetch).toHaveBeenCalledTimes(2)

    // First call: find folder
    const [folderUrl] = mockFetch.mock.calls[0]!
    expect(folderUrl).toContain('google-apps.folder')
    expect(folderUrl).toContain('backup')

    // Second call: list files in folder
    const [filesUrl] = mockFetch.mock.calls[1]!
    expect(filesUrl).toContain('folder-123')
    expect(filesUrl).toContain('in+parents')
    expect(filesUrl).toContain('orderBy=createdTime+desc')
  })

  it('returns parsed file list from backup folder', async () => {
    const files: DriveFile[] = [
      {
        id: 'file-1',
        name: 'tianwen-backup-2026-03-29.db.gz',
        size: 1024,
        createdTime: '2026-03-29T10:00:00Z',
        mimeType: 'application/gzip',
      },
      {
        id: 'file-2',
        name: 'backup-daily-2026-03-28.db.gz',
        size: 2048,
        createdTime: '2026-03-28T10:00:00Z',
        mimeType: 'application/gzip',
      },
    ]

    mockFolderFound('folder-abc')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ files }),
    })

    const result = await listDriveBackupFiles(TOKEN)

    expect(result).toHaveLength(2)
    expect(result[0]).toBeDefined()
    expect(result[0]!.id).toBe('file-1')
    expect(result[0]!.name).toBe('tianwen-backup-2026-03-29.db.gz')
    expect(result[1]!.id).toBe('file-2')
  })

  it('returns empty array when backup folder not found', async () => {
    mockFolderNotFound()

    const result = await listDriveBackupFiles(TOKEN)

    // Should only make one call (folder lookup) and return early
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(result).toEqual([])
  })

  it('returns empty array when folder is empty', async () => {
    mockFolderFound('folder-empty')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ files: [] }),
    })

    const result = await listDriveBackupFiles(TOKEN)

    expect(result).toEqual([])
  })

  it('throws AuthExpiredError on 401 during folder lookup', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    })

    await expect(listDriveBackupFiles(TOKEN)).rejects.toBeInstanceOf(
      AuthExpiredError,
    )
  })

  it('throws AuthExpiredError on 401 during file listing', async () => {
    mockFolderFound('folder-auth-err')
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    })

    await expect(listDriveBackupFiles(TOKEN)).rejects.toBeInstanceOf(
      AuthExpiredError,
    )
  })

  it('throws on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    await expect(listDriveBackupFiles(TOKEN)).rejects.toThrow('Network error')
  })

  it('throws on non-OK response during file listing', async () => {
    mockFolderFound('folder-err')
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })

    await expect(listDriveBackupFiles(TOKEN)).rejects.toThrow(/500/)
  })
})

// ── downloadDriveFile ───────────────────────────────────────────────────────

describe('downloadDriveFile', () => {
  const TOKEN = 'test-access-token'
  const FILE_ID = 'file-abc-123'

  it('makes correct API call with authorization and alt=media', async () => {
    const buffer = new ArrayBuffer(8)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => buffer,
    })

    await downloadDriveFile(TOKEN, FILE_ID)

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, options] = mockFetch.mock.calls[0]!
    expect(url).toBe(
      `https://www.googleapis.com/drive/v3/files/${FILE_ID}?alt=media`,
    )
    expect(options.headers.Authorization).toBe(`Bearer ${TOKEN}`)
  })

  it('returns ArrayBuffer', async () => {
    const buffer = new ArrayBuffer(16)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => buffer,
    })

    const result = await downloadDriveFile(TOKEN, FILE_ID)

    expect(result).toBeInstanceOf(ArrayBuffer)
    expect(result.byteLength).toBe(16)
  })

  it('throws on error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    })

    await expect(downloadDriveFile(TOKEN, FILE_ID)).rejects.toThrow(/404/)
  })

  it('throws AuthExpiredError on 401', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    })

    await expect(downloadDriveFile(TOKEN, FILE_ID)).rejects.toBeInstanceOf(
      AuthExpiredError,
    )
  })

  it('throws on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'))

    await expect(downloadDriveFile(TOKEN, FILE_ID)).rejects.toThrow(
      'Connection refused',
    )
  })
})
