/**
 * Cloud Backup History — displays backup log records with pagination.
 */

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearch, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { RippleButton } from '@/components/ui/ripple-button'
import { PaginationControls } from '@/components/settings/pagination-controls'
import { notify } from '@/components/ui/sonner'
import { getBackupLogRepo } from '@/lib/repositories/provider'
import type { BackupLogType, BackupLogStatus } from '@/lib/schemas'

// ── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(1)} ${units[i]}`
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function getTypeLabel(type: BackupLogType, t: (key: string) => string): string {
  const map: Record<BackupLogType, string> = {
    manual: t('backup.typeManual'),
    auto: t('backup.typeAuto'),
    'v1-import': t('backup.typeV1Import'),
  }
  return map[type]
}

function getStatusLabel(
  status: BackupLogStatus,
  t: (key: string) => string,
): string {
  const map: Record<BackupLogStatus, string> = {
    success: t('backup.statusSuccess'),
    failed: t('backup.statusFailed'),
  }
  return map[status]
}

// ── Component ───────────────────────────────────────────────────────────────

export function CloudBackupHistory() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  // Pagination via route search params
  const search = useSearch({ from: '/settings/cloud-backup' })
  const navigate = useNavigate({ from: '/settings/cloud-backup' })
  const backupPage = search.backupPage ?? 1

  const setBackupPage = useCallback(
    (page: number) => {
      navigate({ search: { backupPage: page }, replace: true })
    },
    [navigate],
  )

  const { data: backupLogs = [] } = useQuery({
    queryKey: ['backup-logs', backupPage],
    queryFn: () => getBackupLogRepo().findPaginated(backupPage, PAGE_SIZE),
  })

  const { data: backupLogCount = 0 } = useQuery({
    queryKey: ['backup-logs-count'],
    queryFn: () => getBackupLogRepo().count(),
  })

  const clearBackupLogsMutation = useMutation({
    mutationFn: () => getBackupLogRepo().clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup-logs'] })
      queryClient.invalidateQueries({ queryKey: ['backup-logs-count'] })
      setBackupPage(1)
      notify.success(t('settings.logsCleared'))
    },
  })

  const backupTotalPages = Math.max(1, Math.ceil(backupLogCount / PAGE_SIZE))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('backup.history')}</CardTitle>
          <RippleButton
            className="flex items-center gap-2 rounded-md border-none bg-(--color-red) px-3 py-1 text-white hover:opacity-80"
            onClick={() => clearBackupLogsMutation.mutate()}
          >
            <Trash2 size={14} />
            {t('backup.clearHistory')}
          </RippleButton>
        </div>
      </CardHeader>
      <CardContent>
        {backupLogs.length === 0 ? (
          <p className="text-muted-foreground">{t('backup.noBackupHistory')}</p>
        ) : (
          <div className="space-y-4">
            <div className="overflow-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="px-2 py-1">{t('backup.historyTime')}</th>
                    <th className="px-2 py-1">{t('backup.historyType')}</th>
                    <th className="px-2 py-1">{t('backup.historyStatus')}</th>
                    <th className="px-2 py-1">{t('backup.historyFilename')}</th>
                    <th className="px-2 py-1 text-right">
                      {t('backup.historySize')}
                    </th>
                    <th className="px-2 py-1 text-right">
                      {t('backup.historyDuration')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {backupLogs.map(log => (
                    <tr key={log.id} className="border-b">
                      <td className="px-2 py-1 whitespace-nowrap">
                        {dayjs(log.createdAt).format('YYYY/MM/DD HH:mm:ss')}
                      </td>
                      <td className="px-2 py-1">{getTypeLabel(log.type, t)}</td>
                      <td className="px-2 py-1">
                        {getStatusLabel(log.status, t)}
                      </td>
                      <td className="px-2 py-1">{log.filename ?? '-'}</td>
                      <td className="px-2 py-1 text-right">
                        {formatSize(log.size)}
                      </td>
                      <td className="px-2 py-1 text-right">
                        {formatDuration(log.durationMs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls
              currentPage={backupPage}
              totalPages={backupTotalPages}
              onPageChange={setBackupPage}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
