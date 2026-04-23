/**
 * Cloud Backup History — displays backup files from R2 with import action.
 * Data comes directly from the cloud backup list, not local backup_logs.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { RippleButton } from '@/components/ui/ripple-button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmModal } from '@/components/modal/modal'
import { notify } from '@/components/ui/sonner'
import { InitOverlay } from '@/components/init-ui'
import { useCloudBackups } from '@/hooks/use-cloud-backups'
import { useBackupStore } from '@/stores/backup-store'
import { createBackupService, decompress } from '@/lib/backup'
import { getDatabase } from '@/lib/repositories/provider'
import { bufferLog, flushLogBuffer } from '@/lib/log-buffer'
import { tutorialAnchor } from '@/lib/tutorial/tutorial-anchor'

// ── Constants ───────────────────────────────────────────────────────────────

// Minimum time (ms) to show the overlay so the animation plays.
// Skipped in test environment to avoid flaky timing issues.
const MIN_OVERLAY_MS = import.meta.env.VITEST ? 0 : 5000

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(1)} ${units[i]}`
}

// ── Skeleton ────────────────────────────────────────────────────────────────

const SKELETON_ROW_COUNT = 3

/**
 * Placeholder rendered while the R2 list is fetching. Matches the live
 * table's 4-column layout so the surrounding Card doesn't jump when the
 * real data arrives.
 */
function HistorySkeleton() {
  return (
    <div className="overflow-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="px-2 py-1 w-110">
              <Skeleton className="h-4 w-20" />
            </th>
            <th className="px-2 py-1">
              <Skeleton className="h-4 w-12" />
            </th>
            <th className="px-2 py-1">
              <Skeleton className="h-4 w-16" />
            </th>
            <th className="px-2 py-1 w-20">
              <Skeleton className="h-4 w-12" />
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
            <tr key={index} className="border-b">
              <td className="px-2 py-2">
                <Skeleton className="h-4 w-full" />
              </td>
              <td className="px-2 py-2">
                <Skeleton className="h-4 w-16" />
              </td>
              <td className="px-2 py-2">
                <Skeleton className="h-4 w-40" />
              </td>
              <td className="px-2 py-2">
                <Skeleton className="h-8 w-20" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Component ───────────────────────────────────────────────────────────────

export function CloudBackupHistory() {
  const { t } = useTranslation()
  const { backups, isLoading, isFetching } = useCloudBackups()
  const isBackingUp = useBackupStore(s => s.isBackingUp)
  // Show the skeleton on initial load, background refetches, and while a
  // manual backup is in flight — "立即備份" should flip the skeleton on
  // immediately rather than waiting for the post-backup refetch.
  const showSkeleton = isLoading || isFetching || isBackingUp

  // Import confirmation modal state
  const [confirmFilename, setConfirmFilename] = useState<string | null>(null)
  // When non-null, the Init UI overlay is visible with this message.
  const [overlayMessage, setOverlayMessage] = useState<string | null>(null)

  const handleImportClick = useCallback((filename: string) => {
    setConfirmFilename(filename)
  }, [])

  const handleImportCancel = useCallback(() => {
    setConfirmFilename(null)
  }, [])

  const handleImportConfirm = useCallback(async () => {
    if (!confirmFilename) return
    const filename = confirmFilename
    setConfirmFilename(null)
    setOverlayMessage(t('backup.importingCloudDb'))

    // Ensure overlay is visible for at least MIN_OVERLAY_MS so the animation plays
    const minDelay = new Promise(resolve => setTimeout(resolve, MIN_OVERLAY_MS))

    try {
      const work = (async () => {
        const compressedData = await createBackupService().download(filename)
        const rawBytes = await decompress(compressedData)
        await getDatabase().importDatabase(rawBytes.buffer as ArrayBuffer)
      })()
      await Promise.all([work, minDelay])
      // Import succeeded — the new DB is now active and writable, so any
      // errors buffered earlier in this session can be safely flushed.
      // A flush failure must never block the reload; swallow and let the
      // next session retry from the in-memory buffer.
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
      // Buffer first so the message is preserved even if the DB was
      // mid-swap and no longer writable. The worker's rollback path
      // should have reopened the old DB by the time we get here, which
      // allows flushLogBuffer() to land in error_logs.
      bufferLog(
        `Cloud backup import failed: ${message}`,
        'cloud-backup-import',
        stack,
      )
      try {
        await flushLogBuffer()
      } catch {
        // Swallow — the entry is still buffered and will retry later.
      }
      notify.error(`${t('backup.importError')}: ${message}`)
    }
  }, [confirmFilename, t])

  return (
    <>
      <Card {...tutorialAnchor('settings.cloudBackup.history')}>
        <CardHeader>
          <CardTitle>{t('backup.history')}</CardTitle>
        </CardHeader>
        <CardContent>
          {showSkeleton ? (
            <HistorySkeleton />
          ) : backups.length === 0 ? (
            <p className="text-muted-foreground">
              {t('backup.noBackupHistory')}
            </p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="px-2 py-1 w-110">
                      {t('backup.historyFilename')}
                    </th>
                    <th className="px-2 py-1">{t('backup.historySize')}</th>
                    <th className="px-2 py-1">{t('backup.historyTime')}</th>
                    <th className="px-2 py-1 w-20">{t('staff.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map(backup => (
                    <tr key={backup.filename} className="border-b">
                      <td className="px-2 py-1 break-all">{backup.filename}</td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        {formatSize(backup.size)}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        {dayjs(backup.createdAt).format('YYYY/MM/DD HH:mm:ss')}
                      </td>
                      <td className="px-2 py-1">
                        <RippleButton
                          className="rounded-md border-none bg-(--color-purple) px-3 py-1 text-white hover:opacity-80"
                          onClick={() => handleImportClick(backup.filename)}
                        >
                          {t('backup.importBackup')}
                        </RippleButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import confirmation modal */}
      <ConfirmModal
        open={confirmFilename !== null}
        title={t('backup.importConfirmTitle')}
        variant="warm"
        onConfirm={() => void handleImportConfirm()}
        onCancel={handleImportCancel}
      >
        <p className="text-center">{t('backup.importConfirmDescription')}</p>
      </ConfirmModal>

      {/* Init UI overlay during import — the Event Horizon shader animation
          reassures the user the app is busy. MIN_OVERLAY_MS enforces ≥5s
          display via the Promise.all([work, minDelay]) above. */}
      {overlayMessage && <InitOverlay message={overlayMessage} />}
    </>
  )
}
