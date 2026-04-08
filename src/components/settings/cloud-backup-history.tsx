/**
 * Cloud Backup History — displays backup files from R2.
 * Data comes directly from the cloud backup list, not local backup_logs.
 */

import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useCloudBackups } from '@/hooks/use-cloud-backups'

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

  return (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
