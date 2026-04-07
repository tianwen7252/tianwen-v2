/**
 * EmployeeCard — individual employee card for the clock-in grid.
 * Displays avatar, name, status badge, clock times, and action buttons.
 */

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { AvatarImage } from '@/components/avatar-image'
// calcTotalHours / formatTotalHours removed — total hours display disabled
import {
  formatTime,
  deriveCardAction,
  deriveStatus,
  deriveBorderColor,
  deriveCardBgClass,
} from './clock-in-utils'
import type { ClockInAction } from '@/components/clock-in-modal'
import type { Employee, Attendance } from '@/lib/schemas'

export interface EmployeeCardProps {
  readonly employee: Employee
  readonly records: readonly Attendance[]
  readonly onCardClick: (
    employee: Employee,
    records: readonly Attendance[],
  ) => void
  readonly onButtonAction: (
    e: React.MouseEvent,
    employee: Employee,
    action: ClockInAction,
    record?: Attendance,
  ) => void
}

export function EmployeeCard({
  employee,
  records,
  onCardClick,
  onButtonAction,
}: EmployeeCardProps) {
  const { t } = useTranslation()
  const { badgeColor, badgeTextKey } = deriveStatus(records)
  const badgeText = t(badgeTextKey)
  const borderColor = deriveBorderColor(records)
  const cardBgClass = deriveCardBgClass(records)
  const lastRecord =
    records.length > 0 ? records[records.length - 1] : undefined
  const isVacation = lastRecord !== undefined && lastRecord.type !== 'regular'
  // const totalHours = calcTotalHours(records)
  const action = deriveCardAction(records)
  const isClockedIn = records.length > 0 && !isVacation && action === 'clockOut'
  const isClockedOut = records.length > 0 && !isVacation && action === 'clockIn'

  return (
    <div
      className={cn(
        'cursor-pointer rounded-xl border border-[#eee] bg-card px-2.5 py-5 text-center flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.08)] ',
        'transition-all ease-in-out duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.95]',
        cardBgClass,
      )}
      data-testid="employee-card"
      role="button"
      tabIndex={0}
      aria-label={`${employee.name} ${t('nav.clockIn')} — ${badgeText}`}
      onClick={() => onCardClick(employee, records)}
      onKeyDown={(e) => e.key === 'Enter' && onCardClick(employee, records)}
    >
      {/* Avatar with colored border */}
      <div className="mx-auto mb-3">
        <div
          className="inline-block rounded-full p-0.5"
          style={{ border: `3px solid ${borderColor}` }}
        >
          <AvatarImage avatar={employee.avatar} size={80} />
        </div>
      </div>

      {/* Name */}
      <div className="text-xl" style={{ color: '#1a202c' }}>
        {employee.name}
      </div>

      {/* Admin label — always rendered for consistent card height */}
      <div
        className="h-5 text-sm text-muted-foreground"
        style={{ color: '#7f956a' }}
      >
        {employee.isAdmin ? t('staff.admin') : ''}
      </div>

      {/* Status badge */}
      <div className="my-2 flex items-center justify-center gap-1.5">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: badgeColor }}
        />
        <span className="text-sm text-muted-foreground">{badgeText}</span>
      </div>

      {/* Clock times */}
      {isVacation ? (
        <div className="space-y-1 text-md" style={{ color: '#718096' }}>
          <div>
            {t('clockIn.vacationLabel')}：{formatTime(lastRecord?.clockIn)}
          </div>
        </div>
      ) : (
        <div className="space-y-1.5 text-md" style={{ color: '#718096' }}>
          {records.map((shift, index) => (
            <div key={shift.id ?? index} className="border-l-2 border-border pl-2">
              <div>
                {t('clockIn.arrival')}：{formatTime(shift.clockIn)}
              </div>
              <div>
                {t('clockIn.departure')}：{formatTime(shift.clockOut)}
              </div>
            </div>
          ))}
          {records.length === 0 && (
            <div className="border-l-2 border-border pl-2">
              <div>
                {t('clockIn.arrival')}：{formatTime(undefined)}
              </div>
              <div>
                {t('clockIn.departure')}：{formatTime(undefined)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-auto pt-3 flex justify-center gap-2">
        {records.length === 0 && (
          <>
            <button
              type="button"
              className="rounded-lg border bg-white text-[#444] px-3 py-1.5 text-sm hover:bg-[#6b8058]"
              onClick={(e) => onButtonAction(e, employee, 'clockIn', undefined)}
            >
              {t('clockIn.clockIn')}
            </button>
            <button
              type="button"
              className="rounded-lg border bg-white text-[#444] px-3 py-1.5 text-sm hover:bg-[#e06868]"
              onClick={(e) =>
                onButtonAction(e, employee, 'vacation', undefined)
              }
            >
              {t('clockIn.applyVacation')}
            </button>
          </>
        )}
        {isClockedIn && (
          <button
            type="button"
            className="rounded-lg border bg-white text-[#444] px-3 py-1.5 text-sm hover:bg-[#6b8058]"
            onClick={(e) => onButtonAction(e, employee, 'clockOut', lastRecord)}
          >
            {t('clockIn.clockOut')}
          </button>
        )}
        {isClockedOut && (
          <button
            type="button"
            className="rounded-lg border bg-white text-[#444] px-3 py-1.5 text-sm hover:bg-[#6b8058]"
            onClick={(e) => onButtonAction(e, employee, 'clockIn', undefined)}
          >
            {t('clockIn.clockIn')}
          </button>
        )}
        {isVacation && (
          <button
            type="button"
            className="rounded-lg border bg-white text-[#444] px-3 py-1.5 text-sm hover:bg-gray-500"
            onClick={(e) =>
              onButtonAction(e, employee, 'cancelVacation', lastRecord)
            }
          >
            {t('clockIn.cancelVacation')}
          </button>
        )}
      </div>
    </div>
  )
}
