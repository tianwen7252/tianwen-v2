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
import { logError } from '@/lib/error-logger'
import { ClockInModal } from '@/components/clock-in-modal'
import { EmployeeCard } from './employee-card'
import { deriveCardAction } from './clock-in-utils'
import { tutorialAnchor } from '@/lib/tutorial/tutorial-anchor'
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

  // Refetch and re-evaluate today whenever the page becomes visible again.
  // Covers (a) returning to the tab after switching away and (b) waking the
  // PWA after the device slept past midnight, when the midnight setTimeout
  // may have been throttled.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setToday(dayjs().format('YYYY-MM-DD'))
        setRefreshKey(k => k + 1)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const handleQueryError = useCallback(() => {
    notify.error(t('clockIn.toastLoadError'))
  }, [t])

  const allEmployees = useDbQuery(
    () => getEmployeeRepo().findAll(),
    [refreshKey],
    [] as Employee[],
    { source: 'clock-in:employees', onError: handleQueryError },
  )
  const employees = useMemo(
    () => allEmployees.filter(e => !e.resignationDate),
    [allEmployees],
  )

  const todayAttendances = useDbQuery(
    () => getAttendanceRepo().findByDate(today),
    [today, refreshKey],
    [] as Attendance[],
    { source: 'clock-in:attendances', onError: handleQueryError },
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

      // Day-rollover guard: if the calendar date changed since the modal
      // opened (PWA backgrounded past midnight), refuse the write and force
      // a refresh so the user re-confirms against today's true state.
      if (currentDate !== today) {
        setToday(currentDate)
        setRefreshKey(k => k + 1)
        notify.warning(t('clockIn.toastDataChanged'))
        handleModalClose()
        return
      }

      // Re-fetch today's records and verify the action is still valid
      // against the freshest data. Aborts when state changed underneath
      // the user (concurrent write, second tap on stale snapshot, etc.).
      const freshRecords = await getAttendanceRepo().findByDate(currentDate)
      const empRecords = freshRecords.filter(r => r.employeeId === emp.id)
      const expectedAction = deriveCardAction(empRecords)
      // 'vacation' is an explicit user choice and is never returned by
      // deriveCardAction; it is only valid when no records exist yet.
      const actionStillValid =
        action === 'vacation'
          ? empRecords.length === 0
          : expectedAction === action
      if (!actionStillValid) {
        setRefreshKey(k => k + 1)
        notify.warning(t('clockIn.toastDuplicateClockIn'))
        handleModalClose()
        return
      }

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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      const stack = error instanceof Error ? error.stack : undefined
      logError(message, 'clock-in:handleConfirm', stack)
      notify.error(t('clockIn.toastActionError'))
    } finally {
      setLoading(false)
    }
  }, [modalState, today, handleModalClose, t])

  return (
    <div className="p-4" {...tutorialAnchor('clockIn.page')}>
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
        {...tutorialAnchor('clockIn.employeeCardList')}
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
