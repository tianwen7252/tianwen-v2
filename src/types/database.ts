/**
 * Database domain models — shared types for all DB-related operations.
 * These mirror the SQL schema in src/lib/schema.ts.
 */

export interface CommodityType {
  readonly id: string
  readonly typeId: string
  readonly type: string
  readonly label: string
  readonly color: string
  readonly createdAt: number
  readonly updatedAt: number
}

export interface Commodity {
  readonly id: string
  readonly typeId: string
  readonly name: string
  readonly price: number
  readonly priority: number
  readonly onMarket: boolean
  readonly hideOnMode?: string
  readonly editor?: string
  readonly createdAt: number
  readonly updatedAt: number
}

export interface Order {
  readonly id: string
  readonly number: number
  readonly memo: readonly string[]
  readonly soups: number
  readonly total: number
  readonly originalTotal?: number
  readonly editedMemo?: string
  readonly editor: string
  readonly createdAt: number
  readonly updatedAt: number
}

export interface OrderType {
  readonly id: string
  readonly name: string
  readonly priority: number
  readonly type: 'meal' | 'order'
  readonly color?: string
  readonly createdAt: number
  readonly updatedAt: number
  readonly editor?: string
}

export interface DailyData {
  readonly id: string
  readonly date: string
  readonly total: number
  readonly originalTotal: number
  readonly createdAt: number
  readonly updatedAt: number
  readonly editor: string
}

export interface Employee {
  readonly id: string
  readonly name: string
  readonly avatar?: string
  readonly status: 'active' | 'inactive'
  readonly shiftType: 'regular' | 'shift'
  readonly employeeNo?: string
  readonly isAdmin: boolean
  readonly hireDate?: string
  readonly resignationDate?: string
  readonly createdAt: number
  readonly updatedAt: number
}

export type AttendanceType =
  | 'regular'
  | 'paid_leave'
  | 'sick_leave'
  | 'personal_leave'
  | 'absent'

export interface Attendance {
  readonly id: string
  readonly employeeId: string
  readonly date: string
  readonly clockIn?: number
  readonly clockOut?: number
  readonly type: AttendanceType
}
