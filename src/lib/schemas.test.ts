import { describe, it, expect } from 'vitest'
import {
  employeeSchema,
  createEmployeeSchema,
  attendanceSchema,
  createAttendanceSchema,
  commoditySchema,
  orderSchema,
  dailyDataSchema,
  orderTypeSchema,
  createOrderTypeSchema,
  priceChangeLogSchema,
} from './schemas'

describe('schemas', () => {
  describe('employeeSchema', () => {
    it('should validate a complete employee', () => {
      const result = employeeSchema.safeParse({
        id: 'emp-001',
        name: 'Alex',
        status: 'active',
        shiftType: 'regular',
        isAdmin: true,
        employeeNo: '001',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const result = employeeSchema.safeParse({
        id: 'emp-001',
        name: '',
        status: 'active',
        shiftType: 'regular',
        isAdmin: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid status', () => {
      const result = employeeSchema.safeParse({
        id: 'emp-001',
        name: 'Alex',
        status: 'unknown',
        shiftType: 'regular',
        isAdmin: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('createEmployeeSchema', () => {
    it('should not require id, createdAt, updatedAt', () => {
      const result = createEmployeeSchema.safeParse({
        name: 'New Employee',
        status: 'active',
        shiftType: 'regular',
        isAdmin: false,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('attendanceSchema', () => {
    it('should validate attendance with clock times', () => {
      const result = attendanceSchema.safeParse({
        id: 'att-001',
        employeeId: 'emp-001',
        date: '2026-03-21',
        clockIn: 1711000000000,
        clockOut: 1711032000000,
        type: 'regular',
      })
      expect(result.success).toBe(true)
    })

    it('should validate vacation type', () => {
      const result = attendanceSchema.safeParse({
        id: 'att-002',
        employeeId: 'emp-001',
        date: '2026-03-21',
        type: 'paid_leave',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('createAttendanceSchema', () => {
    it('should not require id', () => {
      const result = createAttendanceSchema.safeParse({
        employeeId: 'emp-001',
        date: '2026-03-21',
        clockIn: Date.now(),
        type: 'regular',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('commoditySchema', () => {
    it('should validate a product', () => {
      const result = commoditySchema.safeParse({
        id: 'com-001',
        typeId: 'main-dish',
        name: '炒飯',
        price: 80,
        priority: 1,
        onMarket: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      expect(result.success).toBe(true)
    })

    it('should reject negative price', () => {
      const result = commoditySchema.safeParse({
        id: 'com-001',
        typeId: 'main-dish',
        name: '炒飯',
        price: -10,
        priority: 1,
        onMarket: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('orderSchema', () => {
    it('should validate an order', () => {
      const result = orderSchema.safeParse({
        id: 'ord-001',
        number: 1,
        memo: [],
        soups: 0,
        total: 80,
        editor: 'admin',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      expect(result.success).toBe(true)
    })
  })

  describe('dailyDataSchema', () => {
    it('should validate daily data', () => {
      const result = dailyDataSchema.safeParse({
        id: 'dd-001',
        date: '2026-03-21',
        total: 5000,
        originalTotal: 5200,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        editor: 'system',
      })
      expect(result.success).toBe(true)
    })
  })

  // ─── orderTypeSchema ─────────────────────────────────────────────────────

  describe('orderTypeSchema', () => {
    it('parses a valid full order type object', () => {
      const input = {
        id: 'ot-001',
        name: '攤位',
        priority: 1,
        type: 'order',
        color: 'green',
        editor: 'admin',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      }

      const result = orderTypeSchema.parse(input)

      expect(result).toEqual(input)
    })

    it('applies default type "order" when type is omitted', () => {
      const input = {
        id: 'ot-001',
        name: '攤位',
        priority: 1,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      }

      const result = orderTypeSchema.parse(input)

      expect(result.type).toBe('order')
    })

    it('allows optional color field (undefined)', () => {
      const input = {
        id: 'ot-001',
        name: '攤位',
        priority: 1,
        type: 'order',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      }

      const result = orderTypeSchema.parse(input)

      expect(result.color).toBeUndefined()
    })

    it('allows optional editor field (undefined)', () => {
      const input = {
        id: 'ot-001',
        name: '攤位',
        priority: 1,
        type: 'order',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      }

      const result = orderTypeSchema.parse(input)

      expect(result.editor).toBeUndefined()
    })

    it('rejects empty name', () => {
      const input = {
        id: 'ot-001',
        name: '',
        priority: 1,
        type: 'order',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      }

      expect(() => orderTypeSchema.parse(input)).toThrow()
    })

    it('requires id field', () => {
      const input = {
        name: '攤位',
        priority: 1,
        type: 'order',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      }

      expect(() => orderTypeSchema.parse(input)).toThrow()
    })

    it('requires createdAt field', () => {
      const input = {
        id: 'ot-001',
        name: '攤位',
        priority: 1,
        type: 'order',
        updatedAt: 1700000000000,
      }

      expect(() => orderTypeSchema.parse(input)).toThrow()
    })

    it('requires updatedAt field', () => {
      const input = {
        id: 'ot-001',
        name: '攤位',
        priority: 1,
        type: 'order',
        createdAt: 1700000000000,
      }

      expect(() => orderTypeSchema.parse(input)).toThrow()
    })
  })

  // ─── createOrderTypeSchema ───────────────────────────────────────────────

  describe('createOrderTypeSchema', () => {
    it('parses valid create data without id, createdAt, updatedAt', () => {
      const input = {
        name: '攤位',
        priority: 1,
        type: 'order',
        color: 'green',
      }

      const result = createOrderTypeSchema.parse(input)

      expect(result.name).toBe('攤位')
      expect(result.priority).toBe(1)
      expect(result.type).toBe('order')
      expect(result.color).toBe('green')
    })

    it('omits id from create schema', () => {
      const input = {
        id: 'ot-001',
        name: '攤位',
        priority: 1,
        type: 'order',
      }

      const result = createOrderTypeSchema.parse(input)
      expect((result as Record<string, unknown>)['id']).toBeUndefined()
    })

    it('omits createdAt from create schema', () => {
      const input = {
        name: '攤位',
        priority: 1,
        type: 'order',
        createdAt: 1700000000000,
      }

      const result = createOrderTypeSchema.parse(input)
      expect((result as Record<string, unknown>)['createdAt']).toBeUndefined()
    })

    it('omits updatedAt from create schema', () => {
      const input = {
        name: '攤位',
        priority: 1,
        type: 'order',
        updatedAt: 1700000000000,
      }

      const result = createOrderTypeSchema.parse(input)
      expect((result as Record<string, unknown>)['updatedAt']).toBeUndefined()
    })

    it('applies default type "order" when omitted', () => {
      const input = {
        name: '攤位',
        priority: 1,
      }

      const result = createOrderTypeSchema.parse(input)

      expect(result.type).toBe('order')
    })

    it('rejects empty name in create schema', () => {
      const input = {
        name: '',
        priority: 1,
      }

      expect(() => createOrderTypeSchema.parse(input)).toThrow()
    })
  })

  // ─── priceChangeLogSchema ─────────────────────────────────────────────────

  describe('priceChangeLogSchema', () => {
    it('parses a valid price change log', () => {
      const input = {
        id: 'pcl-001',
        commodityId: 'com-001',
        commodityName: '滷肉便當',
        oldPrice: 100,
        newPrice: 120,
        editor: 'admin',
        createdAt: 1700000000000,
      }

      const result = priceChangeLogSchema.parse(input)

      expect(result).toEqual(input)
    })

    it('applies default editor empty string when omitted', () => {
      const input = {
        id: 'pcl-001',
        commodityId: 'com-001',
        commodityName: '滷肉便當',
        oldPrice: 100,
        newPrice: 120,
        createdAt: 1700000000000,
      }

      const result = priceChangeLogSchema.parse(input)

      expect(result.editor).toBe('')
    })

    it('requires id field', () => {
      const input = {
        commodityId: 'com-001',
        commodityName: '滷肉便當',
        oldPrice: 100,
        newPrice: 120,
        createdAt: 1700000000000,
      }

      expect(() => priceChangeLogSchema.parse(input)).toThrow()
    })

    it('requires commodityId field', () => {
      const input = {
        id: 'pcl-001',
        commodityName: '滷肉便當',
        oldPrice: 100,
        newPrice: 120,
        createdAt: 1700000000000,
      }

      expect(() => priceChangeLogSchema.parse(input)).toThrow()
    })

    it('requires createdAt field', () => {
      const input = {
        id: 'pcl-001',
        commodityId: 'com-001',
        commodityName: '滷肉便當',
        oldPrice: 100,
        newPrice: 120,
      }

      expect(() => priceChangeLogSchema.parse(input)).toThrow()
    })

    it('accepts zero prices', () => {
      const input = {
        id: 'pcl-001',
        commodityId: 'com-001',
        commodityName: '免費品項',
        oldPrice: 0,
        newPrice: 50,
        createdAt: 1700000000000,
      }

      const result = priceChangeLogSchema.parse(input)

      expect(result.oldPrice).toBe(0)
      expect(result.newPrice).toBe(50)
    })
  })
})
