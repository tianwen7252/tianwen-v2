/**
 * V1 Import Progress Modal — displays real-time progress
 * while importing V1 Dexie backup data into the V2 SQLite database.
 *
 * Uses the base Modal component with no close/cancel buttons.
 * The user can only dismiss the modal after import completes.
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Loader2, CircleAlert } from 'lucide-react'
import { Modal } from '@/components/modal/modal'
import { RippleButton } from '@/components/ui/ripple-button'
import { AnimatedCircularProgressBar } from '@/components/ui/animated-circular-progress-bar'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { V1ImportProgress, V1ImportResult } from '@/lib/v1-data-importer'

// ── Constants ──────────────────────────────────────────────────────────────

/** Import phases — determines display order of status rows */
const IMPORT_ORDER = [
  'downloading',
  'transforming',
  'orders',
  'order_items',
] as const

/** Color tokens matching the modal design system */
const COLOR_PRIMARY = '#7f956a'
const COLOR_GREEN = '#48bb78'
const COLOR_MUTED = '#718096'

// ── Props ──────────────────────────────────────────────────────────────────

interface V1ImportModalProps {
  readonly open: boolean
  readonly progress: V1ImportProgress | null
  readonly result: V1ImportResult | null
  readonly onClose: () => void
}

// ── Helpers ────────────────────────────────────────────────────────────────

type TablePhase = 'pending' | 'active' | 'done'

/**
 * Determine the display phase for each table based on current progress.
 */
function getTablePhase(
  tableName: string,
  progress: V1ImportProgress | null,
  result: V1ImportResult | null,
): TablePhase {
  if (result) return 'done'
  if (!progress) return 'pending'
  if (progress.phase === 'done') return 'done'

  const currentIdx = IMPORT_ORDER.indexOf(
    progress.phase as (typeof IMPORT_ORDER)[number],
  )
  const tableIdx = IMPORT_ORDER.indexOf(
    tableName as (typeof IMPORT_ORDER)[number],
  )

  if (tableIdx < currentIdx) return 'done'
  if (tableIdx === currentIdx) return 'active'
  return 'pending'
}

/**
 * Compute the overall percentage progress across all tables.
 */
function computeOverallProgress(
  progress: V1ImportProgress | null,
  result: V1ImportResult | null,
): number {
  if (result) return 100
  if (!progress) return 0
  if (progress.phase === 'done') return 100

  const currentIdx = IMPORT_ORDER.indexOf(
    progress.phase as (typeof IMPORT_ORDER)[number],
  )
  if (currentIdx < 0) return 0

  const totalTables = IMPORT_ORDER.length
  // Base progress from completed tables
  const basePercent = (currentIdx / totalTables) * 100
  // Progress within current table
  const tablePercent =
    progress.total > 0
      ? ((progress.current / progress.total) * 100) / totalTables
      : 0

  return Math.min(Math.round(basePercent + tablePercent), 99)
}

// ── Component ──────────────────────────────────────────────────────────────

export function V1ImportModal({
  open,
  progress,
  result,
  onClose,
}: V1ImportModalProps) {
  const { t } = useTranslation()

  const isComplete = result !== null || progress?.phase === 'done'
  const hasErrors = (result?.errors.length ?? 0) > 0
  const overallPercent = useMemo(
    () => computeOverallProgress(progress, result),
    [progress, result],
  )

  // Build title based on state
  const title = isComplete
    ? hasErrors
      ? t('backup.v1ImportCompleteWithErrors')
      : t('backup.v1ImportComplete')
    : t('backup.v1ImportSyncing')

  // Animate size change between states
  const modalWidth = isComplete && hasErrors ? 720 : 660
  // Explicit height for CSS transition (auto can't be transitioned)
  const modalHeight = isComplete
    ? hasErrors
      ? 620 // list + errors + button
      : 440 // list + button, no progress bar
    : 540 // progress bar + list

  return (
    <Modal
      open={open}
      variant="green"
      animated
      header={t('backup.v1ImportModalTitle')}
      title={title}
      width={modalWidth}
      height={modalHeight}
      transition
      hideCloseButton
      closeOnBackdropClick={false}
      onClose={onClose}
      footer={
        isComplete ? (
          <div className="flex justify-center">
            <RippleButton
              className="rounded-lg border-none px-12 py-4 text-lg text-white"
              style={{ background: COLOR_PRIMARY }}
              onClick={onClose}
            >
              {t('backup.v1ImportConfirm')}
            </RippleButton>
          </div>
        ) : undefined
      }
    >
      <div className="flex flex-col items-center gap-6">
        {/* Circular progress bar */}
        {!isComplete && (
          <AnimatedCircularProgressBar
            value={overallPercent}
            gaugePrimaryColor={COLOR_PRIMARY}
            gaugeSecondaryColor="rgba(127, 149, 106, 0.2)"
          />
        )}

        {/* Table import status list (2 columns on wider modal) */}
        <div className="grid w-full grid-cols-2 gap-x-4 gap-y-2">
          {IMPORT_ORDER.map(tableName => {
            const phase = getTablePhase(tableName, progress, result)
            const count = result?.counts[tableName]
            const isActive = phase === 'active' && progress?.phase === tableName

            return (
              <TableRow
                key={tableName}
                tableName={tableName}
                phase={phase}
                count={count}
                current={isActive ? progress?.current : undefined}
                total={isActive ? progress?.total : undefined}
                t={t}
              />
            )
          })}
        </div>

        {/* Error list (only when complete and has errors) */}
        {isComplete && hasErrors && result?.errors && (
          <div className="w-full">
            <div
              className="mb-2 flex items-center gap-1.5"
              style={{ color: '#e85d5d' }}
            >
              <CircleAlert size={16} />
              <span className="text-md">
                {result.errors.length} error
                {result.errors.length > 1 ? 's' : ''}
              </span>
            </div>
            <ScrollArea className="h-40 w-full rounded-lg border border-red-200 bg-red-50/50">
              <div style={{ padding: 20 }}>
                <ol
                  className="list-decimal space-y-1"
                  style={{ paddingLeft: 18 }}
                >
                  {result.errors.map((error, idx) => (
                    <li
                      key={idx}
                      className="text-md"
                      style={{ color: '#e85d5d' }}
                    >
                      {error}
                    </li>
                  ))}
                </ol>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ── Table Row ──────────────────────────────────────────────────────────────

interface TableRowProps {
  readonly tableName: string
  readonly phase: TablePhase
  readonly count: number | undefined
  readonly current: number | undefined
  readonly total: number | undefined
  readonly t: (key: string, options?: Record<string, unknown>) => string
}

function TableRow({
  tableName,
  phase,
  count,
  current,
  total,
  t,
}: TableRowProps) {
  const label = t(`backup.v1Table_${tableName}`)

  return (
    <div className="flex items-center gap-3 px-2 py-1">
      {/* Status icon */}
      <div className="flex size-5 shrink-0 items-center justify-center">
        {phase === 'done' && <Check size={18} style={{ color: COLOR_GREEN }} />}
        {phase === 'active' && (
          <Loader2
            size={18}
            className="animate-spin"
            style={{ color: COLOR_PRIMARY }}
          />
        )}
        {phase === 'pending' && (
          <div
            className="size-2 rounded-full"
            style={{ background: '#cbd5e0' }}
          />
        )}
      </div>

      {/* Label */}
      <span
        className="text-md"
        style={{
          color: phase === 'pending' ? COLOR_MUTED : '#1a202c',
        }}
      >
        {label}
      </span>

      {/* Count / Progress */}
      <span className="ml-auto text-md" style={{ color: COLOR_MUTED }}>
        {phase === 'done' &&
          count !== undefined &&
          t('backup.v1ImportRows', { count })}
        {phase === 'active' &&
          current !== undefined &&
          total !== undefined &&
          total > 0 &&
          `${current}/${total}`}
      </span>
    </div>
  )
}
