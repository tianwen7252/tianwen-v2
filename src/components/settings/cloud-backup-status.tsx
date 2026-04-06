/**
 * Cloud Backup Status KPI cards — displays cloud DB size,
 * last backup time, and auto-backup schedule.
 */

import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useBackupStore } from '@/stores/backup-store'
import type { ScheduleType } from '@/stores/backup-store'
import { useCloudBackups } from '@/hooks/use-cloud-backups'
import { formatBytes } from '@/lib/format-bytes'

// ── Component ───────────────────────────────────────────────────────────────

export function CloudBackupStatus() {
  const { t } = useTranslation()
  const lastBackupTime = useBackupStore(s => s.lastBackupTime)
  const scheduleType = useBackupStore(s => s.scheduleType) as ScheduleType
  const scheduleHour = useBackupStore(s => s.scheduleHour)
  const { totalSize, isLoading, error } = useCloudBackups()

  const cloudSizeDisplay = error
    ? '—'
    : isLoading
      ? '...'
      : formatBytes(totalSize)

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Card 1: Cloud DB Size */}
      <Card shadow className="py-4">
        <CardHeader className="py-0">
          <CardTitle fontSize="text-md" className="text-muted-foreground">
            {t('backup.cloudSize')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1">
          <div className="text-2xl">{cloudSizeDisplay}</div>
        </CardContent>
      </Card>

      {/* Card 2: Last Backup */}
      <Card shadow className="py-4">
        <CardHeader className="py-0">
          <CardTitle fontSize="text-md" className="text-muted-foreground">
            {t('backup.lastBackup')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1">
          <div className="text-2xl">
            {lastBackupTime
              ? dayjs(lastBackupTime).format('YYYY-MM-DD HH:mm')
              : t('backup.noRecord')}
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Auto Schedule */}
      <Card shadow className="py-4">
        <CardHeader className="py-0">
          <CardTitle fontSize="text-md" className="text-muted-foreground">
            {t('backup.schedule')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1">
          <div className="text-2xl">
            {formatSchedule(t, scheduleType, scheduleHour)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatSchedule(
  t: (key: string, options?: Record<string, unknown>) => string,
  scheduleType: ScheduleType,
  scheduleHour: number,
): string {
  switch (scheduleType) {
    case 'daily':
      return t('backup.dailyAt', { hour: scheduleHour })
    case 'weekly':
      return t('backup.weeklyAt', { hour: scheduleHour })
    case 'none':
      return t('backup.scheduleNone')
  }
}
