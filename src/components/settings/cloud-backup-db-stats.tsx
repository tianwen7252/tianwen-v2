/**
 * Cloud Backup DB Statistics — displays local database table stats
 * and cloud backup summary (count, total size, latest backup).
 */

import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useDbStats } from '@/hooks/use-db-stats'
import { useCloudBackups } from '@/hooks/use-cloud-backups'
import { formatBytes } from '@/lib/format-bytes'

// ── Component ───────────────────────────────────────────────────────────────

export function CloudBackupDbStats() {
  const { t } = useTranslation()
  const { tables, totalRows } = useDbStats()
  const { backupCount, totalSize, latestBackup, isLoading, error } =
    useCloudBackups()

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

      {/* Cloud DB Stats */}
      <Card>
        <CardHeader>
          <CardTitle>{t('backup.cloudDbStats')}</CardTitle>
        </CardHeader>
        <CardContent>
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
                    <td className="px-2 py-1 text-muted-foreground">
                      {t('backup.backupCount')}
                    </td>
                    <td className="px-2 py-1 text-right">{backupCount}</td>
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
        </CardContent>
      </Card>
    </div>
  )
}
