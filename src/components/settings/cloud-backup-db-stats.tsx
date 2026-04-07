/**
 * Cloud Backup DB Statistics — displays local database table stats (left)
 * and cloud backup summary + actions (right).
 */

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { DatabaseBackup, Download } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { RippleButton } from '@/components/ui/ripple-button'
import { notify } from '@/components/ui/sonner'
import { useDbStats } from '@/hooks/use-db-stats'
import { useCloudBackups } from '@/hooks/use-cloud-backups'
import { useBackupStore, type ScheduleType } from '@/stores/backup-store'
import { performBackup } from '@/lib/perform-backup'
import { generateExportFilename } from '@/lib/backup'
import { getDatabase } from '@/lib/repositories/provider'
import { formatBytes } from '@/lib/format-bytes'

// ── Constants ──────────────────────────────────────────────────────────────

const MAX_BACKUP_COUNT = 30

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

  // Backup store state
  const isBackingUp = useBackupStore(s => s.isBackingUp)
  const scheduleType = useBackupStore(s => s.scheduleType)
  const setSchedule = useBackupStore(s => s.setSchedule)
  const startBackup = useBackupStore(s => s.startBackup)
  const finishBackup = useBackupStore(s => s.finishBackup)
  const setLastBackupTime = useBackupStore(s => s.setLastBackupTime)

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
      finishBackup(message)
      notify.error(t('backup.backupFailed'))
    }
  }, [startBackup, finishBackup, setLastBackupTime, t])

  const handleExportDb = useCallback(async () => {
    try {
      const rawBytes = await getDatabase().exportDatabase()
      const blob = new Blob([rawBytes as BlobPart], { type: 'application/x-sqlite3' })
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
      notify.error(`${t('backup.exportFailed')}: ${message}`)
    }
  }, [t])

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
                {tables.map(table => (
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
                      {formatBytes(totalSize)}
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
                </tbody>
              </table>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Schedule type selector — pinned to bottom with buttons */}
          <div className="mt-4">
            <p className="mb-2 text-muted-foreground">{t('backup.schedule')}</p>
            <div className="flex gap-2">
              {SCHEDULE_OPTIONS.map(option => (
                <RippleButton
                  key={option.type}
                  data-active={scheduleType === option.type ? 'true' : undefined}
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

          {/* Action buttons at bottom */}
          <div className="mt-3 flex gap-3">
            <RippleButton
              className="flex flex-1 items-center justify-center gap-2 rounded-md border-none bg-(--color-green) px-4 py-2 text-white hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => void handleBackupNow()}
              disabled={isBackingUp}
            >
              <DatabaseBackup size={16} />
              {isBackingUp ? t('backup.backingUp') : t('backup.backupNow')}
            </RippleButton>
            <RippleButton
              className="flex flex-1 items-center justify-center gap-2 rounded-md border-none bg-(--color-blue) px-4 py-2 text-white hover:opacity-80"
              onClick={() => void handleExportDb()}
            >
              <Download size={16} />
              {t('settings.exportDb')}
            </RippleButton>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
