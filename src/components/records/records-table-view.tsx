/**
 * RecordsTableView - HTML table showing attendance data by date (rows) x employee (columns).
 * Sticky date column on the left, employee headers with avatar + name.
 */

import { useTranslation } from 'react-i18next'
import { AvatarImage } from '@/components/avatar-image'
import {
  formatClockTime,
  getCellDisplayType,
  dayRowHasAttendance,
} from '@/lib/records-utils'
import { calcTotalHours, formatTotalHours } from '@/lib/attendance-utils'
import { cn } from '@/lib/cn'
import type { Employee, Attendance } from '@/lib/schemas'
import type { DayRow, EmployeeAttendanceCell } from '@/lib/records-utils'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RecordsTableViewProps {
  readonly dayRows: readonly DayRow[]
  readonly employees: readonly Employee[]
  readonly onEditRecord: (
    employee: Employee,
    date: string,
    record: Attendance,
  ) => void
  readonly onAddRecord: (employee: Employee, date: string) => void
  readonly todayDate?: string
}

// ─── Sub-components ─────────────────────────────────────────────────────────

/** Render an individual attendance card within a cell. */
function AttendanceCard({
  attendance,
  employee,
  date,
  onEdit,
}: {
  readonly attendance: Attendance
  readonly employee: Employee
  readonly date: string
  readonly onEdit: (
    employee: Employee,
    date: string,
    record: Attendance,
  ) => void
}) {
  const { t } = useTranslation()
  const displayType = getCellDisplayType(attendance)
  const clockIn = formatClockTime(attendance.clockIn)
  const clockOut = formatClockTime(attendance.clockOut)

  if (displayType === 'vacation') {
    return (
      <button
        type="button"
        className="rounded-md border border-[#f88181] bg-[#fff5f5] px-2 py-1 text-base font-bold text-[#f88181] cursor-pointer"
        onClick={e => {
          e.stopPropagation()
          onEdit(employee, date, attendance)
        }}
      >
        {t('records.vacation')}
      </button>
    )
  }

  const timeLabel =
    displayType === 'clockInOnly' ? `${clockIn} -` : `${clockIn} - ${clockOut}`

  return (
    <button
      type="button"
      className="rounded-md border border-[#f2d680] px-2 py-1 text-base font-medium text-[#334155] cursor-pointer hover:border-[#e6c45a]"
      onClick={e => {
        e.stopPropagation()
        onEdit(employee, date, attendance)
      }}
    >
      {timeLabel}
    </button>
  )
}

/** Render the content of a single cell. */
function CellContent({
  cell,
  date,
  onEdit,
  onAdd,
}: {
  readonly cell: EmployeeAttendanceCell
  readonly date: string
  readonly onEdit: (
    employee: Employee,
    date: string,
    record: Attendance,
  ) => void
  readonly onAdd: (employee: Employee, date: string) => void
}) {
  const { employee, attendances } = cell

  const { t } = useTranslation()

  if (attendances.length === 0) {
    return (
      <button
        type="button"
        className="text-[15px] italic text-[#94a3b8] cursor-pointer"
        onClick={() => onAdd(employee, date)}
      >
        {t('records.notClockedIn')}
      </button>
    )
  }

  const totalHours = calcTotalHours(attendances)

  return (
    <div className="flex flex-col gap-1">
      {attendances.map(att => (
        <AttendanceCard
          key={att.id}
          attendance={att}
          employee={employee}
          date={date}
          onEdit={onEdit}
        />
      ))}
      {totalHours > 0 && (
        <span className="rounded-md border border-[#7f956a] px-1.5 py-0.5 text-base font-medium text-[#7f956a]">
          {t('records.totalHours')}: {formatTotalHours(totalHours)}
        </span>
      )}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function RecordsTableView({
  dayRows,
  employees,
  onEditRecord,
  onAddRecord,
  todayDate: _todayDate,
}: RecordsTableViewProps) {
  const { t } = useTranslation()
  return (
    <div
      className="overflow-auto rounded-xl border border-[#f1f5f9] shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
      style={{ maxHeight: 'calc(100vh - 280px)' }}
    >
      <table className="border-collapse" style={{ minWidth: '100%' }}>
        <thead>
          <tr className="sticky top-0 z-10">
            {/* Date column header */}
            <th className="sticky left-0 top-0 z-20 w-[140px] min-w-[140px] border-b border-[#f1f5f9] border-r border-r-[#f1f5f9] bg-card px-6 py-4 text-left text-[15px] font-bold text-[#475569]">
              {t('records.dateColumn')}
            </th>
            {/* Employee column headers */}
            {employees.map(emp => (
              <th
                key={emp.id}
                className="sticky top-0 z-10 min-w-[160px] border-b border-[#f1f5f9] bg-card px-6 py-4 text-[15px] font-bold text-[#475569]"
              >
                <div className="flex flex-col items-center gap-1">
                  <AvatarImage avatar={emp.avatar} size={32} />
                  <span>{emp.name}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dayRows.map(row => {
            const hasAttendance = dayRowHasAttendance(row)
            const isWeekendNoAttendance = row.isWeekend && !hasAttendance

            return (
              <tr
                key={row.date}
                data-testid={`row-${row.date}`}
                data-today={row.isToday ? 'true' : undefined}
                className={cn(
                  row.isWeekend && 'bg-[#f8fafc50]',
                  row.isToday && 'bg-primary/5',
                )}
              >
                {/* Date cell - always shown */}
                <td className="sticky left-0 z-[1] w-[140px] min-w-[140px] border-b border-[#f1f5f9] border-r border-r-[#f1f5f9] bg-card px-6 py-5 text-[15px] font-bold text-[#1a202c]">
                  {row.displayDate}
                </td>

                {isWeekendNoAttendance ? (
                  // Weekend without attendance: single merged cell
                  <td
                    colSpan={employees.length}
                    className="border-b border-[#f1f5f9] px-6 py-5 text-center text-[15px] text-[#94a3b8]"
                  >
                    {t('records.weekendLabel')}
                  </td>
                ) : (
                  // Normal cells for each employee
                  row.cells.map(cell => (
                    <td
                      key={cell.employee.id}
                      className="border-b border-[#f1f5f9] px-6 py-5 text-center cursor-pointer"
                      onClick={() => onAddRecord(cell.employee, row.date)}
                    >
                      <CellContent
                        cell={cell}
                        date={row.date}
                        onEdit={onEditRecord}
                        onAdd={onAddRecord}
                      />
                    </td>
                  ))
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
