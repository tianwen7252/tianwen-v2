/**
 * ClockIn — employee card grid for clock-in/out operations.
 * Ported from V1 ClockIn with V2 Tailwind CSS, mock data services, and ClockInModal.
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { notify } from '@/components/ui/sonner'
import { Info } from 'lucide-react'
import { WEEKDAY_SHORT } from '@/lib/records-utils'
import { getEmployeeRepo, getAttendanceRepo } from '@/lib/repositories'
import { useDbQuery } from '@/hooks/use-db-query'
import { ClockInModal } from '@/components/clock-in-modal'
import { EmployeeCard } from './employee-card'
import { deriveCardAction } from './clock-in-utils'
import type { ClockInAction } from '@/components/clock-in-modal'
import type { Employee, Attendance } from '@/lib/schemas'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ModalState {
  readonly visible: boolean
  readonly employee: Employee | null
  readonly action: ClockInAction
  readonly attendance?: Attendance
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ClockIn() {
  const { t } = useTranslation()
  // Auto-update date at midnight
  const [today, setToday] = useState(() => dayjs().format('YYYY-MM-DD'))

  useEffect(() => {
    const msUntilMidnight =
      dayjs().endOf('day').valueOf() - dayjs().valueOf() + 1000
    const timer = setTimeout(
      () => setToday(dayjs().format('YYYY-MM-DD')),
      msUntilMidnight,
    )
    return () => clearTimeout(timer)
  }, [today])

  // Data sources — refreshKey forces re-fetch after mutations
  const [refreshKey, setRefreshKey] = useState(0)

  const allEmployees = useDbQuery(
    () => getEmployeeRepo().findAll(),
    [refreshKey],
    [] as Employee[],
  )
  const employees = useMemo(
    () => allEmployees.filter(e => !e.resignationDate),
    [allEmployees],
  )

  const todayAttendances = useDbQuery(
    () => getAttendanceRepo().findByDate(today),
    [today, refreshKey],
    [] as Attendance[],
  )

  // Build O(1) lookup from employeeId -> attendance records
  const attendanceMap = useMemo(
    () =>
      todayAttendances.reduce<Record<string, readonly Attendance[]>>(
        (map, r) => ({
          ...map,
          [r.employeeId]: [...(map[r.employeeId] ?? []), r],
        }),
        {},
      ),
    [todayAttendances],
  )

  // Modal state
  const [modalState, setModalState] = useState<ModalState>({
    visible: false,
    employee: null,
    action: 'clockIn',
  })
  const [loading, setLoading] = useState(false)

  // Header title
  const todayDayjs = dayjs(today)
  const headerTitle = t('clockIn.todayTitle', {
    date: todayDayjs.format('YYYY/M/D'),
    weekday: WEEKDAY_SHORT[todayDayjs.day()],
  })

  // Handlers
  const handleCardClick = useCallback(
    (employee: Employee, records: readonly Attendance[]) => {
      const action = deriveCardAction(records)
      const lastRecord =
        records.length > 0 ? records[records.length - 1] : undefined
      setModalState({
        visible: true,
        employee,
        action,
        attendance:
          action === 'clockOut' || action === 'cancelVacation'
            ? lastRecord
            : undefined,
      })
    },
    [],
  )

  const handleButtonAction = useCallback(
    (
      e: React.MouseEvent,
      employee: Employee,
      action: ClockInAction,
      record?: Attendance,
    ) => {
      e.stopPropagation()
      setModalState({
        visible: true,
        employee,
        action,
        attendance: record,
      })
    },
    [],
  )

  const handleModalClose = useCallback(() => {
    setModalState({
      visible: false,
      employee: null,
      action: 'clockIn',
    })
  }, [])

  const handleConfirm = useCallback(async () => {
    const { employee: emp, action, attendance: record } = modalState
    if (!emp?.id) return

    setLoading(true)
    try {
      const now = dayjs()
      const currentDate = now.format('YYYY-MM-DD')

      switch (action) {
        case 'clockIn':
          await getAttendanceRepo().create({
            employeeId: emp.id,
            date: currentDate,
            clockIn: now.valueOf(),
            type: 'regular',
          })
          notify.success(t('clockIn.toastClockIn'))
          break

        case 'clockOut':
          if (record?.id != null) {
            await getAttendanceRepo().update(record.id, {
              clockOut: now.valueOf(),
            })
          }
          notify.success(t('clockIn.toastClockOut'))
          break

        case 'vacation':
          await getAttendanceRepo().create({
            employeeId: emp.id,
            date: currentDate,
            clockIn: now.valueOf(),
            type: 'paid_leave',
          })
          notify.success(t('clockIn.toastVacation'))
          break

        case 'cancelVacation':
          if (record?.id != null) {
            await getAttendanceRepo().remove(record.id)
          }
          notify.success(t('clockIn.toastCancelVacation'))
          break
      }
      setRefreshKey(k => k + 1)
      handleModalClose()
    } finally {
      setLoading(false)
    }
  }, [modalState, handleModalClose, t])

  return (
    <div className="p-4">
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-medium">{headerTitle}</h3>
        <span className="flex items-center gap-1 text-sm text-[#aaa]">
          <Info size={14} /> {t('clockIn.hint')}
        </span>
      </div>

      {/* Card grid */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        }}
      >
        {employees.map(employee => {
          const records = attendanceMap[employee.id] ?? []
          return (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              records={records}
              onCardClick={handleCardClick}
              onButtonAction={handleButtonAction}
            />
          )
        })}

        {employees.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            {t('clockIn.noEmployees')}
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      <ClockInModal
        open={modalState.visible}
        employee={modalState.employee}
        action={modalState.action}
        attendance={modalState.attendance}
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={handleModalClose}
      />
    </div>
  )
}
