/**
 * Cloud Backup DB Statistics — displays local and cloud database tables
 * with their row counts, separated into two sections.
 */

import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useDbStats } from '@/hooks/use-db-stats'

// ── Component ───────────────────────────────────────────────────────────────

export function CloudBackupDbStats() {
  const { t } = useTranslation()
  const { tables, totalRows } = useDbStats()

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
                    <td className="px-2 py-1 text-right">{table.rowCount}</td>
                  </tr>
                ))}
                {/* Total row */}
                <tr className="border-t-2">
                  <td className="px-2 py-1">{t('backup.totalRows')}</td>
                  <td className="px-2 py-1 text-right">{totalRows}</td>
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
                <tr>
                  <td
                    colSpan={2}
                    className="px-2 py-4 text-center text-muted-foreground"
                  >
                    {t('backup.cloudStatsUnavailable')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
