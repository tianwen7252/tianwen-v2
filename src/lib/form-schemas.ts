/**
 * Zod schemas for form validation.
 * Used with React Hook Form + zodResolver for type-safe form handling.
 */

import { z } from 'zod/v4'

// ─── Employee Form ──────────────────────────────────────────────────────────

export const employeeFormSchema = z.object({
  name: z.string().min(1, '請輸入員工姓名'),
  avatar: z.string().default(''),
  shiftType: z.enum(['regular', 'shift']).default('regular'),
  isAdmin: z.boolean().default(false),
  isDefaultOrderStaff: z.boolean().default(false),
  hireDate: z.string().default(''),
  resignationDate: z.string().default(''),
})

export type EmployeeFormValues = z.input<typeof employeeFormSchema>

// ─── Record (Attendance) Form ───────────────────────────────────────────────

export const recordFormSchema = z
  .object({
    attendanceType: z.enum(['regular', 'vacation']).default('regular'),
    clockInTime: z.string().default(''),
    clockOutTime: z.string().default(''),
  })
  .refine(
    data => {
      // Skip validation for vacation type
      if (data.attendanceType === 'vacation') return true
      // Skip if either time is missing
      if (!data.clockInTime || !data.clockOutTime) return true
      // clockOut must be strictly after clockIn
      return data.clockOutTime > data.clockInTime
    },
    { message: '下班時間必須晚於上班時間', path: ['clockOutTime'] },
  )

export type RecordFormValues = z.input<typeof recordFormSchema>

// ─── Commodity Form ────────────────────────────────────────────────────────

export const commodityFormSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0),
  includesSoup: z.boolean().default(false),
})

export type CommodityFormValues = z.input<typeof commodityFormSchema>

// ─── Order Type Form ───────────────────────────────────────────────────────

export const orderTypeFormSchema = z.object({
  name: z.string().min(1),
  color: z.string().default(''),
})

export type OrderTypeFormValues = z.input<typeof orderTypeFormSchema>
