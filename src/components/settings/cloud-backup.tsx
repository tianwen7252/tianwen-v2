/**
 * Cloud Backup main component — composes status KPI cards,
 * DB statistics table, and backup action controls.
 */

import { CloudBackupStatus } from './cloud-backup-status'
import { CloudBackupDbStats } from './cloud-backup-db-stats'
import { CloudBackupHistory } from './cloud-backup-history'
import { CloudBackupV1Import } from './cloud-backup-v1-import'

// ── Component ───────────────────────────────────────────────────────────────

export function CloudBackup() {
  return (
    <div className="space-y-6 p-6">
      {/* Section 1: Status KPI Cards (3-column grid) */}
      <CloudBackupStatus />

      {/* Section 2: DB Statistics + Cloud Stats + Actions */}
      <CloudBackupDbStats />

      {/* Section 3: Backup History */}
      <CloudBackupHistory />

      {/* Section 4: V1 Database Import from Google Drive */}
      <CloudBackupV1Import />
    </div>
  )
}
