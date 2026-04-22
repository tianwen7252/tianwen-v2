/**
 * Tests for V1 data transformer — maps V1 Dexie backup JSON to V2 SQLite schema.
 * Covers table name mapping, field transformation, type coercion,
 * order data parsing, missing/unknown tables, and defaults.
 */

import { describe, it, expect } from 'vitest'
import {
  transformV1Data,
  parseV1OrderData,
  type V1BackupData,
} from './v1-data-transformer'

// ── Table name mapping ──────────────────────────────────────────────────────

describe('transformV1Data', () => {
  describe('table name mapping', () => {
    it('transforms commondityType to commodity_types', () => {
      const input: V1BackupData = {
        commondityType: [
          {
            id: 1,
            typeID: 'bento',
            type: 'bento',
            label: 'Bento',
            color: '#fff',
          },
        ],
      }

      const result = transformV1Data(input)

      expect(result.tables.has('commodity_types')).toBe(true)
      expect(result.tables.get('commodity_types')).toHaveLength(1)
    })

    it('transforms commondity to commodities', () => {
      const input: V1BackupData = {
        commondity: [
          { id: 1, typeID: 'bento', name: 'Test Product', price: 100 },
        ],
      }

      const result = transformV1Data(input)

      expect(result.tables.has('commodities')).toBe(true)
      expect(result.tables.get('commodities')).toHaveLength(1)
    })

    it('transforms orderTypes to order_types', () => {
      const input: V1BackupData = {
        orderTypes: [{ id: 1, name: 'Dine In', priority: 1, type: 'order' }],
      }

      const result = transformV1Data(input)

      expect(result.tables.has('order_types')).toBe(true)
      expect(result.tables.get('order_types')).toHaveLength(1)
    })

    it('passes through orders table', () => {
      const input: V1BackupData = {
        orders: [{ id: 1, number: 1, total: 100, data: [] }],
      }

      const result = transformV1Data(input)

      expect(result.tables.has('orders')).toBe(true)
    })

    it('passes through employees table', () => {
      const input: V1BackupData = {
        employees: [{ id: 1, name: 'Test Employee' }],
      }

      const result = transformV1Data(input)

      expect(result.tables.has('employees')).toBe(true)
    })

    it('passes through attendances table', () => {
      const input: V1BackupData = {
        attendances: [{ id: 1, employeeId: 'e1', date: '2026-03-29' }],
      }

      const result = transformV1Data(input)

      expect(result.tables.has('attendances')).toBe(true)
    })

    it('transforms dailyData to daily_data', () => {
      const input: V1BackupData = {
        dailyData: [{ id: 1, date: '2026-03-29', total: 5000 }],
      }

      const result = transformV1Data(input)

      expect(result.tables.has('daily_data')).toBe(true)
    })
  })

  // ── Missing tables ──────────────────────────────────────────────────────

  describe('missing tables', () => {
    it('handles missing tables with warnings', () => {
      const input: V1BackupData = {
        commondityType: [
          {
            id: 1,
            typeID: 'bento',
            type: 'bento',
            label: 'Bento',
            color: '#fff',
          },
        ],
        // orders, employees, attendances, etc. are missing
      }

      const result = transformV1Data(input)

      // Should have warnings about missing tables
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(
        result.warnings.some(w => w.toLowerCase().includes('missing')),
      ).toBe(true)
    })
  })

  // ── Unknown tables ────────────────────────────────────────────────────

  describe('unknown tables', () => {
    it('skips unknown tables with warnings', () => {
      const input: V1BackupData = {
        unknown_table: [{ id: '1', foo: 'bar' }],
        another_unknown: [{ id: '2' }],
      }

      const result = transformV1Data(input)

      expect(result.tables.has('unknown_table')).toBe(false)
      expect(result.tables.has('another_unknown')).toBe(false)
      expect(result.warnings.some(w => w.includes('unknown_table'))).toBe(true)
      expect(result.warnings.some(w => w.includes('another_unknown'))).toBe(
        true,
      )
    })
  })

  // ── Default timestamps ────────────────────────────────────────────────

  describe('default timestamps', () => {
    it('adds created_at and updated_at to records without them', () => {
      const input: V1BackupData = {
        commondityType: [
          {
            id: 1,
            typeID: 'bento',
            type: 'bento',
            label: 'Bento',
            color: '#fff',
          },
        ],
      }

      const result = transformV1Data(input)
      const records = result.tables.get('commodity_types')!

      expect(records[0]).toHaveProperty('created_at')
      expect(records[0]).toHaveProperty('updated_at')
      expect(typeof records[0]?.created_at).toBe('number')
      expect(typeof records[0]?.updated_at).toBe('number')
    })

    it('preserves existing created_at and updated_at', () => {
      const ts = 1711700000000
      const input: V1BackupData = {
        orders: [
          {
            id: 1,
            number: 1,
            total: 100,
            data: [],
            created_at: ts,
            updated_at: ts,
          },
        ],
      }

      const result = transformV1Data(input)
      const records = result.tables.get('orders')!

      expect(records[0]?.created_at).toBe(ts)
      expect(records[0]?.updated_at).toBe(ts)
    })
  })

  // ── Field name transformation ─────────────────────────────────────────

  describe('field name transformation', () => {
    it('transforms camelCase field names to snake_case', () => {
      const input: V1BackupData = {
        commondity: [
          {
            id: 1,
            typeID: 'bento',
            name: 'Test',
            price: 100,
            onMarket: '1',
            includesSoup: 0,
          },
        ],
      }

      const result = transformV1Data(input)
      const records = result.tables.get('commodities')!

      expect(records[0]).toHaveProperty('type_id')
      expect(records[0]).toHaveProperty('on_market')
      expect(records[0]).toHaveProperty('includes_soup')
    })

    it('transforms typeID (uppercase D) to type_id', () => {
      const input: V1BackupData = {
        commondity: [{ id: 1, typeID: 'bento', name: 'Test', price: 100 }],
      }

      const result = transformV1Data(input)
      const records = result.tables.get('commodities')!

      expect(records[0]).toHaveProperty('type_id')
      expect(records[0]?.type_id).toBe('bento')
    })

    it('transforms employeeId to employee_id in attendances', () => {
      const input: V1BackupData = {
        attendances: [
          { id: 1, employeeId: 'e1', date: '2026-03-29', type: 'regular' },
        ],
      }

      const result = transformV1Data(input)
      const records = result.tables.get('attendances')!

      expect(records[0]).toHaveProperty('employee_id')
      expect(records[0]?.employee_id).toBe('e1')
    })
  })

  // ── Type coercion ─────────────────────────────────────────────────────

  describe('type coercion', () => {
    it('converts numeric IDs to strings', () => {
      const input: V1BackupData = {
        commondity: [{ id: 42, typeID: 'bento', name: 'Test', price: 100 }],
      }

      const result = transformV1Data(input)
      const records = result.tables.get('commodities')!

      expect(records[0]?.id).toBe('42')
      expect(typeof records[0]?.id).toBe('string')
    })

    it('converts numeric type_id to string', () => {
      const input: V1BackupData = {
        commondity: [{ id: 1, typeID: 3, name: 'Test', price: 100 }],
      }

      const result = transformV1Data(input)
      const records = result.tables.get('commodities')!

      expect(records[0]?.type_id).toBe('3')
      expect(typeof records[0]?.type_id).toBe('string')
    })

    it('converts string onMarket "1" to number 1', () => {
      const input: V1BackupData = {
        commondity: [
          { id: 1, typeID: 'bento', name: 'Test', price: 100, onMarket: '1' },
        ],
      }

      const result = transformV1Data(input)
      const records = result.tables.get('commodities')!

      expect(records[0]?.on_market).toBe(1)
      expect(typeof records[0]?.on_market).toBe('number')
    })

    it('converts string onMarket "0" to number 0', () => {
      const input: V1BackupData = {
        commondity: [
          { id: 1, typeID: 'bento', name: 'Test', price: 100, onMarket: '0' },
        ],
      }

      const result = transformV1Data(input)
      const records = result.tables.get('commodities')!

      expect(records[0]?.on_market).toBe(0)
      expect(typeof records[0]?.on_market).toBe('number')
    })
  })

  // ── Empty input ───────────────────────────────────────────────────────

  describe('empty input', () => {
    it('returns empty map for empty input', () => {
      const result = transformV1Data({})

      expect(result.tables.size).toBe(0)
      expect(result.orderItems).toHaveLength(0)
      expect(result.orderDiscounts).toHaveLength(0)
      // Should have warnings about all known tables being missing
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })

  // ── Order data extraction ─────────────────────────────────────────────

  describe('order data extraction', () => {
    it('extracts order_items from V1 order data arrays', () => {
      const input: V1BackupData = {
        orders: [
          {
            id: 1,
            number: 1,
            total: 220,
            soups: 2,
            data: [
              { value: '110', res: '蒜泥白肉飯', type: 'main-dish' },
              { value: '', operator: '+' },
              { value: '110', res: '排骨飯', type: 'main-dish' },
            ],
          },
        ],
      }

      const result = transformV1Data(input)

      expect(result.orderItems).toHaveLength(2)
      expect(result.orderItems[0]).toMatchObject({
        id: 'v1-oi-1-0',
        order_id: '1',
        name: '蒜泥白肉飯',
        price: 110,
        quantity: 1,
        includes_soup: 1,
      })
      expect(result.orderItems[1]).toMatchObject({
        id: 'v1-oi-1-1',
        order_id: '1',
        name: '排骨飯',
        price: 110,
        quantity: 1,
        includes_soup: 1,
      })
    })

    it('extracts order_discounts from V1 order data arrays', () => {
      const input: V1BackupData = {
        orders: [
          {
            id: 1,
            number: 1,
            total: 90,
            soups: 1,
            data: [
              { value: '110', res: '蒜泥白肉飯', type: 'main-dish' },
              { value: '', operator: '+' },
              { value: '-20', res: '九折優惠', type: '' },
            ],
          },
        ],
      }

      const result = transformV1Data(input)

      expect(result.orderDiscounts).toHaveLength(1)
      expect(result.orderDiscounts[0]).toMatchObject({
        id: 'v1-od-1-0',
        order_id: '1',
        label: '九折優惠',
        amount: 20,
      })
    })

    it('removes data field from transformed order records', () => {
      const input: V1BackupData = {
        orders: [
          {
            id: 1,
            number: 1,
            total: 110,
            soups: 1,
            data: [{ value: '110', res: '蒜泥白肉飯', type: 'main-dish' }],
          },
        ],
      }

      const result = transformV1Data(input)
      const orders = result.tables.get('orders')!

      expect(orders[0]).not.toHaveProperty('data')
    })
  })

  // ── Full round trip ───────────────────────────────────────────────────

  describe('full transformation', () => {
    it('transforms multiple tables simultaneously', () => {
      const input: V1BackupData = {
        commondityType: [
          {
            id: 1,
            typeID: 'bento',
            type: 'bento',
            label: 'Bento',
            color: '#fff',
          },
        ],
        commondity: [{ id: 1, typeID: 'bento', name: 'Product A', price: 100 }],
        orderTypes: [{ id: 1, name: 'Dine In', priority: 1, type: 'order' }],
        orders: [{ id: 1, number: 1, total: 100, data: [] }],
        employees: [{ id: 1, name: 'Employee A' }],
        attendances: [
          { id: 1, employeeId: 'e1', date: '2026-03-29', type: 'regular' },
        ],
        dailyData: [{ id: 1, date: '2026-03-29', total: 5000 }],
      }

      const result = transformV1Data(input)

      expect(result.tables.size).toBe(7)
      expect(result.tables.has('commodity_types')).toBe(true)
      expect(result.tables.has('commodities')).toBe(true)
      expect(result.tables.has('order_types')).toBe(true)
      expect(result.tables.has('orders')).toBe(true)
      expect(result.tables.has('employees')).toBe(true)
      expect(result.tables.has('attendances')).toBe(true)
      expect(result.tables.has('daily_data')).toBe(true)
      // No warnings when all known tables are present and no unknown tables
      expect(result.warnings).toHaveLength(0)
    })
  })
})

// ── parseV1OrderData ────────────────────────────────────────────────────────

describe('parseV1OrderData', () => {
  it('parses simple items', () => {
    const data = [
      { value: '110', res: '蒜泥白肉飯', type: 'main-dish' },
      { value: '', operator: '+' },
      { value: '80', res: '滷肉飯', type: 'side-dish' },
    ]

    const result = parseV1OrderData(data, '1')

    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toMatchObject({
      name: '蒜泥白肉飯',
      price: 110,
      quantity: 1,
      includesSoup: true,
    })
    expect(result.items[1]).toMatchObject({
      name: '滷肉飯',
      price: 80,
      quantity: 1,
      includesSoup: false,
    })
  })

  it('handles multiplier operator', () => {
    const data = [
      { value: '110', res: '蒜泥白肉飯', type: 'main-dish' },
      { value: '2', operator: '*' },
    ]

    const result = parseV1OrderData(data, '1')

    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({
      name: '蒜泥白肉飯',
      price: 110,
      quantity: 2,
    })
  })

  it('handles item with amount hint', () => {
    const data = [
      {
        value: '120',
        res: '炸雞腿飯',
        type: 'main-dish',
        amount: '2',
      },
    ]

    const result = parseV1OrderData(data, '1')

    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({
      name: '炸雞腿飯',
      price: 120,
      quantity: 2,
    })
  })

  it('multiplier overrides amount hint', () => {
    const data = [
      {
        value: '120',
        res: '炸雞腿飯',
        type: 'main-dish',
        amount: '2',
      },
      { value: '3', operator: '*' },
    ]

    const result = parseV1OrderData(data, '1')

    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({
      quantity: 3,
    })
  })

  it('treats negative values as discounts', () => {
    const data = [
      { value: '110', res: '蒜泥白肉飯', type: 'main-dish' },
      { value: '', operator: '+' },
      { value: '-20', res: '折扣', type: '' },
    ]

    const result = parseV1OrderData(data, '1')

    expect(result.items).toHaveLength(1)
    expect(result.discounts).toHaveLength(1)
    expect(result.discounts[0]).toMatchObject({
      label: '折扣',
      amount: 20,
    })
  })

  it('treats items with 折 in name as discounts', () => {
    const data = [
      { value: '110', res: '蒜泥白肉飯', type: 'main-dish' },
      { value: '', operator: '+' },
      { value: '10', res: '九折', type: '' },
    ]

    const result = parseV1OrderData(data, '1')

    expect(result.items).toHaveLength(1)
    expect(result.discounts).toHaveLength(1)
    expect(result.discounts[0]).toMatchObject({
      label: '九折',
      amount: 10,
    })
  })

  it('returns empty for empty array', () => {
    const result = parseV1OrderData([], '1')

    expect(result.items).toHaveLength(0)
    expect(result.discounts).toHaveLength(0)
  })

  it('returns empty for non-array input', () => {
    const result = parseV1OrderData(null as unknown as unknown[], '1')

    expect(result.items).toHaveLength(0)
    expect(result.discounts).toHaveLength(0)
  })

  it('sets commodityId with orderId', () => {
    const data = [{ value: '100', res: 'Test', type: 'side-dish' }]

    const result = parseV1OrderData(data, '42')

    expect(result.items[0]?.commodityId).toBe('v1-import-42')
  })
})
