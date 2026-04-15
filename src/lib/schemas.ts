/**
 * Zod schemas for all domain models.
 * Single source of truth for validation — used by repositories and forms.
 */

import { z } from 'zod/v4'

// ─── Employee ────────────────────────────────────────────────────────────────

export const employeeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  avatar: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  shiftType: z.enum(['regular', 'shift']).default('regular'),
  employeeNo: z.string().optional(),
  isAdmin: z.boolean().default(false),
  isDefaultOrderStaff: z.boolean().default(false),
  hireDate: z.string().optional(),
  resignationDate: z.string().optional(),
  /** Google OAuth subject identifier — set when the employee binds their Google account. */
  googleSub: z.string().optional(),
  /** Google account email — set when the employee binds their Google account. */
  googleEmail: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const createEmployeeSchema = employeeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type Employee = z.infer<typeof employeeSchema>
export type CreateEmployee = z.infer<typeof createEmployeeSchema>

// ─── Attendance ──────────────────────────────────────────────────────────────

export const attendanceTypeEnum = z.enum([
  'regular',
  'paid_leave',
  'sick_leave',
  'personal_leave',
  'absent',
])

export const attendanceSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  date: z.string(),
  clockIn: z.number().optional(),
  clockOut: z.number().optional(),
  type: attendanceTypeEnum.default('regular'),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const createAttendanceSchema = attendanceSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type AttendanceType = z.infer<typeof attendanceTypeEnum>
export type Attendance = z.infer<typeof attendanceSchema>
export type CreateAttendance = z.infer<typeof createAttendanceSchema>

// ─── Commodity ───────────────────────────────────────────────────────────────

export const commodityTypeSchema = z.object({
  id: z.string(),
  typeId: z.string(),
  type: z.string(),
  label: z.string(),
  color: z.string().default(''),
  priority: z.number().default(0),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const createCommodityTypeSchema = commodityTypeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const commoditySchema = z.object({
  id: z.string(),
  typeId: z.string(),
  name: z.string().min(1),
  image: z.string().optional(),
  price: z.number().min(0),
  priority: z.number().default(0),
  onMarket: z.boolean().default(true),
  hideOnMode: z.string().optional(),
  editor: z.string().optional(),
  includesSoup: z.boolean().default(false),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const createCommoditySchema = commoditySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type CommodityType = z.infer<typeof commodityTypeSchema>
export type CreateCommodityType = z.infer<typeof createCommodityTypeSchema>
export type Commodity = z.infer<typeof commoditySchema>
export type CreateCommodity = z.infer<typeof createCommoditySchema>

// ─── OrderType ──────────────────────────────────────────────────────────────

export const orderTypeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  priority: z.number(),
  type: z.string().default('order'),
  color: z.string().optional(),
  editor: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const createOrderTypeSchema = orderTypeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type OrderType = z.infer<typeof orderTypeSchema>
export type CreateOrderType = z.infer<typeof createOrderTypeSchema>

// ─── OrderItem ───────────────────────────────────────────────────────────────
// Defined before Order so it can be referenced in orderSchema directly.

export const orderItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  commodityId: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().int().min(1),
  includesSoup: z.boolean().default(false),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const createOrderItemSchema = orderItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type OrderItem = z.infer<typeof orderItemSchema>
export type CreateOrderItem = z.infer<typeof createOrderItemSchema>

// ─── OrderDiscount ───────────────────────────────────────────────────────────
// Defined before Order so it can be referenced in orderSchema directly.

export const orderDiscountSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  label: z.string(),
  amount: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const createOrderDiscountSchema = orderDiscountSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type OrderDiscount = z.infer<typeof orderDiscountSchema>
export type CreateOrderDiscount = z.infer<typeof createOrderDiscountSchema>

// ─── Order ───────────────────────────────────────────────────────────────────

export const orderSchema = z.object({
  id: z.string(),
  number: z.number(),
  memo: z.array(z.string()),
  soups: z.number().default(0),
  total: z.number().default(0),
  originalTotal: z.number().optional(),
  editedMemo: z.string().optional(),
  editor: z.string().default(''),
  isServed: z.boolean().default(false),
  orderStaffId: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  // Normalized items and discounts — populated on read, empty array for old orders
  items: z.array(orderItemSchema).default([]),
  discounts: z.array(orderDiscountSchema).default([]),
})

// NewOrderItem — for creating an item without an orderId (orderId is assigned at creation time)
export const newOrderItemSchema = z.object({
  commodityId: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().int().min(1),
  includesSoup: z.boolean().default(false),
})

// NewOrderDiscount — for creating a discount without an orderId
export const newOrderDiscountSchema = z.object({
  label: z.string(),
  amount: z.number(),
})

export const createOrderSchema = z.object({
  number: z.number(),
  items: z.array(newOrderItemSchema).default([]),
  discounts: z.array(newOrderDiscountSchema).default([]),
  memo: z.array(z.string()),
  soups: z.number(),
  total: z.number(),
  originalTotal: z.number().optional(),
  editedMemo: z.string().optional(),
  editor: z.string(),
  orderStaffId: z.string().optional(),
})

export type Order = z.infer<typeof orderSchema>
export type CreateOrder = z.infer<typeof createOrderSchema>
export type NewOrderItem = z.infer<typeof newOrderItemSchema>
export type NewOrderDiscount = z.infer<typeof newOrderDiscountSchema>

// ─── CustomOrderName ────────────────────────────────────────────────────────

export const customOrderNameSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const createCustomOrderNameSchema = customOrderNameSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type CustomOrderName = z.infer<typeof customOrderNameSchema>
export type CreateCustomOrderName = z.infer<typeof createCustomOrderNameSchema>

// ─── ErrorLog ───────────────────────────────────────────────────────────────

export const errorLogSchema = z.object({
  id: z.string(),
  message: z.string(),
  source: z.string(),
  stack: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export type ErrorLog = z.infer<typeof errorLogSchema>

// ─── BackupLog ─────────────────────────────────────────────────────────────

export const backupLogTypeEnum = z.enum(['manual', 'auto', 'v1-import'])
export const backupLogStatusEnum = z.enum(['success', 'failed'])

export const backupLogSchema = z.object({
  id: z.string(),
  type: backupLogTypeEnum,
  status: backupLogStatusEnum,
  filename: z.string().nullable(),
  size: z.number().default(0),
  durationMs: z.number().default(0),
  errorMessage: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export type BackupLog = z.infer<typeof backupLogSchema>
export type BackupLogType = z.infer<typeof backupLogTypeEnum>
export type BackupLogStatus = z.infer<typeof backupLogStatusEnum>

// ─── DailyData ───────────────────────────────────────────────────────────────

export const dailyDataSchema = z.object({
  id: z.string(),
  date: z.string(),
  total: z.number().default(0),
  originalTotal: z.number().default(0),
  createdAt: z.number(),
  updatedAt: z.number(),
  editor: z.string().default(''),
})

export type DailyData = z.infer<typeof dailyDataSchema>

// ─── PriceChangeLog ─────────────────────────────────────────────────────────

export const priceChangeLogSchema = z.object({
  id: z.string(),
  commodityId: z.string(),
  commodityName: z.string(),
  oldPrice: z.number(),
  newPrice: z.number(),
  editor: z.string().default(''),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export type PriceChangeLog = z.infer<typeof priceChangeLogSchema>

// ─── ShiftCheckout ─────────────────────────────────────────────────────────

export const shiftTypeEnum = z.enum(['morning', 'evening'])

export const shiftCheckoutSchema = z.object({
  id: z.string(),
  date: z.string(),
  shift: shiftTypeEnum,
  orderStaffId: z.string().optional(),
  orderStaffName: z.string().default(''),
  checkoutAt: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const createShiftCheckoutSchema = shiftCheckoutSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type ShiftType = z.infer<typeof shiftTypeEnum>
export type ShiftCheckout = z.infer<typeof shiftCheckoutSchema>
export type CreateShiftCheckout = z.infer<typeof createShiftCheckoutSchema>
