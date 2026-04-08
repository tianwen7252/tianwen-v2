/**
 * Cloud Backup History — displays backup files from R2 with import action.
 * Data comes directly from the cloud backup list, not local backup_logs.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { LoaderCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { RippleButton } from '@/components/ui/ripple-button'
import { ConfirmModal } from '@/components/modal/modal'
import { notify } from '@/components/ui/sonner'
import { useCloudBackups } from '@/hooks/use-cloud-backups'
import { createBackupService, decompress } from '@/lib/backup'
import { getDatabase } from '@/lib/repositories/provider'

// ── Constants ───────────────────────────────────────────────────────────────

// Minimum time (ms) to show the overlay so the animation plays
export const MIN_OVERLAY_MS = 5000

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(1)} ${units[i]}`
}

/**
 * Parse the device name from a backup filename.
 * Format: tianwen-{deviceName}-YYYY-MM-DD_HH-mm-ss.sqlite.gz
 * Falls back to the full filename if parsing fails.
 */
function parseDeviceName(filename: string): string {
  // Remove tianwen- prefix and -YYYY-MM-DD_HH-mm-ss.sqlite.gz suffix
  const match = filename.match(/^tianwen-(.+)-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.sqlite\.gz$/)
  if (match?.[1]) return match[1]

  // Legacy format: backup-YYYY-MM-DD_HH-mm-ss.sqlite.gz
  if (filename.startsWith('backup-')) return '—'

  return filename
}

// ── Component ───────────────────────────────────────────────────────────────

export function CloudBackupHistory() {
  const { t } = useTranslation()
  const { backups, isLoading } = useCloudBackups()

  // Import confirmation modal state
  const [confirmFilename, setConfirmFilename] = useState<string | null>(null)
  // Full-screen blocking overlay message
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
    setOverlayMessage(t('backup.importingDatabase'))

    // Ensure overlay is visible for at least MIN_OVERLAY_MS so the animation plays
    const minDelay = new Promise(resolve => setTimeout(resolve, MIN_OVERLAY_MS))

    try {
      const work = (async () => {
        const compressedData = await createBackupService().download(filename)
        const rawBytes = await decompress(compressedData)
        await getDatabase().importDatabase(rawBytes.buffer as ArrayBuffer)
      })()
      await Promise.all([work, minDelay])
      window.location.reload()
    } catch (err: unknown) {
      setOverlayMessage(null)
      const message = err instanceof Error ? err.message : String(err)
      notify.error(`${t('backup.importError')}: ${message}`)
    }
  }, [confirmFilename, t])

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('backup.history')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">...</p>
          ) : backups.length === 0 ? (
            <p className="text-muted-foreground">{t('backup.noBackupHistory')}</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="px-2 py-1">{t('backup.historyFilename')}</th>
                    <th className="px-2 py-1">{t('backup.historyTime')}</th>
                    <th className="px-2 py-1">{t('backup.historySource')}</th>
                    <th className="px-2 py-1 text-right">{t('backup.historySize')}</th>
                    <th className="px-2 py-1 text-center">{t('staff.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map(backup => (
                    <tr key={backup.filename} className="border-b">
                      <td className="px-2 py-1 break-all">{backup.filename}</td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        {dayjs(backup.createdAt).format('YYYY/MM/DD HH:mm:ss')}
                      </td>
                      <td className="px-2 py-1">{parseDeviceName(backup.filename)}</td>
                      <td className="px-2 py-1 text-right whitespace-nowrap">
                        {formatSize(backup.size)}
                      </td>
                      <td className="px-2 py-1 text-center">
                        <RippleButton
                          className="rounded-md border-none bg-(--color-blue) px-3 py-1 text-white hover:opacity-80"
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
        variant="blue"
        onConfirm={() => void handleImportConfirm()}
        onCancel={handleImportCancel}
      >
        <p className="text-center">{t('backup.importConfirmDescription')}</p>
      </ConfirmModal>

      {/* Full-screen blocking overlay during import */}
      {overlayMessage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <LoaderCircle className="size-10 animate-spin text-primary" />
            <p className="text-lg">{overlayMessage}</p>
          </div>
        </div>
      )}
    </>
  )
}
