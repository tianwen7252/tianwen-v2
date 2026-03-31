import { describe, it, expect } from 'vitest'
import {
  employeeFormSchema,
  recordFormSchema,
  commodityFormSchema,
  orderTypeFormSchema,
} from './form-schemas'
import type {
  EmployeeFormValues,
  RecordFormValues,
  CommodityFormValues,
  OrderTypeFormValues,
} from './form-schemas'

describe('employeeFormSchema', () => {
  describe('valid data', () => {
    it('should accept valid employee data with all fields', () => {
      const data: EmployeeFormValues = {
        name: 'Test Employee',
        avatar: 'images/aminals/1308845.png',
        shiftType: 'regular',
        isAdmin: false,
        hireDate: '2024-01-15',
        resignationDate: '',
      }
      const result = employeeFormSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Test Employee')
        expect(result.data.shiftType).toBe('regular')
      }
    })

    it('should accept minimal required data (name only)', () => {
      const result = employeeFormSchema.safeParse({ name: 'Min' })
      expect(result.success).toBe(true)
      if (result.success) {
        // Defaults should be applied
        expect(result.data.avatar).toBe('')
        expect(result.data.shiftType).toBe('regular')
        expect(result.data.isAdmin).toBe(false)
        expect(result.data.hireDate).toBe('')
        expect(result.data.resignationDate).toBe('')
      }
    })

    it('should accept shift type "shift"', () => {
      const result = employeeFormSchema.safeParse({
        name: 'Shift Worker',
        shiftType: 'shift',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.shiftType).toBe('shift')
      }
    })

    it('should accept admin flag as true', () => {
      const result = employeeFormSchema.safeParse({
        name: 'Admin User',
        isAdmin: true,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isAdmin).toBe(true)
      }
    })
  })

  describe('invalid data', () => {
    it('should reject empty name', () => {
      const result = employeeFormSchema.safeParse({ name: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        const nameError = result.error.issues.find(i => i.path.includes('name'))
        expect(nameError?.message).toBe('請輸入員工姓名')
      }
    })

    it('should reject missing name', () => {
      const result = employeeFormSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('should reject invalid shift type', () => {
      const result = employeeFormSchema.safeParse({
        name: 'Test',
        shiftType: 'night',
      })
      expect(result.success).toBe(false)
    })

    it('should reject non-boolean isAdmin', () => {
      const result = employeeFormSchema.safeParse({
        name: 'Test',
        isAdmin: 'yes',
      })
      expect(result.success).toBe(false)
    })

    it('should reject null name', () => {
      const result = employeeFormSchema.safeParse({ name: null })
      expect(result.success).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle Unicode names', () => {
      const result = employeeFormSchema.safeParse({ name: 'Alex' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Alex')
      }
    })

    it('should handle special characters in name', () => {
      const result = employeeFormSchema.safeParse({ name: "O'Brien" })
      expect(result.success).toBe(true)
    })

    it('should handle whitespace-only name as valid (min length check only)', () => {
      // A single space passes min(1) but should be trimmed by the form
      const result = employeeFormSchema.safeParse({ name: ' ' })
      expect(result.success).toBe(true)
    })
  })
})

describe('recordFormSchema', () => {
  describe('valid data', () => {
    it('should accept valid regular attendance record', () => {
      const data: RecordFormValues = {
        attendanceType: 'regular',
        clockInTime: '08:00',
        clockOutTime: '17:00',
      }
      const result = recordFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept vacation type', () => {
      const result = recordFormSchema.safeParse({
        attendanceType: 'vacation',
        clockInTime: '08:00',
        clockOutTime: '',
      })
      expect(result.success).toBe(true)
    })

    it('should accept empty times for regular type', () => {
      const result = recordFormSchema.safeParse({
        attendanceType: 'regular',
        clockInTime: '',
        clockOutTime: '',
      })
      expect(result.success).toBe(true)
    })

    it('should apply default values', () => {
      const result = recordFormSchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.attendanceType).toBe('regular')
        expect(result.data.clockInTime).toBe('')
        expect(result.data.clockOutTime).toBe('')
      }
    })
  })

  describe('cross-field validation', () => {
    it('should reject when clockOut is before clockIn', () => {
      const result = recordFormSchema.safeParse({
        attendanceType: 'regular',
        clockInTime: '17:00',
        clockOutTime: '08:00',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const clockOutError = result.error.issues.find(i =>
          i.path.includes('clockOutTime'),
        )
        expect(clockOutError?.message).toBe('下班時間必須晚於上班時間')
      }
    })

    it('should reject when clockOut equals clockIn', () => {
      const result = recordFormSchema.safeParse({
        attendanceType: 'regular',
        clockInTime: '08:00',
        clockOutTime: '08:00',
      })
      expect(result.success).toBe(false)
    })

    it('should allow any times for vacation type (skip clockOut validation)', () => {
      const result = recordFormSchema.safeParse({
        attendanceType: 'vacation',
        clockInTime: '17:00',
        clockOutTime: '08:00',
      })
      expect(result.success).toBe(true)
    })

    it('should pass when only clockIn is set (no clockOut)', () => {
      const result = recordFormSchema.safeParse({
        attendanceType: 'regular',
        clockInTime: '08:00',
        clockOutTime: '',
      })
      expect(result.success).toBe(true)
    })

    it('should pass when only clockOut is set (no clockIn)', () => {
      const result = recordFormSchema.safeParse({
        attendanceType: 'regular',
        clockInTime: '',
        clockOutTime: '17:00',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('invalid data', () => {
    it('should reject invalid attendance type', () => {
      const result = recordFormSchema.safeParse({
        attendanceType: 'sick',
      })
      expect(result.success).toBe(false)
    })
  })
})

// ─── commodityFormSchema ──────────────────────────────────────────────────

describe('commodityFormSchema', () => {
  describe('valid data', () => {
    it('accepts valid commodity form data with all fields', () => {
      const data: CommodityFormValues = {
        name: '油淋雞腿飯',
        price: 140,
        includesSoup: true,
      }
      const result = commodityFormSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('油淋雞腿飯')
        expect(result.data.price).toBe(140)
        expect(result.data.includesSoup).toBe(true)
      }
    })

    it('accepts minimal required data (name + price)', () => {
      const result = commodityFormSchema.safeParse({
        name: '紅茶',
        price: 25,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.includesSoup).toBe(false)
      }
    })

    it('accepts price of 0', () => {
      const result = commodityFormSchema.safeParse({
        name: '贈品',
        price: 0,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('invalid data', () => {
    it('rejects empty name', () => {
      const result = commodityFormSchema.safeParse({
        name: '',
        price: 100,
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing name', () => {
      const result = commodityFormSchema.safeParse({
        price: 100,
      })
      expect(result.success).toBe(false)
    })

    it('rejects negative price', () => {
      const result = commodityFormSchema.safeParse({
        name: '紅茶',
        price: -10,
      })
      expect(result.success).toBe(false)
    })
  })
})

// ─── orderTypeFormSchema ──────────────────────────────────────────────────

describe('orderTypeFormSchema', () => {
  describe('valid data', () => {
    it('accepts valid order type form data', () => {
      const data: OrderTypeFormValues = {
        name: '攤位',
        color: 'green',
      }
      const result = orderTypeFormSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('攤位')
        expect(result.data.color).toBe('green')
      }
    })

    it('accepts minimal required data (name only)', () => {
      const result = orderTypeFormSchema.safeParse({
        name: '外送',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.color).toBe('')
      }
    })

    it('accepts empty color string', () => {
      const result = orderTypeFormSchema.safeParse({
        name: '外送',
        color: '',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('invalid data', () => {
    it('rejects empty name', () => {
      const result = orderTypeFormSchema.safeParse({
        name: '',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing name', () => {
      const result = orderTypeFormSchema.safeParse({
        color: 'green',
      })
      expect(result.success).toBe(false)
    })
  })
})
