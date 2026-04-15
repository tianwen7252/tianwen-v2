/**
 * Unit tests for staff-admin shared types, constants, and helpers.
 */

import { describe, it, expect } from 'vitest'
import {
  DEFAULT_VALUES,
  SHIFT_LABEL_MAP,
  employeeToFormValues,
} from './staff-admin.types'
import type { Employee } from '@/lib/schemas'

// ─── Test Helper ─────────────────────────────────────────────────────────────

function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 'emp-test-1',
    name: 'Test Employee',
    employeeNo: 'E001',
    isAdmin: false,
    isDefaultOrderStaff: false,
    shiftType: 'regular',
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
}

// ─── DEFAULT_VALUES ──────────────────────────────────────────────────────────

describe('DEFAULT_VALUES', () => {
  it('should have empty name', () => {
    expect(DEFAULT_VALUES.name).toBe('')
  })

  it('should have empty avatar', () => {
    expect(DEFAULT_VALUES.avatar).toBe('')
  })

  it('should default to regular shift type', () => {
    expect(DEFAULT_VALUES.shiftType).toBe('regular')
  })

  it('should default isAdmin to false', () => {
    expect(DEFAULT_VALUES.isAdmin).toBe(false)
  })

  it('should have empty hireDate', () => {
    expect(DEFAULT_VALUES.hireDate).toBe('')
  })

  it('should have empty resignationDate', () => {
    expect(DEFAULT_VALUES.resignationDate).toBe('')
  })
})

// ─── SHIFT_LABEL_MAP ────────────────────────────────────────────────────────

describe('SHIFT_LABEL_MAP', () => {
  it('should be a Map instance', () => {
    expect(SHIFT_LABEL_MAP).toBeInstanceOf(Map)
  })

  it('should contain regular shift label', () => {
    expect(SHIFT_LABEL_MAP.has('regular')).toBe(true)
  })

  it('should contain shift label', () => {
    expect(SHIFT_LABEL_MAP.has('shift')).toBe(true)
  })

  it('should return undefined for unknown keys', () => {
    expect(SHIFT_LABEL_MAP.get('unknown')).toBeUndefined()
  })
})

// ─── employeeToFormValues ────────────────────────────────────────────────────

describe('employeeToFormValues', () => {
  it('should convert a full employee to form values', () => {
    const employee = makeEmployee({
      name: 'Wang',
      avatar: '/images/cat.png',
      shiftType: 'shift',
      isAdmin: true,
      hireDate: '2025-01-01',
      resignationDate: '2026-06-30',
    })

    const result = employeeToFormValues(employee)

    expect(result).toEqual({
      name: 'Wang',
      avatar: '/images/cat.png',
      shiftType: 'shift',
      isAdmin: true,
      isDefaultOrderStaff: false,
      hireDate: '2025-01-01',
      resignationDate: '2026-06-30',
    })
  })

  it('should default avatar to empty string when undefined', () => {
    const employee = makeEmployee({ avatar: undefined })
    const result = employeeToFormValues(employee)
    expect(result.avatar).toBe('')
  })

  it('should default hireDate to empty string when undefined', () => {
    const employee = makeEmployee({ hireDate: undefined })
    const result = employeeToFormValues(employee)
    expect(result.hireDate).toBe('')
  })

  it('should default resignationDate to empty string when undefined', () => {
    const employee = makeEmployee({ resignationDate: undefined })
    const result = employeeToFormValues(employee)
    expect(result.resignationDate).toBe('')
  })

  it('should not mutate the original employee object', () => {
    const employee = makeEmployee({ name: 'Original' })
    const original = { ...employee }
    employeeToFormValues(employee)
    expect(employee).toEqual(original)
  })
})
