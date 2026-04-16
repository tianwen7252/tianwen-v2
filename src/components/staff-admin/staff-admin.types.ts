/**
 * Shared types and constants for the StaffAdmin feature components.
 */

import type { Employee } from '@/lib/schemas'
import { SHIFT_TYPES } from '@/constants/shift-types'
import type { EmployeeFormValues } from '@/lib/form-schemas'

// ─── Constants ───────────────────────────────────────────────────────────────

/** Default values for the employee form. */
export const DEFAULT_VALUES: EmployeeFormValues = {
  name: '',
  avatar: '',
  shiftType: 'regular',
  isAdmin: false,
  isDefaultOrderStaff: false,
  hireDate: '',
  resignationDate: '',
}

/**
 * Builds the shift type label lookup map from SHIFT_TYPES constants.
 */
function buildShiftLabelMap(): ReadonlyMap<string, string> {
  return new Map(SHIFT_TYPES.map(s => [s.key, s.label]))
}

export const SHIFT_LABEL_MAP = buildShiftLabelMap()

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert an Employee entity to form values for editing.
 */
export function employeeToFormValues(employee: Employee): EmployeeFormValues {
  return {
    name: employee.name,
    avatar: employee.avatar ?? '',
    shiftType: (employee.shiftType as 'regular' | 'shift') ?? 'regular',
    isAdmin: employee.isAdmin,
    isDefaultOrderStaff: employee.isDefaultOrderStaff,
    hireDate: employee.hireDate ?? '',
    resignationDate: employee.resignationDate ?? '',
  }
}
