/**
 * Shared backup orchestrator — used by both manual and auto backup.
 * Exports DB → compresses → uploads to R2 → logs result.
 *
 * R2 cleanup (max 30 backups) is handled server-side in the PUT handler
 * at api/backup/[filename].ts, not here.
 */

import {
  getDatabase,
  getBackupLogRepo,
  getErrorLogRepo,
} from '@/lib/repositories/provider'
import { createBackupService, generateBackupFilename } from '@/lib/backup'

// ── Types ──────────────────────────────────────────────────────────────────

export interface BackupResult {
  readonly filename: string
  readonly size: number
  readonly durationMs: number
}

export type BackupTriggerType = 'manual' | 'auto'

// ── Implementation ─────────────────────────────────────────────────────────

export async function performBackup(
  triggerType: BackupTriggerType,
): Promise<BackupResult> {
  const startTime = Date.now()

  try {
    const db = getDatabase()
    const backupService = createBackupService()

    // 1. Export raw DB bytes from Web Worker
    const rawBytes = await db.exportDatabase()

    // 2. Compress via gzip
    const compressed = await backupService.exportDatabase(rawBytes)

    // 3. Generate timestamped filename
    const filename = generateBackupFilename()

    // 4. Upload to R2 (server-side cleanup of old backups happens here)
    const metadata = await backupService.upload(compressed, filename)

    const durationMs = Date.now() - startTime

    // 5. Log success
    await getBackupLogRepo().create(triggerType, 'success', {
      filename: metadata.filename,
      size: metadata.size,
      durationMs,
    })

    return {
      filename: metadata.filename,
      size: metadata.size,
      durationMs,
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown backup error'

    // Log failure to backup_logs and error_logs
    await getBackupLogRepo().create(triggerType, 'failed', {
      errorMessage: message,
    })
    await getErrorLogRepo().create(
      message,
      'perform-backup',
      error instanceof Error ? error.stack : undefined,
    )

    throw error
  }
}
