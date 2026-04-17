/**
 * Mock repository implementations for testing.
 * Provides in-memory CRUD backed by seed data arrays,
 * with the same async method signatures as real SQLite repositories.
 */

import { nanoid } from 'nanoid'
import dayjs from 'dayjs'
import {
  DEFAULT_EMPLOYEES,
  DEFAULT_COMMODITY_TYPES,
  DEFAULT_COMMODITIES,
  DEFAULT_ORDER_TYPES,
} from '@/lib/default-data'
import type {
  Employee,
  CreateEmployee,
  Attendance,
  CreateAttendance,
  CommodityType,
  CreateCommodityType,
  Commodity,
  CreateCommodity,
  OrderType,
  CreateOrderType,
  PriceChangeLog,
} from '@/lib/schemas'
import type {
  StatisticsRepository,
  ProductKpis,
  DateRange,
} from '@/lib/repositories/statistics-repository'

// ─── Test attendance patterns ──────────────────────────────────────────────

/**
 * Build sample attendance records for today (based on current Date.now()).
 * Used by tests that rely on attendance state (clocked-in, vacation, etc.).
 * Returns a new array on each call (immutable).
 */
function buildTestAttendances(): readonly Attendance[] {
  const today = dayjs().format('YYYY-MM-DD')
  const base = dayjs(today)
  return [
    // Alex: clocked in at 08:00, clocked out at 17:00
    {
      id: 'att-001',
      employeeId: 'emp-001',
      date: today,
      clockIn: base.hour(8).minute(0).valueOf(),
      clockOut: base.hour(17).minute(0).valueOf(),
      type: 'regular' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    // Mia: clocked in at 09:00, still working
    {
      id: 'att-002',
      employeeId: 'emp-002',
      date: today,
      clockIn: base.hour(9).minute(0).valueOf(),
      type: 'regular' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    // David: on paid leave
    {
      id: 'att-003',
      employeeId: 'emp-003',
      date: today,
      clockIn: base.hour(8).minute(0).valueOf(),
      type: 'paid_leave' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    // Jason: clocked in at 10:00, clocked out at 14:30
    {
      id: 'att-004',
      employeeId: 'emp-006',
      date: today,
      clockIn: base.hour(10).minute(0).valueOf(),
      clockOut: base.hour(14).minute(30).valueOf(),
      type: 'regular' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]
}

// ─── In-memory state ───────────────────────────────────────────────────────

let employees: Employee[] = []
let attendances: Attendance[] = []
let commodityTypes: CommodityType[] = []
let commodities: Commodity[] = []
let orderTypes: OrderType[] = []
let priceChangeLogs: PriceChangeLog[] = []

function resetState(): void {
  employees = DEFAULT_EMPLOYEES.map(e => ({ ...e }))
  attendances = [...buildTestAttendances()]
  commodityTypes = DEFAULT_COMMODITY_TYPES.map(ct => ({ ...ct }))
  commodities = DEFAULT_COMMODITIES.filter(c => c.onMarket).map(c => ({ ...c }))
  orderTypes = DEFAULT_ORDER_TYPES.map(ot => ({ ...ot }))
  priceChangeLogs = []
}

// Initialize on load
resetState()

// ─── Mock Employee Repository ──────────────────────────────────────────────

export const mockEmployeeRepo = {
  async findAll(): Promise<Employee[]> {
    return [...employees]
  },

  async findById(id: string): Promise<Employee | undefined> {
    return employees.find(e => e.id === id)
  },

  async findByStatus(status: 'active' | 'inactive'): Promise<Employee[]> {
    return employees.filter(e => e.status === status)
  },

  async findByEmployeeNo(employeeNo: string): Promise<Employee | undefined> {
    return employees.find(e => e.employeeNo === employeeNo)
  },

  async create(data: CreateEmployee): Promise<Employee> {
    const now = Date.now()
    const newEmployee: Employee = {
      ...data,
      id: nanoid(),
      createdAt: now,
      updatedAt: now,
    }
    employees = [...employees, newEmployee]
    return newEmployee
  },

  async update(
    id: string,
    data: Partial<CreateEmployee>,
  ): Promise<Employee | undefined> {
    const index = employees.findIndex(e => e.id === id)
    if (index === -1) return undefined

    const updated: Employee = {
      ...employees[index]!,
      ...data,
      updatedAt: Date.now(),
    }
    employees = employees.map((e, i) => (i === index ? updated : e))
    return updated
  },

  async remove(id: string): Promise<boolean> {
    const before = employees.length
    employees = employees.filter(e => e.id !== id)
    return employees.length < before
  },

  async bindGoogleAccount(
    employeeId: string,
    googleSub: string,
    googleEmail: string,
  ): Promise<Employee | undefined> {
    const index = employees.findIndex(e => e.id === employeeId)
    if (index === -1) return undefined

    const updated: Employee = {
      ...employees[index]!,
      googleSub,
      googleEmail,
      updatedAt: Date.now(),
    }
    employees = employees.map((e, i) => (i === index ? updated : e))
    return updated
  },

  async unbindGoogleAccount(employeeId: string): Promise<Employee | undefined> {
    const index = employees.findIndex(e => e.id === employeeId)
    if (index === -1) return undefined

    const updated: Employee = {
      ...employees[index]!,
      googleSub: undefined,
      googleEmail: undefined,
      updatedAt: Date.now(),
    }
    employees = employees.map((e, i) => (i === index ? updated : e))
    return updated
  },
}

// ─── Mock Attendance Repository ────────────────────────────────────────────

export const mockAttendanceRepo = {
  async findAll(): Promise<Attendance[]> {
    return [...attendances]
  },

  async findById(id: string): Promise<Attendance | undefined> {
    return attendances.find(a => a.id === id)
  },

  async findByEmployeeId(employeeId: string): Promise<Attendance[]> {
    return attendances.filter(a => a.employeeId === employeeId)
  },

  async findByDate(date: string): Promise<Attendance[]> {
    return attendances.filter(a => a.date === date)
  },

  async findByEmployeeAndDate(
    employeeId: string,
    date: string,
  ): Promise<Attendance | undefined> {
    return attendances.find(a => a.employeeId === employeeId && a.date === date)
  },

  async findByMonth(year: number, month: number): Promise<Attendance[]> {
    const prefix = `${year}-${String(month).padStart(2, '0')}`
    return attendances.filter(a => a.date.startsWith(prefix))
  },

  async create(data: CreateAttendance): Promise<Attendance> {
    const now = Date.now()
    const newAttendance: Attendance = {
      ...data,
      id: nanoid(),
      createdAt: now,
      updatedAt: now,
    }
    attendances = [...attendances, newAttendance]
    return newAttendance
  },

  async update(
    id: string,
    data: Partial<Pick<Attendance, 'clockIn' | 'clockOut' | 'type'>>,
  ): Promise<Attendance | undefined> {
    const index = attendances.findIndex(a => a.id === id)
    if (index === -1) return undefined

    const updated: Attendance = {
      ...attendances[index]!,
      ...data,
    }
    attendances = attendances.map((a, i) => (i === index ? updated : a))
    return updated
  },

  async remove(id: string): Promise<boolean> {
    const before = attendances.length
    attendances = attendances.filter(a => a.id !== id)
    return attendances.length < before
  },
}

// ─── Mock CommodityType Repository ────────────────────────────────────────

export const mockCommodityTypeRepo = {
  async findAll(): Promise<CommodityType[]> {
    return [...commodityTypes].sort((a, b) => a.priority - b.priority)
  },

  async findById(id: string): Promise<CommodityType | undefined> {
    return commodityTypes.find(ct => ct.id === id)
  },

  async findByTypeId(typeId: string): Promise<CommodityType | undefined> {
    return commodityTypes.find(ct => ct.typeId === typeId)
  },

  async create(data: CreateCommodityType): Promise<CommodityType> {
    const now = Date.now()
    const newType: CommodityType = {
      ...data,
      id: nanoid(),
      createdAt: now,
      updatedAt: now,
    }
    commodityTypes = [...commodityTypes, newType]
    return newType
  },

  async update(
    id: string,
    data: Partial<CreateCommodityType>,
  ): Promise<CommodityType | undefined> {
    const index = commodityTypes.findIndex(ct => ct.id === id)
    if (index === -1) return undefined

    const updated: CommodityType = {
      ...commodityTypes[index]!,
      ...data,
      updatedAt: Date.now(),
    }
    commodityTypes = commodityTypes.map((ct, i) => (i === index ? updated : ct))
    return updated
  },

  async remove(id: string): Promise<boolean> {
    const before = commodityTypes.length
    commodityTypes = commodityTypes.filter(ct => ct.id !== id)
    return commodityTypes.length < before
  },

  async updatePriorities(ids: string[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      const idx = commodityTypes.findIndex(ct => ct.id === ids[i])
      if (idx !== -1) {
        commodityTypes = commodityTypes.map((ct, j) =>
          j === idx ? { ...ct, priority: i + 1, updatedAt: Date.now() } : ct,
        )
      }
    }
  },
}

// ─── Mock Commodity Repository ────────────────────────────────────────────

export const mockCommodityRepo = {
  async findAll(): Promise<Commodity[]> {
    return [...commodities].sort((a, b) => a.priority - b.priority)
  },

  async findByTypeId(typeId: string): Promise<Commodity[]> {
    return commodities
      .filter(c => c.typeId === typeId && c.onMarket)
      .sort((a, b) => a.priority - b.priority)
  },

  async findById(id: string): Promise<Commodity | undefined> {
    return commodities.find(c => c.id === id)
  },

  async findOnMarket(): Promise<Commodity[]> {
    return commodities
      .filter(c => c.onMarket)
      .sort((a, b) => a.priority - b.priority)
  },

  async create(data: CreateCommodity): Promise<Commodity> {
    const now = Date.now()
    const newCommodity: Commodity = {
      ...data,
      id: nanoid(),
      createdAt: now,
      updatedAt: now,
    }
    commodities = [...commodities, newCommodity]
    return newCommodity
  },

  async update(
    id: string,
    data: Partial<CreateCommodity>,
  ): Promise<Commodity | undefined> {
    const index = commodities.findIndex(c => c.id === id)
    if (index === -1) return undefined

    const updated: Commodity = {
      ...commodities[index]!,
      ...data,
      updatedAt: Date.now(),
    }
    commodities = commodities.map((c, i) => (i === index ? updated : c))
    return updated
  },

  async remove(id: string): Promise<boolean> {
    const before = commodities.length
    commodities = commodities.filter(c => c.id !== id)
    return commodities.length < before
  },

  async updatePriorities(ids: string[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      const idx = commodities.findIndex(c => c.id === ids[i])
      if (idx !== -1) {
        commodities = commodities.map((c, j) =>
          j === idx ? { ...c, priority: i + 1, updatedAt: Date.now() } : c,
        )
      }
    }
  },
}

// ─── Mock OrderType Repository ───────────────────────────────────────────

export const mockOrderTypeRepo = {
  async findAll(): Promise<OrderType[]> {
    return [...orderTypes].sort((a, b) => a.priority - b.priority)
  },

  async findById(id: string): Promise<OrderType | undefined> {
    return orderTypes.find(ot => ot.id === id)
  },

  async create(data: CreateOrderType): Promise<OrderType> {
    const now = Date.now()
    const newOrderType: OrderType = {
      ...data,
      id: nanoid(),
      createdAt: now,
      updatedAt: now,
    }
    orderTypes = [...orderTypes, newOrderType]
    return newOrderType
  },

  async update(
    id: string,
    data: Partial<CreateOrderType>,
  ): Promise<OrderType | undefined> {
    const index = orderTypes.findIndex(ot => ot.id === id)
    if (index === -1) return undefined

    const updated: OrderType = {
      ...orderTypes[index]!,
      ...data,
      updatedAt: Date.now(),
    }
    orderTypes = orderTypes.map((ot, i) => (i === index ? updated : ot))
    return updated
  },

  async remove(id: string): Promise<boolean> {
    const before = orderTypes.length
    orderTypes = orderTypes.filter(ot => ot.id !== id)
    return orderTypes.length < before
  },

  async updatePriorities(ids: string[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      const idx = orderTypes.findIndex(ot => ot.id === ids[i])
      if (idx !== -1) {
        orderTypes = orderTypes.map((ot, j) =>
          j === idx ? { ...ot, priority: i + 1, updatedAt: Date.now() } : ot,
        )
      }
    }
  },
}

// ─── Mock PriceChangeLog Repository ─────────────────────────────────────────

export const mockPriceChangeLogRepo = {
  async findAll(limit = 20, offset = 0): Promise<PriceChangeLog[]> {
    const sorted = [...priceChangeLogs].sort(
      (a, b) => b.createdAt - a.createdAt,
    )
    return sorted.slice(offset, offset + limit)
  },

  async count(): Promise<number> {
    return priceChangeLogs.length
  },

  async create(data: {
    commodityId: string
    commodityName: string
    oldPrice: number
    newPrice: number
    editor?: string
  }): Promise<PriceChangeLog> {
    const now = Date.now()
    const newLog: PriceChangeLog = {
      id: nanoid(),
      commodityId: data.commodityId,
      commodityName: data.commodityName,
      oldPrice: data.oldPrice,
      newPrice: data.newPrice,
      editor: data.editor ?? '',
      createdAt: now,
      updatedAt: now,
    }
    priceChangeLogs = [...priceChangeLogs, newLog]
    return newLog
  },
}

// ─── Reset helper for tests ────────────────────────────────────────────────

export function resetMockRepositories(): void {
  resetState()
}

// ─── Mock Statistics Repository ────────────────────────────────────────────

const ZERO_PRODUCT_KPIS: ProductKpis = {
  totalRevenue: 0,
  orderCount: 0,
  stallRevenue: 0,
  morningRevenue: 0,
  afternoonRevenue: 0,
  totalQuantity: 0,
}

export const mockStatisticsRepo: StatisticsRepository = {
  async getProductKpis(_range: DateRange): Promise<ProductKpis> {
    return { ...ZERO_PRODUCT_KPIS }
  },
  async getHourlyOrderDistribution(_range: DateRange) {
    return []
  },
  async getTopProducts(
    _range: DateRange,
    _limit: number,
    _orderBy: 'quantity' | 'revenue',
  ) {
    return []
  },
  async getBottomBentos(_range: DateRange, _limit: number) {
    return []
  },
  async getDailyRevenue(_range: DateRange) {
    return []
  },
  async getAvgOrderValue(_range: DateRange) {
    return []
  },
  async getProductDailyRevenue(_range: DateRange, _commodityId: string) {
    return []
  },
  async getStaffKpis(_range: DateRange) {
    return {
      activeEmployeeCount: 0,
      totalAttendanceDays: 0,
      avgMonthlyHours: 0,
      leaveCount: 0,
    }
  },
  async getEmployeeHours(_range: DateRange) {
    return []
  },
  async getDailyHeadcount(_range: DateRange) {
    return []
  },
  async getDailyAttendeeList(_date: string) {
    return []
  },
  async getAmPmRevenue(_range: DateRange) {
    return []
  },
  async getCategorySales(_range: DateRange, _typeId: string) {
    return []
  },
  async getOrderNotesDistribution(_range: DateRange) {
    return []
  },
  async getDeliveryProductBreakdown(_range: DateRange, _memoTag?: string) {
    return []
  },
}

// ─── Provider mock functions ───────────────────────────────────────────────

export function getEmployeeRepo() {
  return mockEmployeeRepo
}

export function getAttendanceRepo() {
  return mockAttendanceRepo
}

export function getCommodityTypeRepo() {
  return mockCommodityTypeRepo
}

export function getCommodityRepo() {
  return mockCommodityRepo
}

export function getOrderTypeRepo() {
  return mockOrderTypeRepo
}

export function getPriceChangeLogRepo() {
  return mockPriceChangeLogRepo
}

export function getStatisticsRepo() {
  return mockStatisticsRepo
}
