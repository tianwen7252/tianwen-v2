/**
 * System Info component — displays app version, storage, backup status,
 * system details, quick actions, backup history, and error logs.
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearch, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { AnimatedCircularProgressBar } from '@/components/ui/animated-circular-progress-bar'
import { Trash2, Eraser, RefreshCw, Pencil } from 'lucide-react'
import { RippleButton } from '@/components/ui/ripple-button'
import { notify } from '@/components/ui/sonner'
import { ConfirmModal } from '@/components/modal/modal'
import { PaginationControls } from '@/components/settings/pagination-controls'
import { useGoogleAuth } from '@/hooks/use-google-auth'
import { getErrorLogRepo } from '@/lib/repositories/provider'
import { SCHEMA_VERSION } from '@/lib/schema'
import { useAppVersion } from '@/lib/version'
import { formatBytes } from '@/lib/format-bytes'
import { useCloudBackups } from '@/hooks/use-cloud-backups'
import {
  getDeviceId,
  getDeviceName,
  getDeviceType,
  setDeviceName,
} from '@/lib/device'

// ─── Constants ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 20
// Cloudflare R2 free tier storage limit
const R2_FREE_QUOTA_BYTES = 10 * 1024 * 1024 * 1024 // 10 GB

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Check if the app is running in standalone (PWA installed) mode */
function isPwaMode(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches
}

/** Get the environment label */
function getEnvironment(): string {
  return import.meta.env.MODE === 'production' ? 'PROD' : 'DEV'
}

// ─── Storage Hook ────────────────────────────────────────────────────────────

interface StorageEstimate {
  readonly percent: number
  readonly usageBytes: number
  readonly quotaBytes: number
}

function useStorageEstimate(): StorageEstimate {
  const [state, setState] = useState<StorageEstimate>({
    percent: 0,
    usageBytes: 0,
    quotaBytes: 0,
  })

  useEffect(() => {
    async function estimate() {
      try {
        const est = await navigator.storage.estimate()
        const usage = est.usage ?? 0
        const quota = est.quota ?? 0
        if (quota === 0) {
          setState({ percent: 0, usageBytes: 0, quotaBytes: 0 })
          return
        }
        setState({
          percent: Math.round((usage / quota) * 100),
          usageBytes: usage,
          quotaBytes: quota,
        })
      } catch {
        setState({ percent: 0, usageBytes: 0, quotaBytes: 0 })
      }
    }
    estimate()
  }, [])

  return state
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SystemInfo() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { percent: storagePercent, usageBytes, quotaBytes } = useStorageEstimate()
  const appVersion = useAppVersion()

  const { googleUser, isAdmin } = useGoogleAuth()
  const { totalSize: cloudUsageBytes, isLoading: cloudLoading } = useCloudBackups()
  const cloudPercent = cloudLoading ? 0 : Math.min(100, Math.round((cloudUsageBytes / R2_FREE_QUOTA_BYTES) * 100))

  // ── Device Name State ─────────────────────────────────────────────────
  const [deviceDisplayName, setDeviceDisplayName] = useState<string | null>(
    () => getDeviceName(),
  )
  const [editDeviceNameOpen, setEditDeviceNameOpen] = useState(false)
  const [deviceNameInput, setDeviceNameInput] = useState('')
  const [deviceNameLoading, setDeviceNameLoading] = useState(false)

  // ── Pagination via route search params ────────────────────────────────
  const search = useSearch({ from: '/settings/system-info' })
  const navigate = useNavigate({ from: '/settings/system-info' })
  const errorPage = search.errorPage ?? 1

  const setErrorPage = useCallback(
    (page: number) => {
      navigate({ search: { errorPage: page }, replace: true })
    },
    [navigate],
  )

  // ── Error Logs Query ──────────────────────────────────────────────────

  const { data: logs = [] } = useQuery({
    queryKey: ['error-logs', errorPage],
    queryFn: () => getErrorLogRepo().findPaginated(errorPage, PAGE_SIZE),
  })

  const { data: errorLogCount = 0 } = useQuery({
    queryKey: ['error-logs-count'],
    queryFn: () => getErrorLogRepo().count(),
  })

  const clearLogsMutation = useMutation({
    mutationFn: () => getErrorLogRepo().clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['error-logs'] })
      queryClient.invalidateQueries({ queryKey: ['error-logs-count'] })
      setErrorPage(1)
      notify.success(t('settings.logsCleared'))
    },
  })

  // ── Device Name Handlers ──────────────────────────────────────────────

  const handleOpenEditDeviceName = useCallback(() => {
    setDeviceNameInput(deviceDisplayName ?? '')
    setEditDeviceNameOpen(true)
  }, [deviceDisplayName])

  const handleConfirmDeviceName = useCallback(async () => {
    const trimmedName = deviceNameInput.trim()
    if (!trimmedName) return

    setDeviceNameLoading(true)
    try {
      const response = await fetch('/api/device', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: getDeviceId(),
          name: trimmedName,
          type: getDeviceType(),
          mode: import.meta.env.DEV ? 'development' : 'production',
        }),
      })

      if (response.status === 409) {
        notify.error(t('settings.deviceNameDuplicate'))
        return
      }

      if (!response.ok) {
        throw new Error(`PUT /api/device failed: ${response.status}`)
      }

      setDeviceName(trimmedName)
      setDeviceDisplayName(trimmedName)
      setEditDeviceNameOpen(false)
      notify.success(t('settings.deviceNameUpdated'))
    } catch {
      notify.error(t('settings.deviceNameDuplicate'))
    } finally {
      setDeviceNameLoading(false)
    }
  }, [deviceNameInput, t])

  // ── Quick Action Handlers ─────────────────────────────────────────────

  const handleClearCache = useCallback(async () => {
    try {
      const keys = await caches.keys()
      await Promise.all(keys.map(k => caches.delete(k)))
      notify.success(t('settings.cacheCleared'))
    } catch {
      // Caches API not available
    }
  }, [t])

  const handleForceReload = useCallback(() => {
    window.location.reload()
  }, [])

  // ── Derived Values ────────────────────────────────────────────────────
  const errorTotalPages = Math.max(1, Math.ceil(errorLogCount / PAGE_SIZE))

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">
      {/* Section 1: KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Version Card */}
        <Card shadow className="py-4">
          <CardHeader className="py-0">
            <CardTitle fontSize="text-md" className="text-muted-foreground">
              {t('settings.appVersion')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <div className="text-2xl">v{appVersion}</div>
            <div className="mt-auto text-md text-muted-foreground break-all">
              {window.location.origin}
            </div>
            <div className="text-md text-muted-foreground">
              {t('settings.lastUpdated')}: {document.lastModified}
            </div>
          </CardContent>
        </Card>

        {/* Storage Card */}
        <Card shadow className="py-4">
          <CardHeader className="py-0">
            <CardTitle fontSize="text-md" className="text-muted-foreground">
              {t('settings.localStorage')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-2">
            <AnimatedCircularProgressBar
              value={storagePercent}
              gaugePrimaryColor="rgb(127, 149, 106)"
              gaugeSecondaryColor="rgba(0, 0, 0, 0.1)"
              className="size-28 text-xl"
            />
            <div className="flex w-full justify-between text-muted-foreground">
              <div>
                <div>{t('settings.storageUsed')}</div>
                <div>{formatBytes(usageBytes, 2)}</div>
              </div>
              <div className="text-right">
                <div>{t('settings.storageRemaining')}</div>
                <div>{formatBytes(quotaBytes - usageBytes, 2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cloud Backup Card — R2 usage progress */}
        <Card shadow className="py-4">
          <CardHeader className="py-0">
            <CardTitle fontSize="text-md" className="text-muted-foreground">
              {t('settings.cloudBackup')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-2">
            <AnimatedCircularProgressBar
              value={cloudPercent}
              gaugePrimaryColor="rgb(74, 144, 217)"
              gaugeSecondaryColor="rgba(0, 0, 0, 0.1)"
              className="size-28 text-xl"
            />
            <div className="flex w-full justify-between text-muted-foreground">
              <div>
                <div>{t('settings.storageUsed')}</div>
                <div>{cloudLoading ? '...' : formatBytes(cloudUsageBytes, 2)}</div>
              </div>
              <div className="text-right">
                <div>{t('settings.storageRemaining')}</div>
                <div>{cloudLoading ? '...' : formatBytes(R2_FREE_QUOTA_BYTES - cloudUsageBytes, 2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 2: System Details */}
      <div className="grid grid-cols-3 gap-4">
        {/* Application Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.appInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t('settings.deployMode')}
              </span>
              <span>{isPwaMode() ? 'PWA' : 'Browser'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t('settings.environment')}
              </span>
              <span>{getEnvironment()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t('settings.deviceName')}
              </span>
              <div className="flex items-center gap-2">
                <span data-testid="device-name-display">
                  {deviceDisplayName ?? getDeviceType()}
                </span>
                {isAdmin && (
                  <RippleButton
                    data-testid="edit-device-name-btn"
                    aria-label={t('settings.editDeviceName')}
                    className="flex size-7 items-center justify-center rounded-full border-none bg-transparent text-muted-foreground hover:text-foreground"
                    onClick={handleOpenEditDeviceName}
                  >
                    <Pencil size={14} />
                  </RippleButton>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.database')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t('settings.dbStatus')}
              </span>
              <span>{t('settings.dbNormal')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t('settings.schemaVersion')}
              </span>
              <span>{SCHEMA_VERSION}</span>
            </div>
          </CardContent>
        </Card>

        {/* Login Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.loginInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-muted-foreground">
                {t('settings.googleAccount')}
              </span>
              <div className="break-all">
                {googleUser?.email ?? t('settings.notLoggedIn')}
              </div>
            </div>
            <div>
              {isAdmin ? (
                <span className="inline-block rounded-full bg-primary/15 px-3 py-0.5 text-md text-primary">
                  {t('settings.adminStatus')}
                </span>
              ) : (
                <span className="inline-block rounded-full bg-(--color-red)/15 px-3 py-0.5 text-md text-(--color-red)">
                  {t('settings.notAdmin')}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Name Edit Modal */}
      <ConfirmModal
        open={editDeviceNameOpen}
        title={t('settings.editDeviceName')}
        variant="blue"
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        loading={deviceNameLoading}
        onConfirm={handleConfirmDeviceName}
        onCancel={() => setEditDeviceNameOpen(false)}
      >
        <input
          data-testid="device-name-input"
          type="text"
          value={deviceNameInput}
          onChange={e => setDeviceNameInput(e.target.value)}
          placeholder={t('settings.deviceNamePlaceholder')}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-md outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          style={{ background: 'rgba(255, 255, 255, 0.8)' }}
        />
      </ConfirmModal>

      {/* Section 3: Quick Actions (admin only) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <RippleButton
                className="flex items-center justify-center gap-2 rounded-md border-none bg-(--color-red) px-4 py-2 text-white hover:opacity-80"
                onClick={handleClearCache}
              >
                <Eraser size={16} />
                {t('settings.clearCache')}
              </RippleButton>
              <RippleButton
                className="flex items-center justify-center gap-2 rounded-md border-none bg-(--color-blue) px-4 py-2 text-white hover:opacity-80"
                onClick={handleForceReload}
              >
                <RefreshCw size={16} />
                {t('settings.reloadApp')}
              </RippleButton>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 4: Error Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('settings.errorLogs')}</CardTitle>
            <RippleButton
              className="flex items-center gap-2 rounded-md border-none bg-(--color-red) px-3 py-1 text-white hover:opacity-80 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-50"
              onClick={() => clearLogsMutation.mutate()}
              disabled={errorLogCount === 0}
            >
              <Trash2 size={14} />
              {t('settings.clearLogs')}
            </RippleButton>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-muted-foreground">{t('settings.noErrors')}</p>
          ) : (
            <div className="space-y-4">
              <div className="overflow-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="px-2 py-1">{t('settings.logTime')}</th>
                      <th className="px-2 py-1">{t('settings.logSource')}</th>
                      <th className="px-2 py-1">{t('settings.logMessage')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} className="border-b">
                        <td className="px-2 py-1 whitespace-nowrap">
                          {dayjs(log.createdAt).format('YYYY/MM/DD HH:mm:ss')}
                        </td>
                        <td className="px-2 py-1">{log.source}</td>
                        <td className="px-2 py-1">{log.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                currentPage={errorPage}
                totalPages={errorTotalPages}
                onPageChange={setErrorPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
