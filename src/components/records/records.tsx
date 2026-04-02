/**
 * Records container - main attendance records view with table/calendar toggle,
 * search filter, year/month selects, and RecordModal integration.
 */

import { useState, useMemo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { LayoutList, Calendar, Info } from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  buildDayRows,
  buildCalendarGrid,
  getYearOptions,
  getMonthOptions,
} from '@/lib/records-utils'
import { getEmployeeRepo, getAttendanceRepo } from '@/lib/repositories'
import { useDbQuery } from '@/hooks/use-db-query'
import { RecordsTableView } from './records-table-view'
import { RecordsCalendarView } from './records-calendar-view'
import { RecordModal } from '@/components/record-modal'
import type { Employee, Attendance } from '@/lib/schemas'

// ─── Types ──────────────────────────────────────────────────────────────────

type ViewMode = 'table' | 'calendar'

interface ModalState {
  readonly open: boolean
  readonly mode: 'add' | 'edit'
  readonly employee: Employee | null
  readonly date: string
  readonly record?: Attendance
}

const INITIAL_MODAL_STATE: ModalState = {
  open: false,
  mode: 'add',
  employee: null,
  date: '',
}

// ─── Component ──────────────────────────────────────────────────────────────

export function Records() {
  const { t } = useTranslation()
  const now = dayjs()
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState(now.year())
  const [selectedMonth, setSelectedMonth] = useState(now.month() + 1)
  const [modalState, setModalState] = useState<ModalState>(INITIAL_MODAL_STATE)
  const [refreshKey, setRefreshKey] = useState(0)

  const todayStr = now.format('YYYY-MM-DD')
  const currentYear = now.year()
  const currentMonth = now.month() + 1

  // Fetch data — refreshKey forces re-computation after mutations
  const allEmployees = useDbQuery(
    () => getEmployeeRepo().findByStatus('active'),
    [refreshKey],
    [] as Employee[],
  )
  const attendances = useDbQuery(
    () => getAttendanceRepo().findByMonth(selectedYear, selectedMonth),
    [selectedYear, selectedMonth, refreshKey],
    [] as Attendance[],
  )

  // Filter employees by selection
  const filteredEmployees = useMemo(
    () =>
      selectedEmployeeId === 'all'
        ? allEmployees
        : allEmployees.filter(emp => emp.id === selectedEmployeeId),
    [allEmployees, selectedEmployeeId],
  )

  // Build view data
  const dayRows = useMemo(
    () =>
      buildDayRows(
        selectedYear,
        selectedMonth,
        filteredEmployees,
        attendances,
        todayStr,
      ),
    [selectedYear, selectedMonth, filteredEmployees, attendances, todayStr],
  )

  const calendarGrid = useMemo(
    () =>
      buildCalendarGrid(
        selectedYear,
        selectedMonth,
        filteredEmployees,
        attendances,
        todayStr,
      ),
    [selectedYear, selectedMonth, filteredEmployees, attendances, todayStr],
  )

  // Options
  const yearOptions = useMemo(() => getYearOptions(currentYear), [currentYear])
  const monthOptions = useMemo(
    () => getMonthOptions(selectedYear, currentYear, currentMonth),
    [selectedYear, currentYear, currentMonth],
  )

  // Cache last valid modal employee so close animation can render content
  const lastModalEmployeeRef = useRef<Employee | null>(null)
  if (modalState.employee) lastModalEmployeeRef.current = modalState.employee
  const modalEmployee = modalState.employee ?? lastModalEmployeeRef.current

  // Modal handlers
  const handleAddRecord = useCallback(
    (employee: Employee, date: string) => {
      setModalState({
        open: true,
        mode: 'add',
        employee,
        date,
      })
    },
    [setModalState],
  )

  const handleEditRecord = useCallback(
    (employee: Employee, date: string, record: Attendance) => {
      setModalState({
        open: true,
        mode: 'edit',
        employee,
        date,
        record,
      })
    },
    [setModalState],
  )

  const handleModalCancel = useCallback(() => {
    setModalState(INITIAL_MODAL_STATE)
  }, [setModalState])

  const handleModalSuccess = useCallback(() => {
    setModalState(INITIAL_MODAL_STATE)
    setRefreshKey(k => k + 1)
  }, [setModalState, setRefreshKey])

  // "Today" button handler — uses fresh dayjs() to avoid stale closure
  const handleTodayClick = useCallback(() => {
    const today = dayjs()
    setSelectedYear(today.year())
    setSelectedMonth(today.month() + 1)
  }, [setSelectedYear, setSelectedMonth])

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-medium">{t('records.title')}</h3>
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          <button
            type="button"
            className={cn(
              'inline-flex items-center rounded-lg px-3 py-1.5 text-md',
              viewMode === 'table' ? 'bg-card shadow-[0_0_10px_#ccc]' : '',
            )}
            onClick={() => setViewMode('table')}
          >
            <LayoutList size={20} className="mr-1" />
            {t('records.table')}
          </button>
          <button
            type="button"
            className={cn(
              'inline-flex items-center rounded-lg px-3 py-1.5 text-md',
              viewMode === 'calendar' ? 'bg-card shadow-[0_0_10px_#ccc]' : '',
            )}
            onClick={() => setViewMode('calendar')}
          >
            <Calendar size={20} className="mr-1" />
            {t('records.calendar')}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-4 grid w-full grid-cols-[2fr_1fr_1fr_auto] items-center gap-3">
        <Select
          value={selectedEmployeeId}
          onValueChange={setSelectedEmployeeId}
        >
          <SelectTrigger className="w-full h-[38px] rounded-lg text-base">
            <SelectValue placeholder={t('records.searchPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('records.allEmployees')}</SelectItem>
            {allEmployees.map(emp => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={String(selectedYear)}
          onValueChange={v => setSelectedYear(Number(v))}
        >
          <SelectTrigger className="w-full h-[38px] rounded-lg text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map(opt => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={String(selectedMonth)}
          onValueChange={v => setSelectedMonth(Number(v))}
        >
          <SelectTrigger className="w-full h-[38px] rounded-lg text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(opt => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="button"
          className="h-[38px] rounded-lg border border-border bg-card px-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
          onClick={handleTodayClick}
        >
          {t('records.today')}
        </button>
      </div>

      {/* Hint */}
      <div className="mb-3 flex items-center gap-1.5 text-base text-[#aaa]">
        <Info size={14} />
        <span>{t('records.hint')}</span>
      </div>

      {/* View content */}
      {viewMode === 'table' ? (
        <RecordsTableView
          dayRows={dayRows}
          employees={filteredEmployees}
          onEditRecord={handleEditRecord}
          onAddRecord={handleAddRecord}
          todayDate={todayStr}
        />
      ) : (
        <RecordsCalendarView
          calendarGrid={calendarGrid}
          onEditRecord={handleEditRecord}
          onAddRecord={handleAddRecord}
        />
      )}

      {/* RecordModal — use cached employee so close animation can play */}
      {modalEmployee && (
        <RecordModal
          open={modalState.open}
          mode={modalState.mode}
          employee={modalEmployee}
          date={modalState.date}
          record={modalState.record}
          onCancel={handleModalCancel}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  )
}
