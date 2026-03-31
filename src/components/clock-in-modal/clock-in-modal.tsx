/**
 * ClockInModal — confirmation modal for clock-in/out/vacation actions.
 * Ported from V1 ClockInModal with V2 ConfirmModal, ModalCard, AvatarImage.
 */

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { ConfirmModal, ModalCard } from '@/components/modal'
import { AvatarImage } from '@/components/avatar-image'
import { SHIFT_TYPES } from '@/constants/shift-types'
import type { Employee, Attendance } from '@/lib/schemas'
import type {
  GradientVariant,
  ShineColorPreset,
} from '@/components/modal/modal.types'

// ─── Types ──────────────────────────────────────────────────────────────────

export type ClockInAction =
  | 'clockIn'
  | 'clockOut'
  | 'vacation'
  | 'cancelVacation'

export interface ClockInModalProps {
  readonly open: boolean
  readonly employee: Employee | null
  readonly action: ClockInAction
  readonly attendance?: Attendance
  readonly loading?: boolean
  readonly onConfirm: () => void
  readonly onCancel: () => void
}

// ─── Action Configuration Maps ──────────────────────────────────────────────

// Translation key mapping for modal title (with {{name}} interpolation)
const TITLE_KEY_MAP: Record<ClockInAction, string> = {
  clockIn: 'clockIn.confirmClockIn',
  clockOut: 'clockIn.confirmClockOut',
  vacation: 'clockIn.confirmVacation',
  cancelVacation: 'clockIn.confirmCancelVacation',
}

// Translation key mapping for confirm button text
const CONFIRM_TEXT_KEY_MAP: Record<ClockInAction, string> = {
  clockIn: 'clockIn.confirmClockInBtn',
  clockOut: 'clockIn.confirmClockOutBtn',
  vacation: 'clockIn.confirmVacationBtn',
  cancelVacation: 'clockIn.confirmCancelVacationBtn',
}

const VARIANT_MAP: Record<ClockInAction, GradientVariant> = {
  clockIn: 'green',
  clockOut: 'warm',
  vacation: 'red',
  cancelVacation: 'red',
}

const SHINE_MAP: Record<ClockInAction, ShineColorPreset> = {
  clockIn: 'green',
  clockOut: 'purple',
  vacation: 'red',
  cancelVacation: 'red',
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Format time to "HH:mm AM/PM" using English locale.
 * Global dayjs locale may be zh-tw, so force English for AM/PM text.
 */
function formatTimeAmPm(date: dayjs.Dayjs): string {
  return date.locale('en').format('hh:mm A')
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ClockInModal({
  open,
  employee,
  action,
  attendance,
  loading = false,
  onConfirm,
  onCancel,
}: ClockInModalProps) {
  const { t } = useTranslation()

  // Cache last valid props so close animation renders correct content
  const snapshotRef = useRef({ employee, action, attendance })
  if (employee) {
    snapshotRef.current = { employee, action, attendance }
  }
  const displayEmployee = employee ?? snapshotRef.current.employee
  const displayAction = employee ? action : snapshotRef.current.action
  const displayAttendance = employee
    ? attendance
    : snapshotRef.current.attendance

  // Real-time clock — updates every second when modal is open
  const [currentTime, setCurrentTime] = useState(() => dayjs())

  useEffect(() => {
    if (!open) return undefined
    const intervalId = setInterval(() => {
      setCurrentTime(dayjs())
    }, 1000)
    return () => clearInterval(intervalId)
  }, [open])

  // Early return only when no employee has ever been set
  if (!displayEmployee) {
    return null
  }

  // Derive display values from cached action/attendance
  const title = t(TITLE_KEY_MAP[displayAction], { name: displayEmployee.name })
  const confirmText = t(CONFIRM_TEXT_KEY_MAP[displayAction])
  const variant = VARIANT_MAP[displayAction]
  const shine = SHINE_MAP[displayAction]

  // Shift type label with fallback
  const shiftTypeEntry = SHIFT_TYPES.find(
    s => s.key === displayEmployee.shiftType,
  )
  const shiftTypeLabel = shiftTypeEntry?.label ?? SHIFT_TYPES[0].label

  // Re-clock-out hint
  const showReClockOutHint =
    displayAction === 'clockOut' && displayAttendance?.clockOut != null
  const clockOutTime = displayAttendance?.clockOut
    ? dayjs(displayAttendance.clockOut).format('HH:mm')
    : ''

  // Time display logic based on action
  const isCancelVacation = displayAction === 'cancelVacation'
  const isVacation = displayAction === 'vacation'

  let timeLabel: string
  let timeValue: string

  if (isCancelVacation) {
    timeLabel = t('clockIn.vacationClockTime')
    timeValue =
      displayAttendance?.clockIn != null
        ? formatTimeAmPm(dayjs(displayAttendance.clockIn))
        : '?? : ??'
  } else if (isVacation) {
    timeLabel = t('clockIn.vacationTime')
    timeValue = formatTimeAmPm(currentTime)
  } else {
    timeLabel = t('clockIn.currentTime')
    timeValue = formatTimeAmPm(currentTime)
  }

  return (
    <ConfirmModal
      open={open}
      title={title}
      variant={variant}
      shineColor={shine}
      confirmText={confirmText}
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <ModalCard>
        <AvatarImage avatar={displayEmployee.avatar} size={120} />

        <div
          className="mt-3 text-xl font-semibold"
          style={{ color: '#1a202c' }}
        >
          {displayEmployee.name}
        </div>

        {displayEmployee.isAdmin && (
          <div
            className="mt-1 text-sm font-medium"
            style={{ color: '#7f956a' }}
          >
            {t('staff.admin')}
          </div>
        )}

        {showReClockOutHint && (
          <div className="mt-2 text-sm" style={{ color: '#e53e3e' }}>
            {t('clockIn.reClockOutHint', { time: clockOutTime })}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-6 text-center">
          <div>
            <div className="text-sm" style={{ color: '#718096' }}>
              {timeLabel}
            </div>
            <div className="text-lg" style={{ color: '#1a202c', marginTop: 4 }}>
              {timeValue}
            </div>
          </div>
          <div>
            <div className="text-sm" style={{ color: '#718096' }}>
              {t('clockIn.shiftTypeLabel')}
            </div>
            <div className="text-lg" style={{ color: '#1a202c', marginTop: 4 }}>
              {shiftTypeLabel}
            </div>
          </div>
        </div>
      </ModalCard>
    </ConfirmModal>
  )
}
