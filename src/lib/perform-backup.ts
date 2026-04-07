/**
 * Shared backup orchestrator — used by both manual and auto backup.
 * Exports DB → compresses → uploads to R2 → logs result.
 */

import { getDatabase, getBackupLogRepo, getErrorLogRepo } from '@/lib/repositories/provider'
import {
  createBackupService,
  generateBackupFilename,
  type BackupService,
} from '@/lib/backup'

// ── Constants ──────────────────────────────────────────────────────────────

/** Maximum number of backups to keep in R2. Oldest are deleted after upload. */
const MAX_BACKUPS = 30

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

    // 4. Upload to R2
    const metadata = await backupService.upload(compressed, filename)

    const durationMs = Date.now() - startTime

    // 5. Log success
    await getBackupLogRepo().create(triggerType, 'success', {
      filename: metadata.filename,
      size: metadata.size,
      durationMs,
    })

    // 6. Clean up old backups (keep only MAX_BACKUPS newest)
    try {
      await cleanupOldBackups(backupService)
    } catch {
      // Cleanup failure is non-critical — don't fail the backup
    }

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

// ── Cleanup ────────────────────────────────────────────────────────────────

/**
 * Delete old backups from R2 if total count exceeds MAX_BACKUPS.
 * Keeps the newest MAX_BACKUPS files, deletes the rest.
 */
async function cleanupOldBackups(backupService: BackupService): Promise<void> {
  const backups = await backupService.listBackups()

  if (backups.length <= MAX_BACKUPS) {
    return
  }

  // listBackups returns newest-first; delete everything after MAX_BACKUPS
  const toDelete = backups.slice(MAX_BACKUPS)

  await Promise.all(
    toDelete.map(b => backupService.deleteBackup(b.filename)),
  )
}
