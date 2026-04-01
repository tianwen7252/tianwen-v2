/**
 * EmployeeRow — single row in the employee management table.
 * Shows employee number with status tags, avatar+name, dates, shift, and actions.
 * Admins see a "Link Google" button for employees without a linked Google account,
 * and an "Unlink" button for employees with a linked account.
 */

import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import { AvatarImage } from '@/components/avatar-image'
import { RippleButton } from '@/components/ui/ripple-button'
import { SHIFT_LABEL_MAP } from './staff-admin.types'
import type { Employee } from '@/lib/schemas'

export interface EmployeeRowProps {
  readonly employee: Employee
  readonly isCurrentUserAdmin: boolean
  readonly onEdit: (employee: Employee) => void
  readonly onDelete: (employee: Employee) => void
  readonly onLinkGoogle: (employee: Employee) => void
  readonly onUnlinkGoogle: (employee: Employee) => void
}

export function EmployeeRow({
  employee,
  isCurrentUserAdmin,
  onEdit,
  onDelete,
  onLinkGoogle,
  onUnlinkGoogle,
}: EmployeeRowProps) {
  const { t } = useTranslation()
  const shiftLabel =
    SHIFT_LABEL_MAP.get(employee.shiftType) ?? employee.shiftType
  const isGoogleLinked = employee.googleSub != null

  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-muted/30">
      {/* Employee number with tags */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-md">{employee.employeeNo}</span>
          {employee.isAdmin && (
            <span className="w-fit rounded-md bg-amber-100 px-1.5 py-0.5 text-md text-amber-800">
              {t('staff.admin')}
            </span>
          )}
          {isGoogleLinked && (
            <span className="w-fit rounded-md bg-blue-100 px-1.5 py-0.5 text-md text-blue-800">
              {t('staff.googleLinked')}
            </span>
          )}
          {employee.status === 'inactive' && (
            <span className="w-fit rounded-md bg-red-100 px-1.5 py-0.5 text-md text-red-800">
              {t('staff.resigned')}
            </span>
          )}
        </div>
      </td>

      {/* Avatar + name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <AvatarImage avatar={employee.avatar} size={32} />
          <span className="text-md text-foreground">{employee.name}</span>
        </div>
      </td>

      {/* Hire date */}
      <td className="px-4 py-3 text-muted-foreground">
        {employee.hireDate ?? '-'}
      </td>

      {/* Resignation date */}
      <td className="px-4 py-3 text-muted-foreground">
        {employee.resignationDate ?? '-'}
      </td>

      {/* Shift type */}
      <td className="px-4 py-3">
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-md text-muted-foreground">
          {shiftLabel}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-label={t('common.edit')}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={() => onEdit(employee)}
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            aria-label={t('common.delete')}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
            onClick={() => onDelete(employee)}
          >
            <Trash2 size={16} />
          </button>
          {isCurrentUserAdmin && !isGoogleLinked && (
            <RippleButton
              className="rounded-lg bg-muted px-2.5 py-1 text-md text-muted-foreground hover:bg-accent hover:text-foreground"
              rippleColor="rgba(0, 0, 0, 0.08)"
              onClick={() => onLinkGoogle(employee)}
            >
              {t('staff.linkGoogle')}
            </RippleButton>
          )}
          {isCurrentUserAdmin && isGoogleLinked && (
            <RippleButton
              className="rounded-lg bg-muted px-2.5 py-1 text-md text-red-500 hover:bg-red-50 hover:text-red-600"
              rippleColor="rgba(0, 0, 0, 0.08)"
              onClick={() => onUnlinkGoogle(employee)}
            >
              {t('staff.unlinkGoogle')}
            </RippleButton>
          )}
        </div>
      </td>
    </tr>
  )
}
