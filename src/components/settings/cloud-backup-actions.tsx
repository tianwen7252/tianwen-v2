/**
 * Cloud Backup Actions — provides manual backup trigger button,
 * export DB button, and schedule type selector.
 */

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { DatabaseBackup, Download } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { RippleButton } from '@/components/ui/ripple-button'
import { notify } from '@/components/ui/sonner'
import { useBackupStore, type ScheduleType } from '@/stores/backup-store'
import { performBackup } from '@/lib/perform-backup'
import { generateExportFilename } from '@/lib/backup'
import { getDatabase } from '@/lib/repositories/provider'
import { tutorialAnchor } from '@/lib/tutorial/tutorial-anchor'

// ── Constants ──────────────────────────────────────────────────────────────

const SCHEDULE_OPTIONS: readonly {
  readonly type: ScheduleType
  readonly labelKey: string
}[] = [
  { type: 'daily', labelKey: 'backup.scheduleDaily' },
  { type: 'weekly', labelKey: 'backup.scheduleWeekly' },
  { type: 'none', labelKey: 'backup.scheduleNone' },
]

// ── Component ──────────────────────────────────────────────────────────────

export function CloudBackupActions() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
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
      // Force-refresh every consumer of the cloud-backup list (Status,
      // DbStats, History) so the newly created file appears immediately.
      // We use refetchQueries (not just invalidateQueries) so the request
      // always fires regardless of whether the query is currently "fresh"
      // under its staleTime, and we pass refetchType: 'all' so an inactive
      // query (e.g. after a route transition) also refreshes. We also wait
      // one tick for R2 list-objects to see the just-completed PUT.
      await new Promise(resolve => setTimeout(resolve, 300))
      await queryClient.refetchQueries({
        queryKey: ['cloud-backups'],
        type: 'all',
      })
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown backup error'
      finishBackup(message)
      notify.error(t('backup.backupFailed'))
    }
  }, [startBackup, finishBackup, setLastBackupTime, queryClient, t])

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
      notify.error(`${t('backup.exportFailed')}: ${message}`)
    }
  }, [t])

  const handleScheduleTypeChange = useCallback(
    (type: ScheduleType) => {
      setSchedule(type)
    },
    [setSchedule],
  )

  return (
    <Card {...tutorialAnchor('settings.cloudBackup.actions')}>
      <CardHeader>
        <CardTitle>{t('backup.backupActions')}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-4">
          <RippleButton
            className="flex items-center justify-center gap-2 rounded-md border-none bg-(--color-green) px-4 py-2 text-white hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => void handleBackupNow()}
            disabled={isBackingUp}
          >
            <DatabaseBackup size={16} />
            {isBackingUp ? t('backup.backingUp') : t('backup.backupNow')}
          </RippleButton>
          <RippleButton
            className="flex items-center justify-center gap-2 rounded-md border-none bg-(--color-blue) px-4 py-2 text-white hover:opacity-80"
            onClick={() => void handleExportDb()}
          >
            <Download size={16} />
            {t('settings.exportDb')}
          </RippleButton>
        </div>

        {/* Schedule type selector */}
        <div className="mt-6">
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
                onClick={() => handleScheduleTypeChange(option.type)}
              >
                {t(option.labelKey)}
              </RippleButton>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
