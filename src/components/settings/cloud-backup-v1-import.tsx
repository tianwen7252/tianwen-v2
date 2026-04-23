/**
 * Cloud Backup V1 Import — allows importing V1 Dexie/IndexedDB
 * backup files from Google Drive into the V2 SQLite database.
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { RippleButton } from '@/components/ui/ripple-button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmModal } from '@/components/modal/modal'
import { notify } from '@/components/ui/sonner'
import { useAppStore } from '@/stores/app-store'
import { useGoogleAuth } from '@/hooks/use-google-auth'
import { tutorialAnchor } from '@/lib/tutorial/tutorial-anchor'
import {
  listDriveBackupFiles,
  downloadDriveFile,
  withTokenRefresh,
  type DriveFile,
} from '@/lib/google-drive-service'
import { AuthExpiredError } from '@/lib/errors'
import { transformV1Data, type V1BackupData } from '@/lib/v1-data-transformer'
import {
  importV1Data,
  type V1ImportProgress,
  type V1ImportResult,
} from '@/lib/v1-data-importer'
import { getDatabase } from '@/lib/repositories'
import { V1ImportModal } from '@/components/settings/v1-import-modal'

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Format file size in bytes to human-readable string.
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Format ISO date string to locale-friendly display.
 */
function formatDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoDate
  }
}

// ── Component ───────────────────────────────────────────────────────────────

export function CloudBackupV1Import() {
  const { t } = useTranslation()
  const accessToken = useAppStore(s => s.accessToken)
  const { login, isLoggedIn, refreshToken, handleAuthError } = useGoogleAuth()

  const [files, setFiles] = useState<readonly DriveFile[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  // V1 import modal state — importing derived from modal visibility
  const [showImportModal, setShowImportModal] = useState(false)
  const importing = showImportModal
  const [importProgress, setImportProgress] = useState<V1ImportProgress | null>(
    null,
  )
  const [importResult, setImportResult] = useState<V1ImportResult | null>(null)

  // Fetch file list when user is logged in
  useEffect(() => {
    if (!isLoggedIn || !accessToken) return

    let cancelled = false

    async function fetchFiles() {
      setLoading(true)
      try {
        const result = await withTokenRefresh(
          token => listDriveBackupFiles(token),
          accessToken!,
          refreshToken,
        )
        if (!cancelled) {
          setFiles(result)
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof AuthExpiredError) {
            handleAuthError(err)
          } else {
            notify.error(
              t('backup.v1ImportFailed') +
                (err instanceof Error ? `: ${err.message}` : ''),
            )
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchFiles()

    return () => {
      cancelled = true
    }
  }, [isLoggedIn, accessToken, t, refreshToken, handleAuthError])

  // Handle import button click — show confirmation modal
  const handleImportClick = useCallback((file: DriveFile) => {
    setSelectedFile(file)
    setShowConfirm(true)
  }, [])

  // Handle confirmed import — immediately show progress modal,
  // then download → transform → import with live progress updates.
  const handleConfirmImport = useCallback(async () => {
    if (!selectedFile || !accessToken) return

    // Immediately close confirm modal and open progress modal
    setShowConfirm(false)
    setImportProgress(null)
    setImportResult(null)
    setShowImportModal(true)

    try {
      // Phase 1: Download from Google Drive
      setImportProgress({
        phase: 'downloading',
        current: 0,
        total: 1,
        tableName: 'downloading',
      })
      const buffer = await withTokenRefresh(
        token => downloadDriveFile(token, selectedFile.id),
        accessToken,
        refreshToken,
      )

      // Phase 2: Parse + transform
      setImportProgress({
        phase: 'transforming',
        current: 0,
        total: 1,
        tableName: 'transforming',
      })
      const text = new TextDecoder().decode(buffer)
      const v1Data = JSON.parse(text) as V1BackupData
      const transformed = transformV1Data(v1Data)

      // Phase 3: Import into SQLite with per-table progress
      const db = getDatabase()
      const result = await importV1Data(db, transformed, progress => {
        setImportProgress(progress)
      })

      setImportResult(result)

      if (result.errors.length === 0) {
        notify.success(t('backup.v1ImportSuccess'))
      }
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        handleAuthError(err)
      } else {
        const msg = err instanceof Error ? err.message : String(err)
        setImportResult({ counts: {}, errors: [msg] })
      }
    }
  }, [selectedFile, accessToken, t, refreshToken, handleAuthError])

  // Handle closing the import progress modal
  const handleCloseImportModal = useCallback(() => {
    setShowImportModal(false)
    setImportProgress(null)
    setImportResult(null)
    setSelectedFile(null)
  }, [])

  // Handle cancel confirmation
  const handleCancelConfirm = useCallback(() => {
    setShowConfirm(false)
    setSelectedFile(null)
  }, [])

  return (
    <Card {...tutorialAnchor('settings.cloudBackup.v1Import')}>
      <CardHeader>
        <CardTitle>{t('backup.v1Import')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-muted-foreground">{t('backup.v1ImportDesc')}</p>

        {/* Not logged in — show Connect button */}
        {!isLoggedIn && (
          <RippleButton
            className="flex items-center justify-center gap-2 rounded-md border-none bg-(--color-blue) px-4 py-2 text-white hover:opacity-80"
            onClick={login}
          >
            {t('backup.v1ConnectDrive')}
          </RippleButton>
        )}

        {/* Logged in — show file list */}
        {isLoggedIn && (
          <>
            {/* Loading state — skeleton rows mirroring the file-list table */}
            {loading && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4">{t('backup.v1FileName')}</th>
                      <th className="pb-2 pr-4">{t('backup.v1FileSize')}</th>
                      <th className="pb-2 pr-4">{t('backup.v1FileCreated')}</th>
                      <th className="pb-2">{t('backup.v1FileAction')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 3 }).map((_, index) => (
                      <tr
                        key={`v1-skeleton-${index}`}
                        className="border-b last:border-0"
                      >
                        <td className="py-3 pr-4">
                          <Skeleton className="h-4 w-40" />
                        </td>
                        <td className="py-3 pr-4">
                          <Skeleton className="h-4 w-16" />
                        </td>
                        <td className="py-3 pr-4">
                          <Skeleton className="h-4 w-28" />
                        </td>
                        <td className="py-3">
                          <Skeleton className="h-8 w-20" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* No files */}
            {!loading && files.length === 0 && (
              <p className="py-4 text-center text-muted-foreground">
                {t('backup.v1NoFiles')}
              </p>
            )}

            {/* File list table */}
            {!loading && files.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4">{t('backup.v1FileName')}</th>
                      <th className="pb-2 pr-4">{t('backup.v1FileSize')}</th>
                      <th className="pb-2 pr-4">{t('backup.v1FileCreated')}</th>
                      <th className="pb-2">{t('backup.v1FileAction')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map(file => (
                      <tr key={file.id} className="border-b last:border-0">
                        <td className="py-3 pr-4">{file.name}</td>
                        <td className="py-3 pr-4">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="py-3 pr-4">
                          {formatDate(file.createdTime)}
                        </td>
                        <td className="py-3">
                          <RippleButton
                            className="rounded-md border-none bg-(--color-purple) px-3 py-1 text-white hover:opacity-80"
                            onClick={() => handleImportClick(file)}
                            disabled={importing}
                          >
                            {importing && selectedFile?.id === file.id
                              ? t('backup.v1Importing')
                              : t('backup.v1ImportBtn')}
                          </RippleButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Confirmation modal */}
        <ConfirmModal
          open={showConfirm}
          title={t('backup.v1ImportConfirm')}
          variant="red"
          confirmText={t('backup.v1ImportBtn')}
          loading={importing}
          onConfirm={handleConfirmImport}
          onCancel={handleCancelConfirm}
        >
          <p className="text-center text-muted-foreground">
            {t('backup.v1ImportWarning')}
          </p>
          {selectedFile && (
            <p className="mt-2 text-center">{selectedFile.name}</p>
          )}
        </ConfirmModal>

        {/* V1 import progress modal */}
        <V1ImportModal
          open={showImportModal}
          progress={importProgress}
          result={importResult}
          onClose={handleCloseImportModal}
        />
      </CardContent>
    </Card>
  )
}
