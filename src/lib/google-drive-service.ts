/**
 * Google Drive service — list and download backup files via Drive API v3 REST.
 * Searches for a folder named "backup" then lists files within it.
 */

import { AuthExpiredError } from './errors'

// ── Types ───────────────────────────────────────────────────────────────────

export interface DriveFile {
  readonly id: string
  readonly name: string
  readonly size: number
  readonly createdTime: string
  readonly mimeType: string
}

interface DriveListResponse {
  readonly files?: readonly DriveFile[]
}

// ── Constants ───────────────────────────────────────────────────────────────

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files'
const FOLDER_MIME = 'application/vnd.google-apps.folder'
const BACKUP_FOLDER_NAME = 'backup'

// ── Token refresh callback ─────────────────────────────────────────────────

/** Callback to silently refresh the Google access token. Set by the consumer. */
export type TokenRefreshFn = () => Promise<string | null>

/**
 * Wrapper that calls a Drive API function, and on 401 (AuthExpiredError)
 * automatically refreshes the token and retries once.
 */
export async function withTokenRefresh<T>(
  fn: (token: string) => Promise<T>,
  token: string,
  refreshFn: TokenRefreshFn | null,
): Promise<T> {
  try {
    return await fn(token)
  } catch (err) {
    if (err instanceof AuthExpiredError && refreshFn) {
      const newToken = await refreshFn()
      if (newToken) {
        return await fn(newToken)
      }
    }
    throw err
  }
}

// ── Internal helpers ────────────────────────────────────────────────────────

/**
 * Find the "backup" folder in the user's Drive.
 * Returns the folder ID or null if not found.
 */
async function findBackupFolder(accessToken: string): Promise<string | null> {
  const query = `name = '${BACKUP_FOLDER_NAME}' and mimeType = '${FOLDER_MIME}' and trashed = false`
  const params = new URLSearchParams({
    q: query,
    fields: 'files(id,name)',
    pageSize: '1',
  })

  const url = `${DRIVE_API_BASE}?${params.toString()}`

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new AuthExpiredError()
    }
    throw new Error(
      `Google Drive API error: ${response.status} ${response.statusText}`,
    )
  }

  const data = (await response.json()) as DriveListResponse
  const folder = data.files?.[0]
  return folder ? folder.id : null
}

// ── Service functions ───────────────────────────────────────────────────────

/**
 * List backup files from the user's Google Drive "backup" folder.
 * Returns files sorted newest-first.
 */
export async function listDriveBackupFiles(
  accessToken: string,
): Promise<readonly DriveFile[]> {
  const folderId = await findBackupFolder(accessToken)

  if (!folderId) {
    return []
  }

  const query = `'${folderId}' in parents and trashed = false`
  const params = new URLSearchParams({
    q: query,
    fields: 'files(id,name,size,createdTime,mimeType)',
    orderBy: 'createdTime desc',
    pageSize: '50',
  })

  const url = `${DRIVE_API_BASE}?${params.toString()}`

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new AuthExpiredError()
    }
    throw new Error(
      `Google Drive API error: ${response.status} ${response.statusText}`,
    )
  }

  const data = (await response.json()) as DriveListResponse
  return data.files ?? []
}

/**
 * Download a file from Google Drive by file ID.
 * Returns the raw file content as an ArrayBuffer.
 */
export async function downloadDriveFile(
  accessToken: string,
  fileId: string,
): Promise<ArrayBuffer> {
  const url = `${DRIVE_API_BASE}/${fileId}?alt=media`

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new AuthExpiredError()
    }
    throw new Error(
      `Google Drive download error: ${response.status} ${response.statusText}`,
    )
  }

  return response.arrayBuffer()
}
