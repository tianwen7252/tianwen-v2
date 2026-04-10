/**
 * Cloud Backup DB Statistics — displays local database table stats (left)
 * and cloud backup summary + actions (right).
 */

import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { RippleButton } from '@/components/ui/ripple-button'
import { ConfirmModal } from '@/components/modal/modal'
import { notify } from '@/components/ui/sonner'
import { InitOverlay } from '@/components/init-ui'
import { useDbStats } from '@/hooks/use-db-stats'
import { useCloudBackups } from '@/hooks/use-cloud-backups'
import { useBackupStore, type ScheduleType } from '@/stores/backup-store'
import { performBackup } from '@/lib/perform-backup'
import { generateExportFilename } from '@/lib/backup'
import { getDatabase } from '@/lib/repositories/provider'
import { formatBytes } from '@/lib/format-bytes'
import { bufferLog, flushLogBuffer } from '@/lib/log-buffer'

// ── Constants ──────────────────────────────────────────────────────────────

const MAX_BACKUP_COUNT = 30
// Cloudflare R2 free tier storage limit
const R2_FREE_QUOTA_BYTES = 10 * 1024 * 1024 * 1024 // 10 GB
// Minimum time (ms) to show the overlay so the animation plays.
// Skipped in test environment to avoid flaky timing issues.
const MIN_RESTORE_OVERLAY_MS = import.meta.env.VITEST ? 0 : 5000

const SCHEDULE_OPTIONS: readonly {
  readonly type: ScheduleType
  readonly labelKey: string
}[] = [
  { type: 'daily', labelKey: 'backup.scheduleDaily' },
  { type: 'weekly', labelKey: 'backup.scheduleWeekly' },
  { type: 'none', labelKey: 'backup.scheduleNone' },
]

// ── Component ───────────────────────────────────────────────────────────────

export function CloudBackupDbStats() {
  const { t } = useTranslation()
  const { tables, totalRows } = useDbStats()
  const { backupCount, totalSize, latestBackup, isLoading, error } =
    useCloudBackups()

  // Restore state
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false)
  const [deletePrevConfirmOpen, setDeletePrevConfirmOpen] = useState(false)
  const [overlayMessage, setOverlayMessage] = useState<string | null>(null)

  const queryClient = useQueryClient()

  // Check if a previous DB snapshot exists
  const { data: hasPrev = false } = useQuery({
    queryKey: ['has-prev-db'],
    queryFn: () => getDatabase().hasPreviousDatabase(),
  })

  // Fetch the byte size of the previous DB snapshot (0 when none).
  // Kept separate from `has-prev-db` so the two mutations invalidate
  // independently.
  const { data: prevDbSize = 0 } = useQuery({
    queryKey: ['prev-db-size'],
    queryFn: () => getDatabase().getPreviousDatabaseSize(),
    enabled: hasPrev,
  })

  // Backup store state
  const isBackingUp = useBackupStore((s) => s.isBackingUp)
  const scheduleType = useBackupStore((s) => s.scheduleType)
  const setSchedule = useBackupStore((s) => s.setSchedule)
  const startBackup = useBackupStore((s) => s.startBackup)
  const finishBackup = useBackupStore((s) => s.finishBackup)
  const setLastBackupTime = useBackupStore((s) => s.setLastBackupTime)

  const handleBackupNow = useCallback(async () => {
    startBackup()
    try {
      await performBackup('manual')
      setLastBackupTime(new Date().toISOString())
      finishBackup()
      notify.success(t('backup.backupSuccess'))
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown backup error'
      const stack = error instanceof Error ? error.stack : undefined
      finishBackup(message)
      // Manual backup does not replace the DB, so we can log directly —
      // but going through the buffer keeps the pipeline consistent with
      // restore/import and guarantees a retry on transient DB errors.
      bufferLog(`Manual backup failed: ${message}`, 'manual-backup', stack)
      try {
        await flushLogBuffer()
      } catch {
        /* buffered for later */
      }
      notify.error(t('backup.backupFailed'))
    }
  }, [startBackup, finishBackup, setLastBackupTime, t])

  const handleExportDb = useCallback(async () => {
    try {
      const rawBytes = await getDatabase().exportDatabase()
      const blob = new Blob([rawBytes as BlobPart], {
        type: 'application/x-sqlite3',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = generateExportFilename()
      a.click()
      URL.revokeObjectURL(url)
      notify.success(t('backup.exportSuccess'))
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown export error'
      const stack = error instanceof Error ? error.stack : undefined
      bufferLog(`Local DB export failed: ${message}`, 'db-export', stack)
      try {
        await flushLogBuffer()
      } catch {
        /* buffered for later */
      }
      notify.error(`${t('backup.exportFailed')}: ${message}`)
    }
  }, [t])

  const handleRestoreConfirm = useCallback(async () => {
    setRestoreConfirmOpen(false)
    setOverlayMessage(t('backup.restoringPrevDb'))

    // Ensure overlay is visible for at least MIN_RESTORE_OVERLAY_MS so the animation plays
    const minDelay = new Promise((resolve) =>
      setTimeout(resolve, MIN_RESTORE_OVERLAY_MS),
    )

    try {
      await Promise.all([getDatabase().restorePreviousDatabase(), minDelay])
      // Previous DB is now active — flush any pre-existing buffered errors
      // into the restored DB so they persist across the reload. A flush
      // failure must never block the reload.
      try {
        await flushLogBuffer()
      } catch {
        /* ignore — retry on next flush */
      }
      window.location.reload()
    } catch (err: unknown) {
      setOverlayMessage(null)
      const message = err instanceof Error ? err.message : String(err)
      const stack = err instanceof Error ? err.stack : undefined
      bufferLog(
        `Restore previous database failed: ${message}`,
        'restore-prev-db',
        stack,
      )
      try {
        await flushLogBuffer()
      } catch {
        /* buffered for later */
      }
      notify.error(`${t('backup.restoreError')}: ${message}`)
    }
  }, [t])

  const handleDeletePrevConfirm = useCallback(async () => {
    setDeletePrevConfirmOpen(false)
    try {
      await getDatabase().deletePreviousDatabase()
      // Synchronously flip the cache so the restore button disables and
      // the size row hides in the same render. `invalidateQueries` would
      // schedule a refetch, leaving a brief window where the stale `true`
      // value still enables the button.
      queryClient.setQueryData(['has-prev-db'], false)
      queryClient.setQueryData(['prev-db-size'], 0)
      notify.success(t('backup.deletePrevSuccess'))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      const stack = err instanceof Error ? err.stack : undefined
      bufferLog(
        `Delete previous database failed: ${message}`,
        'delete-prev-db',
        stack,
      )
      try {
        await flushLogBuffer()
      } catch {
        /* buffered for later */
      }
      notify.error(`${t('backup.deletePrevError')}: ${message}`)
    }
  }, [queryClient, t])

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Local DB Stats */}
      <Card>
        <CardHeader>
          <CardTitle>{t('backup.localDbStats')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="px-2 py-1">{t('backup.tableName')}</th>
                  <th className="px-2 py-1 text-right">
                    {t('backup.rowCount')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {tables.map((table) => (
                  <tr key={table.tableName} className="border-b">
                    <td className="px-2 py-1">{table.tableName}</td>
                    <td className="px-2 py-1 text-right">
                      {table.rowCount.toLocaleString('zh-TW')}
                    </td>
                  </tr>
                ))}
                {/* Total row */}
                <tr className="border-t-2">
                  <td className="px-2 py-1">{t('backup.totalRows')}</td>
                  <td className="px-2 py-1 text-right">
                    {totalRows.toLocaleString('zh-TW')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Cloud DB Stats + Actions */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>{t('backup.cloudDbStats')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          {/* Cloud stats */}
          <div className="overflow-auto">
            {isLoading ? (
              <p className="px-2 py-4 text-center text-muted-foreground">...</p>
            ) : error ? (
              <p className="px-2 py-4 text-center text-muted-foreground">
                {t('backup.cloudStatsUnavailable')}
              </p>
            ) : backupCount === 0 ? (
              <p className="px-2 py-4 text-center text-muted-foreground">
                {t('backup.noBackups')}
              </p>
            ) : (
              <table className="w-full text-left">
                <tbody>
                  <tr className="border-b">
                    <td className="whitespace-nowrap px-2 py-1 text-muted-foreground">
                      {t('backup.backupCount')}
                    </td>
                    <td className="px-2 py-1 text-right">{backupCount}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="whitespace-nowrap px-2 py-1 text-muted-foreground">
                      {t('backup.maxBackupCount')}
                    </td>
                    <td className="px-2 py-1 text-right">{MAX_BACKUP_COUNT}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-2 py-1 text-muted-foreground">
                      {t('backup.totalCloudSize')}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {formatBytes(totalSize)} /{' '}
                      {formatBytes(R2_FREE_QUOTA_BYTES)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-2 py-1 text-muted-foreground">
                      {t('backup.latestBackup')}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {latestBackup?.filename}
                    </td>
                  </tr>
                  {/* Previous DB snapshot size — only shown when a snapshot
                      exists. Clicking the trash icon purges it after
                      confirmation. */}
                  {hasPrev && (
                    <tr className="border-b">
                      <td className="px-2 py-1 text-muted-foreground">
                        {t('backup.prevDbSize')}
                      </td>
                      <td className="px-2 py-1">
                        <div className="flex items-center justify-end gap-2">
                          <span>{formatBytes(prevDbSize)}</span>
                          <RippleButton
                            onClick={() => setDeletePrevConfirmOpen(true)}
                            aria-label={t('backup.deletePrev')}
                            className="flex size-8 items-center justify-center rounded-md border-none bg-transparent text-(--color-red) hover:bg-(--color-red)/10"
                          >
                            <Trash2 size={18} />
                          </RippleButton>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Schedule type selector — pinned to bottom with buttons */}
          <div className="mt-4">
            <p className="mb-2 text-muted-foreground">
              {t('backup.schedule')}
              {import.meta.env.DEV && (
                <span className="ml-2 text-sm text-(--color-red)">
                  (DEV模式不啟用)
                </span>
              )}
            </p>
            <div className="flex gap-2">
              {SCHEDULE_OPTIONS.map((option) => (
                <RippleButton
                  key={option.type}
                  data-active={
                    scheduleType === option.type ? 'true' : undefined
                  }
                  className={`rounded-md px-4 py-2 ${
                    scheduleType === option.type
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                  onClick={() => setSchedule(option.type)}
                >
                  {t(option.labelKey)}
                </RippleButton>
              ))}
            </div>
          </div>

          {/* Divider */}
          <hr className="my-3 border-border" />

          {/* Action buttons at bottom */}
          <div className="flex gap-3">
            <RippleButton
              className="flex flex-1 items-center justify-center gap-2 rounded-md border-none bg-(--color-purple) px-4 py-2 text-white hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => void handleBackupNow()}
              disabled={isBackingUp}
            >
              {isBackingUp ? t('backup.backingUp') : t('backup.backupNow')}
            </RippleButton>
            <RippleButton
              className="flex flex-1 items-center justify-center gap-2 rounded-md border-none bg-(--color-blue) px-4 py-2 text-white hover:opacity-80"
              onClick={() => void handleExportDb()}
            >
              {t('settings.exportDb')}
            </RippleButton>
            {/* Restore previous database button — disabled appearance must
                visibly reflect `hasPrev === false` (no snapshot or just
                deleted). Match the backup-now button's disabled styling. */}
            <RippleButton
              disabled={!hasPrev}
              className="flex items-center justify-center gap-2 rounded-md border-none bg-(--color-gold) px-4 py-2 text-white hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:opacity-50"
              onClick={() => setRestoreConfirmOpen(true)}
            >
              {t('backup.restorePrev')}
            </RippleButton>
          </div>
        </CardContent>
      </Card>

      {/* Restore previous database confirmation modal */}
      <ConfirmModal
        open={restoreConfirmOpen}
        title={t('backup.restoreConfirmTitle')}
        variant="warm"
        onConfirm={() => void handleRestoreConfirm()}
        onCancel={() => setRestoreConfirmOpen(false)}
      >
        <p className="text-center">{t('backup.restoreConfirmDescription')}</p>
      </ConfirmModal>

      {/* Delete previous database confirmation modal */}
      <ConfirmModal
        open={deletePrevConfirmOpen}
        title={t('backup.deletePrevConfirmTitle')}
        variant="red"
        onConfirm={() => void handleDeletePrevConfirm()}
        onCancel={() => setDeletePrevConfirmOpen(false)}
      >
        <p className="text-center">
          {t('backup.deletePrevConfirmDescription')}
        </p>
      </ConfirmModal>

      {/* Init UI overlay during restore — matches the import flow UX.
          MIN_RESTORE_OVERLAY_MS enforces ≥5s display via the Promise.all
          inside handleRestoreConfirm above. */}
      {overlayMessage && <InitOverlay message={overlayMessage} />}
    </div>
  )
}
