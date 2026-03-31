/**
 * Check whether cloud backup is available.
 * Backup API runs as a same-origin Vercel Function at /api/backup,
 * so no client-side credentials are needed.
 */
export function isBackupConfigured(): boolean {
  return true
}
