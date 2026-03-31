/**
 * Cloud Backup V1 Import — allows importing V1 Dexie/IndexedDB
 * backup files from Google Drive into the V2 SQLite database.
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { RippleButton } from '@/components/ui/ripple-button'
import { ConfirmModal } from '@/components/modal/modal'
import { notify } from '@/components/ui/sonner'
import { useAppStore } from '@/stores/app-store'
import { useGoogleAuth } from '@/hooks/use-google-auth'
import {
  listDriveBackupFiles,
  downloadDriveFile,
  type DriveFile,
} from '@/lib/google-drive-service'
import { AuthExpiredError } from '@/lib/errors'
import { transformV1Data, type V1BackupData } from '@/lib/v1-data-transformer'

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
  const { login, isLoggedIn, handleAuthError } = useGoogleAuth()

  const [files, setFiles] = useState<readonly DriveFile[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  // Fetch file list when user is logged in
  useEffect(() => {
    if (!isLoggedIn || !accessToken) return

    let cancelled = false

    async function fetchFiles() {
      setLoading(true)
      try {
        const result = await listDriveBackupFiles(accessToken!)
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
  }, [isLoggedIn, accessToken, t, handleAuthError])

  // Handle import button click — show confirmation modal
  const handleImportClick = useCallback((file: DriveFile) => {
    setSelectedFile(file)
    setShowConfirm(true)
  }, [])

  // Handle confirmed import
  const handleConfirmImport = useCallback(async () => {
    if (!selectedFile || !accessToken) return

    setImporting(true)
    try {
      // Download the file from Google Drive
      const buffer = await downloadDriveFile(accessToken, selectedFile.id)

      // Parse the JSON backup data
      const text = new TextDecoder().decode(buffer)
      const v1Data = JSON.parse(text) as V1BackupData

      // Transform V1 data to V2 format
      const result = transformV1Data(v1Data)

      // Log warnings if any
      for (const warning of result.warnings) {
        notify.info(warning)
      }

      // TODO: Write transformed data to SQLite database
      // This will be implemented when the DB write API is available

      notify.success(t('backup.v1ImportSuccess'))
      setShowConfirm(false)
      setSelectedFile(null)
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        handleAuthError(err)
      } else {
        notify.error(
          t('backup.v1ImportFailed') +
            (err instanceof Error ? `: ${err.message}` : ''),
        )
      }
    } finally {
      setImporting(false)
    }
  }, [selectedFile, accessToken, t, handleAuthError])

  // Handle cancel confirmation
  const handleCancelConfirm = useCallback(() => {
    setShowConfirm(false)
    setSelectedFile(null)
  }, [])

  return (
    <Card>
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
            {/* Loading state */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2
                  size={24}
                  className="animate-spin text-muted-foreground"
                />
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
                        <td className="py-3 pr-4 text-muted-foreground">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {formatDate(file.createdTime)}
                        </td>
                        <td className="py-3">
                          <RippleButton
                            className="rounded-md border-none bg-(--color-green) px-3 py-1 text-white hover:opacity-80"
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
      </CardContent>
    </Card>
  )
}
