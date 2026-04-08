/**
 * Tests for default-data module.
 * Covers localStorage version check, data deletion, clearing, and insertion functions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  shouldResetDefaultData,
  markDefaultDataVersion,
  deleteDefaultData,
  clearAllData,
  insertDefaultEmployees,
  insertDefaultCommodities,
  insertDefaultOrderTypes,
  resetCommodityData,
  resetCommodityDataAsync,
  DEFAULT_EMPLOYEES,
  DEFAULT_COMMODITY_TYPES,
  DEFAULT_COMMODITIES,
  DEFAULT_ORDER_TYPES,
} from './default-data'
import { UPDATE_DEFAULT_DATA_NUMBER } from '@/constants/default-data'
import type { Database, QueryResult } from '@/lib/database'

// ─── Mock for resetCommodityDataAsync (uses getDatabase from provider) ──────

type AsyncExecFn = (
  sql: string,
  params?: readonly unknown[],
) => Promise<{ rows: unknown[]; changes: number }>
let mockAsyncExec: ReturnType<typeof vi.fn<AsyncExecFn>>
vi.mock('@/lib/repositories/provider', () => ({
  getDatabase: () => ({
    exec: (sql: string, params?: readonly unknown[]) =>
      mockAsyncExec(sql, params),
  }),
}))

// ─── Mock Database factory ───────────────────────────────────────────────────

function makeMockDb(): Database & {
  calls: Array<{ sql: string; params: readonly unknown[] }>
} {
  const calls: Array<{ sql: string; params: readonly unknown[] }> = []
  return {
    isReady: true,
    calls,
    exec(sql: string, params?: readonly unknown[]) {
      calls.push({ sql: sql.trim(), params: params ?? [] })
      return { rows: [], changes: 0 }
    },
    close() {},
  }
}

// ─── shouldResetDefaultData ──────────────────────────────────────────────────

describe('shouldResetDefaultData()', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns true when localStorage has no stored version', () => {
    expect(shouldResetDefaultData()).toBe(true)
  })

  it('returns true when stored version differs from constant', () => {
    localStorage.setItem(
      'UPDATE_DEFAULT_DATA_NUMBER',
      String(UPDATE_DEFAULT_DATA_NUMBER - 1),
    )
    expect(shouldResetDefaultData()).toBe(true)
  })

  it('returns false when stored version matches constant', () => {
    localStorage.setItem(
      'UPDATE_DEFAULT_DATA_NUMBER',
      String(UPDATE_DEFAULT_DATA_NUMBER),
    )
    expect(shouldResetDefaultData()).toBe(false)
  })

  it('returns true when stored version is a future number (mismatch)', () => {
    localStorage.setItem(
      'UPDATE_DEFAULT_DATA_NUMBER',
      String(UPDATE_DEFAULT_DATA_NUMBER + 99),
    )
    expect(shouldResetDefaultData()).toBe(true)
  })

  it('returns true when stored value is empty string', () => {
    localStorage.setItem('UPDATE_DEFAULT_DATA_NUMBER', '')
    expect(shouldResetDefaultData()).toBe(true)
  })
})

// ─── markDefaultDataVersion ──────────────────────────────────────────────────

describe('markDefaultDataVersion()', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores the current UPDATE_DEFAULT_DATA_NUMBER in localStorage', () => {
    markDefaultDataVersion()
    const stored = localStorage.getItem('UPDATE_DEFAULT_DATA_NUMBER')
    expect(stored).toBe(String(UPDATE_DEFAULT_DATA_NUMBER))
  })

  it('after marking, shouldResetDefaultData returns false', () => {
    markDefaultDataVersion()
    expect(shouldResetDefaultData()).toBe(false)
  })

  it('overwrites any previously stored value', () => {
    localStorage.setItem('UPDATE_DEFAULT_DATA_NUMBER', '999')
    markDefaultDataVersion()
    const stored = localStorage.getItem('UPDATE_DEFAULT_DATA_NUMBER')
    expect(stored).toBe(String(UPDATE_DEFAULT_DATA_NUMBER))
  })
})

// ─── deleteDefaultData ───────────────────────────────────────────────────────

describe('deleteDefaultData(db)', () => {
  it('issues SELECT COUNT to check for non-default commodities before deleting commodity_types', () => {
    const db = makeMockDb()
    deleteDefaultData(db)

    const selectCall = db.calls.find(
      c => c.sql.includes('SELECT COUNT') && c.sql.includes('commodities'),
    )
    expect(selectCall).toBeDefined()
    expect(selectCall!.sql).toMatch(
      /SELECT COUNT\(\*\) as cnt FROM commodities WHERE type_id IN/,
    )
    expect(selectCall!.params).toHaveLength(5) // 5 default typeId values
  })

  it('issues DELETE for commodity_types when SELECT COUNT returns 0', () => {
    // Default mock returns rows:[] which means cnt=undefined→0, so deletion proceeds
    const db = makeMockDb()
    deleteDefaultData(db)

    const typesSql = db.calls.find(c =>
      c.sql.includes('DELETE FROM commodity_types'),
    )
    expect(typesSql).toBeDefined()
    expect(typesSql!.sql).toMatch(/DELETE FROM commodity_types WHERE id IN/)
  })

  it('skips DELETE for commodity_types when non-default commodities still reference them', () => {
    const calls: Array<{ sql: string; params: readonly unknown[] }> = []
    const mockDb: Database & { calls: typeof calls } = {
      isReady: true,
      calls,
      exec<T = Record<string, unknown>>(
        sql: string,
        params?: readonly unknown[],
      ): QueryResult<T> {
        calls.push({ sql: sql.trim(), params: params ?? [] })
        // Simulate COUNT(*) returning 2 (user has custom commodities)
        if (sql.includes('SELECT COUNT') && sql.includes('commodities')) {
          return { rows: [{ cnt: 2 }] as unknown as readonly T[], changes: 0 }
        }
        return { rows: [] as readonly T[], changes: 0 }
      },
      close() {},
    }
    deleteDefaultData(mockDb)

    const typesSql = calls.find(c =>
      c.sql.includes('DELETE FROM commodity_types'),
    )
    expect(typesSql).toBeUndefined()
  })

  it('issues DELETE for commodities using default commodity IDs', () => {
    const db = makeMockDb()
    deleteDefaultData(db)

    const comSql = db.calls.find(
      c => c.sql.includes('commodities') && !c.sql.includes('commodity_types'),
    )
    expect(comSql).toBeDefined()
    expect(comSql!.sql).toMatch(/DELETE FROM commodities WHERE id IN/)
  })

  it('issues DELETE for employees using default employee IDs', () => {
    const db = makeMockDb()
    deleteDefaultData(db)

    const empSql = db.calls.find(c => c.sql.includes('employees'))
    expect(empSql).toBeDefined()
    expect(empSql!.sql).toMatch(/DELETE FROM employees WHERE id IN/)
  })

  it('uses parameterized queries (no IDs embedded in SQL string)', () => {
    const db = makeMockDb()
    deleteDefaultData(db)

    for (const call of db.calls) {
      // IDs like 'ct-001' or 'emp-001' should not appear directly in SQL
      expect(call.sql).not.toMatch(/ct-\d+|emp-\d+|com-\d+/)
    }
  })

  it('passes correct number of params for each DELETE', () => {
    const db = makeMockDb()
    deleteDefaultData(db)

    // Verify param counts match the known seed data sizes
    const empCall = db.calls.find(c => c.sql.includes('DELETE FROM employees'))
    expect(empCall!.params).toHaveLength(8) // EMPLOYEE_SEEDS has 8 entries

    const typesCall = db.calls.find(c =>
      c.sql.includes('DELETE FROM commodity_types'),
    )
    expect(typesCall!.params).toHaveLength(5) // COMMODITY_TYPE_SEEDS has 5 entries

    const comCall = db.calls.find(
      c =>
        c.sql.includes('DELETE FROM commodities') &&
        !c.sql.includes('commodity_types'),
    )
    expect(comCall!.params).toHaveLength(65) // COMMODITY_SEEDS has 65 entries
  })

  it('deletes commodities before SELECT-checking and deleting commodity_types', () => {
    const db = makeMockDb()
    deleteDefaultData(db)

    const comIdx = db.calls.findIndex(
      c =>
        c.sql.includes('DELETE FROM commodities') &&
        !c.sql.includes('commodity_types'),
    )
    const selectIdx = db.calls.findIndex(
      c => c.sql.includes('SELECT COUNT') && c.sql.includes('commodities'),
    )
    const typesIdx = db.calls.findIndex(c =>
      c.sql.includes('DELETE FROM commodity_types'),
    )
    expect(comIdx).toBeLessThan(selectIdx)
    expect(selectIdx).toBeLessThan(typesIdx)
  })

  it('deletes attendances for default employees before deleting employees to respect FK constraint', () => {
    const db = makeMockDb()
    deleteDefaultData(db)

    const attIdx = db.calls.findIndex(c =>
      c.sql.includes('DELETE FROM attendances'),
    )
    const empIdx = db.calls.findIndex(c =>
      c.sql.includes('DELETE FROM employees'),
    )
    expect(attIdx).toBeGreaterThanOrEqual(0)
    expect(attIdx).toBeLessThan(empIdx)
  })

  it('issues DELETE for attendances with employee_id filter using default employee IDs', () => {
    const db = makeMockDb()
    deleteDefaultData(db)

    const attCall = db.calls.find(c =>
      c.sql.includes('DELETE FROM attendances'),
    )
    expect(attCall).toBeDefined()
    expect(attCall!.sql).toMatch(/DELETE FROM attendances WHERE employee_id IN/)
    expect(attCall!.params).toHaveLength(8)
  })
})

// ─── clearAllData ────────────────────────────────────────────────────────────

describe('clearAllData(db)', () => {
  it('deletes from attendances table', () => {
    const db = makeMockDb()
    clearAllData(db)

    expect(db.calls.some(c => c.sql === 'DELETE FROM attendances')).toBe(true)
  })

  it('deletes from commodities table', () => {
    const db = makeMockDb()
    clearAllData(db)

    expect(db.calls.some(c => c.sql === 'DELETE FROM commodities')).toBe(true)
  })

  it('deletes from commodity_types table', () => {
    const db = makeMockDb()
    clearAllData(db)

    expect(db.calls.some(c => c.sql === 'DELETE FROM commodity_types')).toBe(
      true,
    )
  })

  it('deletes from employees table', () => {
    const db = makeMockDb()
    clearAllData(db)

    expect(db.calls.some(c => c.sql === 'DELETE FROM employees')).toBe(true)
  })

  it('deletes from orders table', () => {
    const db = makeMockDb()
    clearAllData(db)

    expect(db.calls.some(c => c.sql === 'DELETE FROM orders')).toBe(true)
  })

  it('deletes from order_types table', () => {
    const db = makeMockDb()
    clearAllData(db)

    expect(db.calls.some(c => c.sql === 'DELETE FROM order_types')).toBe(true)
  })

  it('deletes from daily_data table', () => {
    const db = makeMockDb()
    clearAllData(db)

    expect(db.calls.some(c => c.sql === 'DELETE FROM daily_data')).toBe(true)
  })

  it('deletes from order_items table', () => {
    const db = makeMockDb()
    clearAllData(db)

    expect(db.calls.some(c => c.sql === 'DELETE FROM order_items')).toBe(true)
  })

  it('deletes from order_discounts table', () => {
    const db = makeMockDb()
    clearAllData(db)

    expect(db.calls.some(c => c.sql === 'DELETE FROM order_discounts')).toBe(
      true,
    )
  })

  it('issues exactly 10 DELETE statements', () => {
    const db = makeMockDb()
    clearAllData(db)

    const deletes = db.calls.filter(c => c.sql.startsWith('DELETE'))
    expect(deletes).toHaveLength(10)
  })

  it('deletes price_change_logs', () => {
    const db = makeMockDb()
    clearAllData(db)

    expect(db.calls.some(c => c.sql === 'DELETE FROM price_change_logs')).toBe(
      true,
    )
  })

  it('deletes order_items before orders to respect FK constraint', () => {
    const db = makeMockDb()
    clearAllData(db)

    const itemsIdx = db.calls.findIndex(
      c => c.sql === 'DELETE FROM order_items',
    )
    const ordersIdx = db.calls.findIndex(c => c.sql === 'DELETE FROM orders')
    expect(itemsIdx).toBeLessThan(ordersIdx)
  })

  it('deletes order_discounts before orders to respect FK constraint', () => {
    const db = makeMockDb()
    clearAllData(db)

    const discountsIdx = db.calls.findIndex(
      c => c.sql === 'DELETE FROM order_discounts',
    )
    const ordersIdx = db.calls.findIndex(c => c.sql === 'DELETE FROM orders')
    expect(discountsIdx).toBeLessThan(ordersIdx)
  })
})

// ─── insertDefaultEmployees ──────────────────────────────────────────────────

describe('insertDefaultEmployees(db)', () => {
  it('inserts all 8 employees', () => {
    const db = makeMockDb()
    insertDefaultEmployees(db)

    const inserts = db.calls.filter(
      c => c.sql.includes('INSERT') && c.sql.includes('employees'),
    )
    expect(inserts).toHaveLength(8)
  })

  it('uses INSERT OR IGNORE to avoid duplicates', () => {
    const db = makeMockDb()
    insertDefaultEmployees(db)

    const inserts = db.calls.filter(c => c.sql.includes('employees'))
    for (const call of inserts) {
      expect(call.sql).toMatch(/INSERT OR IGNORE INTO employees/)
    }
  })

  it('passes all required employee fields as params', () => {
    const db = makeMockDb()
    insertDefaultEmployees(db)

    const first = db.calls.find(c => c.sql.includes('employees'))
    // Expected: id, name, avatar, status, shift_type, employee_no, is_admin, hire_date, resignation_date, created_at, updated_at
    expect(first!.params).toHaveLength(11)
  })

  it('does not mutate DEFAULT_EMPLOYEES array', () => {
    const db = makeMockDb()
    const originalLength = DEFAULT_EMPLOYEES.length
    insertDefaultEmployees(db)
    expect(DEFAULT_EMPLOYEES).toHaveLength(originalLength)
  })

  it('converts isAdmin boolean to 1/0 integer', () => {
    const db = makeMockDb()
    insertDefaultEmployees(db)

    // First employee (emp-001) is admin = true, should be 1
    const first = db.calls.find(c => c.sql.includes('employees'))
    const isAdminParam = first!.params[6] // index 6: is_admin
    expect(isAdminParam).toBe(1)
  })
})

// ─── insertDefaultCommodities ────────────────────────────────────────────────

describe('insertDefaultCommodities(db)', () => {
  it('inserts all 5 commodity types', () => {
    const db = makeMockDb()
    insertDefaultCommodities(db)

    const typeInserts = db.calls.filter(
      c => c.sql.includes('INSERT') && c.sql.includes('commodity_types'),
    )
    expect(typeInserts).toHaveLength(5)
  })

  it('inserts all 65 commodities', () => {
    const db = makeMockDb()
    insertDefaultCommodities(db)

    const comInserts = db.calls.filter(
      c =>
        c.sql.includes('INSERT') &&
        c.sql.includes('commodities') &&
        !c.sql.includes('commodity_types'),
    )
    expect(comInserts).toHaveLength(65)
  })

  it('uses INSERT OR IGNORE for commodity types', () => {
    const db = makeMockDb()
    insertDefaultCommodities(db)

    const typeInserts = db.calls.filter(c => c.sql.includes('commodity_types'))
    for (const call of typeInserts) {
      expect(call.sql).toMatch(/INSERT OR IGNORE INTO commodity_types/)
    }
  })

  it('uses INSERT OR IGNORE for commodities', () => {
    const db = makeMockDb()
    insertDefaultCommodities(db)

    const comInserts = db.calls.filter(
      c => c.sql.includes('commodities') && !c.sql.includes('commodity_types'),
    )
    for (const call of comInserts) {
      expect(call.sql).toMatch(/INSERT OR IGNORE INTO commodities/)
    }
  })

  it('does not mutate DEFAULT_COMMODITY_TYPES or DEFAULT_COMMODITIES arrays', () => {
    const db = makeMockDb()
    const origTypesLen = DEFAULT_COMMODITY_TYPES.length
    const origComLen = DEFAULT_COMMODITIES.length
    insertDefaultCommodities(db)
    expect(DEFAULT_COMMODITY_TYPES).toHaveLength(origTypesLen)
    expect(DEFAULT_COMMODITIES).toHaveLength(origComLen)
  })

  it('converts onMarket boolean to 1/0 integer for commodities', () => {
    const db = makeMockDb()
    insertDefaultCommodities(db)

    const comInserts = db.calls.filter(
      c =>
        c.sql.includes('INSERT') &&
        c.sql.includes('commodities') &&
        !c.sql.includes('commodity_types'),
    )
    // on_market should be 1 (all default commodities are on market)
    for (const call of comInserts) {
      const onMarketParam = call.params[6] // index 6: on_market
      expect(onMarketParam).toBe(1)
    }
  })

  it('includes includes_soup column in commodity INSERT SQL', () => {
    const db = makeMockDb()
    insertDefaultCommodities(db)

    const comInserts = db.calls.filter(
      c =>
        c.sql.includes('INSERT') &&
        c.sql.includes('commodities') &&
        !c.sql.includes('commodity_types'),
    )
    for (const call of comInserts) {
      expect(call.sql).toMatch(/includes_soup/)
    }
  })

  it('passes includes_soup as 1 for com-001 through com-014 (rice bentos)', () => {
    const db = makeMockDb()
    insertDefaultCommodities(db)

    const comInserts = db.calls.filter(
      c =>
        c.sql.includes('INSERT') &&
        c.sql.includes('commodities') &&
        !c.sql.includes('commodity_types'),
    )
    // First 14 inserts are the rice bentos (com-001 to com-014)
    for (let i = 0; i < 14; i++) {
      // includes_soup is at index 9 (after editor at index 8)
      const includesSoupParam = comInserts[i]!.params[9]
      expect(includesSoupParam).toBe(1)
    }
  })

  it('passes includes_soup as 0 for com-015 (雞胸肉沙拉, no rice)', () => {
    const db = makeMockDb()
    insertDefaultCommodities(db)

    const comInserts = db.calls.filter(
      c =>
        c.sql.includes('INSERT') &&
        c.sql.includes('commodities') &&
        !c.sql.includes('commodity_types'),
    )
    // com-015 is the 15th commodity insert
    const com015Insert = comInserts[14]
    const includesSoupParam = com015Insert!.params[9]
    expect(includesSoupParam).toBe(0)
  })
})

// ─── Exported data arrays ────────────────────────────────────────────────────

describe('DEFAULT_EMPLOYEES', () => {
  it('has 8 employees', () => {
    expect(DEFAULT_EMPLOYEES).toHaveLength(8)
  })

  it('all employees have required fields', () => {
    for (const emp of DEFAULT_EMPLOYEES) {
      expect(emp.id).toBeTruthy()
      expect(emp.name).toBeTruthy()
      expect(emp.status).toMatch(/^(active|inactive)$/)
      expect(typeof emp.createdAt).toBe('number')
      expect(typeof emp.updatedAt).toBe('number')
    }
  })

  it('all IDs are unique', () => {
    const ids = DEFAULT_EMPLOYEES.map(e => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('DEFAULT_COMMODITY_TYPES', () => {
  it('has 5 types', () => {
    expect(DEFAULT_COMMODITY_TYPES).toHaveLength(5)
  })

  it('contains bento, single, drink, dumpling, stall typeIds', () => {
    const typeIds = DEFAULT_COMMODITY_TYPES.map(ct => ct.typeId)
    expect(typeIds).toEqual(['bento', 'single', 'drink', 'dumpling', 'stall'])
  })
})

describe('DEFAULT_COMMODITIES', () => {
  it('has 65 items', () => {
    expect(DEFAULT_COMMODITIES).toHaveLength(65)
  })

  it('all items are on market by default', () => {
    for (const com of DEFAULT_COMMODITIES) {
      expect(com.onMarket).toBe(true)
    }
  })

  it('all IDs are unique', () => {
    const ids = DEFAULT_COMMODITIES.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('com-001 through com-014 have includesSoup=true', () => {
    const soupIds = [
      'com-001',
      'com-002',
      'com-003',
      'com-004',
      'com-005',
      'com-006',
      'com-007',
      'com-008',
      'com-009',
      'com-010',
      'com-011',
      'com-012',
      'com-013',
      'com-014',
    ]
    for (const id of soupIds) {
      const com = DEFAULT_COMMODITIES.find(c => c.id === id)
      expect(com, `${id} should exist`).toBeDefined()
      expect(com!.includesSoup, `${id} should have includesSoup=true`).toBe(
        true,
      )
    }
  })

  it('com-015, com-016, com-017 have includesSoup=false', () => {
    const noSoupIds = ['com-015', 'com-016', 'com-017']
    for (const id of noSoupIds) {
      const com = DEFAULT_COMMODITIES.find(c => c.id === id)
      expect(com, `${id} should exist`).toBeDefined()
      expect(com!.includesSoup, `${id} should have includesSoup=false`).toBe(
        false,
      )
    }
  })
})

// ─── DEFAULT_ORDER_TYPES ──────────────────────────────────────────────────

describe('DEFAULT_ORDER_TYPES', () => {
  it('has 3 order types', () => {
    expect(DEFAULT_ORDER_TYPES).toHaveLength(3)
  })

  it('contains correct order type names', () => {
    const names = DEFAULT_ORDER_TYPES.map(ot => ot.name)
    expect(names).toEqual(['攤位', '外送', '電話自取'])
  })

  it('all IDs are unique', () => {
    const ids = DEFAULT_ORDER_TYPES.map(ot => ot.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all order types have required fields', () => {
    for (const ot of DEFAULT_ORDER_TYPES) {
      expect(ot.id).toBeTruthy()
      expect(ot.name).toBeTruthy()
      expect(typeof ot.priority).toBe('number')
      expect(ot.type).toBe('order')
      expect(typeof ot.createdAt).toBe('number')
      expect(typeof ot.updatedAt).toBe('number')
    }
  })

  it('priorities are sequential starting from 1', () => {
    const priorities = DEFAULT_ORDER_TYPES.map(ot => ot.priority)
    expect(priorities).toEqual([1, 2, 3])
  })

  it('has correct colors for each order type', () => {
    const colors = DEFAULT_ORDER_TYPES.map(ot => ot.color)
    expect(colors).toEqual(['green', 'blue', 'yellow'])
  })
})

// ─── insertDefaultOrderTypes ────────────────────────────────────────────────

describe('insertDefaultOrderTypes(db)', () => {
  it('inserts all 3 order types', () => {
    const db = makeMockDb()
    insertDefaultOrderTypes(db)

    const inserts = db.calls.filter(
      c => c.sql.includes('INSERT') && c.sql.includes('order_types'),
    )
    expect(inserts).toHaveLength(3)
  })

  it('uses INSERT OR IGNORE to avoid duplicates', () => {
    const db = makeMockDb()
    insertDefaultOrderTypes(db)

    const inserts = db.calls.filter(c => c.sql.includes('order_types'))
    for (const call of inserts) {
      expect(call.sql).toMatch(/INSERT OR IGNORE INTO order_types/)
    }
  })

  it('passes all required order type fields as params', () => {
    const db = makeMockDb()
    insertDefaultOrderTypes(db)

    const first = db.calls.find(c => c.sql.includes('order_types'))
    // Expected: id, name, priority, type, color, created_at, updated_at
    expect(first!.params).toHaveLength(7)
  })

  it('does not mutate DEFAULT_ORDER_TYPES array', () => {
    const db = makeMockDb()
    const originalLength = DEFAULT_ORDER_TYPES.length
    insertDefaultOrderTypes(db)
    expect(DEFAULT_ORDER_TYPES).toHaveLength(originalLength)
  })

  it('inserts order type with correct param values', () => {
    const db = makeMockDb()
    insertDefaultOrderTypes(db)

    const first = db.calls.find(c => c.sql.includes('order_types'))
    // First order type: ot-001, '攤位', 1, 'order', 'green', ts, ts
    expect(first!.params[0]).toBe('ot-001')
    expect(first!.params[1]).toBe('攤位')
    expect(first!.params[2]).toBe(1)
    expect(first!.params[3]).toBe('order')
    expect(first!.params[4]).toBe('green')
  })
})

// ─── resetCommodityData ─────────────────────────────────────────────────────

describe('resetCommodityData(db)', () => {
  it('deletes from commodities table', () => {
    const db = makeMockDb()
    resetCommodityData(db)

    expect(
      db.calls.some(
        c =>
          c.sql === 'DELETE FROM commodities' ||
          c.sql.includes('DELETE FROM commodities'),
      ),
    ).toBe(true)
  })

  it('deletes from commodity_types table', () => {
    const db = makeMockDb()
    resetCommodityData(db)

    expect(
      db.calls.some(c => c.sql.includes('DELETE FROM commodity_types')),
    ).toBe(true)
  })

  it('deletes from order_types table', () => {
    const db = makeMockDb()
    resetCommodityData(db)

    expect(db.calls.some(c => c.sql.includes('DELETE FROM order_types'))).toBe(
      true,
    )
  })

  it('deletes from price_change_logs table', () => {
    const db = makeMockDb()
    resetCommodityData(db)

    expect(
      db.calls.some(c => c.sql.includes('DELETE FROM price_change_logs')),
    ).toBe(true)
  })

  it('does NOT delete from employees table', () => {
    const db = makeMockDb()
    resetCommodityData(db)

    expect(db.calls.some(c => c.sql.includes('DELETE FROM employees'))).toBe(
      false,
    )
  })

  it('does NOT delete from attendances table', () => {
    const db = makeMockDb()
    resetCommodityData(db)

    expect(db.calls.some(c => c.sql.includes('DELETE FROM attendances'))).toBe(
      false,
    )
  })

  it('re-inserts default commodities after deletion', () => {
    const db = makeMockDb()
    resetCommodityData(db)

    const insertCom = db.calls.filter(
      c =>
        c.sql.includes('INSERT') &&
        c.sql.includes('commodities') &&
        !c.sql.includes('commodity_types'),
    )
    expect(insertCom.length).toBeGreaterThan(0)
  })

  it('re-inserts default order types after deletion', () => {
    const db = makeMockDb()
    resetCommodityData(db)

    const insertOt = db.calls.filter(
      c => c.sql.includes('INSERT') && c.sql.includes('order_types'),
    )
    expect(insertOt.length).toBeGreaterThan(0)
  })

  it('deletes before re-inserting (deletion indices < insertion indices)', () => {
    const db = makeMockDb()
    resetCommodityData(db)

    const lastDeleteIdx = db.calls.reduce((max, c, idx) => {
      if (c.sql.startsWith('DELETE')) return Math.max(max, idx)
      return max
    }, -1)
    const firstInsertIdx = db.calls.findIndex(c => c.sql.includes('INSERT'))

    expect(lastDeleteIdx).toBeLessThan(firstInsertIdx)
  })
})

// ─── resetCommodityDataAsync ────────────────────────────────────────────────

describe('resetCommodityDataAsync()', () => {
  let execCalls: Array<{ sql: string; params: readonly unknown[] | undefined }>

  beforeEach(() => {
    execCalls = []
    mockAsyncExec = vi.fn(async (sql: string, params?: readonly unknown[]) => {
      execCalls.push({ sql: sql.trim(), params })
      return { rows: [], changes: 0 }
    })
  })

  it('begins a transaction before any mutation', async () => {
    await resetCommodityDataAsync()
    expect(execCalls[0]?.sql).toBe('BEGIN')
  })

  it('commits the transaction on success', async () => {
    await resetCommodityDataAsync()
    const lastCall = execCalls[execCalls.length - 1]
    expect(lastCall?.sql).toBe('COMMIT')
  })

  it('rolls back and rethrows on exec failure', async () => {
    mockAsyncExec = vi
      .fn()
      .mockResolvedValueOnce({ rows: [], changes: 0 }) // BEGIN
      .mockRejectedValueOnce(new Error('disk full')) // DELETE commodities
      .mockResolvedValue({ rows: [], changes: 0 }) // ROLLBACK
    await expect(resetCommodityDataAsync()).rejects.toThrow('disk full')
    const sqlLog = mockAsyncExec.mock.calls.map((c: unknown[]) =>
      (c[0] as string).trim(),
    )
    expect(sqlLog).toContain('ROLLBACK')
    expect(sqlLog).not.toContain('COMMIT')
  })

  it('deletes commodities, commodity_types, order_types, and price_change_logs inside the transaction', async () => {
    await resetCommodityDataAsync()
    const sqls = execCalls.map(c => c.sql)
    expect(sqls).toContain('DELETE FROM commodities')
    expect(sqls).toContain('DELETE FROM commodity_types')
    expect(sqls).toContain('DELETE FROM order_types')
    expect(sqls).toContain('DELETE FROM price_change_logs')
  })

  it('does not delete employees or attendances', async () => {
    await resetCommodityDataAsync()
    const sqls = execCalls.map(c => c.sql)
    expect(sqls.some(s => s.includes('employees'))).toBe(false)
    expect(sqls.some(s => s.includes('attendances'))).toBe(false)
  })

  it('re-inserts all default commodity types', async () => {
    await resetCommodityDataAsync()
    const typeInserts = execCalls.filter(
      c => c.sql.includes('INSERT') && c.sql.includes('commodity_types'),
    )
    expect(typeInserts).toHaveLength(5)
  })

  it('re-inserts all default commodities', async () => {
    await resetCommodityDataAsync()
    const comInserts = execCalls.filter(
      c =>
        c.sql.includes('INSERT') &&
        c.sql.includes('commodities') &&
        !c.sql.includes('commodity_types'),
    )
    expect(comInserts).toHaveLength(65)
  })

  it('re-inserts all default order types', async () => {
    await resetCommodityDataAsync()
    const otInserts = execCalls.filter(
      c => c.sql.includes('INSERT') && c.sql.includes('order_types'),
    )
    expect(otInserts).toHaveLength(3)
  })

  it('uses parameterized queries (no IDs embedded in SQL strings)', async () => {
    await resetCommodityDataAsync()
    for (const call of execCalls) {
      if (call.sql.startsWith('INSERT')) {
        expect(call.sql).not.toMatch(/ct-\d+|com-\d+|ot-\d+/)
      }
    }
  })
})
