/**
 * Tests for V1 data transformer — maps V1 Dexie backup JSON to V2 SQLite schema.
 * Covers table name mapping, field transformation, missing/unknown tables, and defaults.
 */

import { describe, it, expect } from 'vitest'
import { transformV1Data, type V1BackupData } from './v1-data-transformer'

// ── Table name mapping ──────────────────────────────────────────────────────

describe('transformV1Data', () => {
  describe('table name mapping', () => {
    it('transforms commondity_types to commodity_types', () => {
      const input: V1BackupData = {
        commondity_types: [
          {
            id: '1',
            typeId: 'bento',
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

    it('transforms commondities to commodities', () => {
      const input: V1BackupData = {
        commondities: [
          { id: '1', typeId: 'bento', name: 'Test Product', price: 100 },
        ],
      }

      const result = transformV1Data(input)

      expect(result.tables.has('commodities')).toBe(true)
      expect(result.tables.get('commodities')).toHaveLength(1)
    })

    it('passes through orders table', () => {
      const input: V1BackupData = {
        orders: [{ id: '1', number: 1, total: 100 }],
      }

      const result = transformV1Data(input)

      expect(result.tables.has('orders')).toBe(true)
    })

    it('passes through employees table', () => {
      const input: V1BackupData = {
        employees: [{ id: '1', name: 'Test Employee' }],
      }

      const result = transformV1Data(input)

      expect(result.tables.has('employees')).toBe(true)
    })

    it('passes through attendances table', () => {
      const input: V1BackupData = {
        attendances: [{ id: '1', employeeId: 'e1', date: '2026-03-29' }],
      }

      const result = transformV1Data(input)

      expect(result.tables.has('attendances')).toBe(true)
    })

    it('transforms dailyData to daily_data', () => {
      const input: V1BackupData = {
        dailyData: [{ id: '1', date: '2026-03-29', total: 5000 }],
      }

      const result = transformV1Data(input)

      expect(result.tables.has('daily_data')).toBe(true)
    })
  })

  // ── Missing tables ──────────────────────────────────────────────────────

  describe('missing tables', () => {
    it('handles missing tables with warnings', () => {
      const input: V1BackupData = {
        commondity_types: [
          {
            id: '1',
            typeId: 'bento',
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
        commondity_types: [
          {
            id: '1',
            typeId: 'bento',
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
          { id: '1', number: 1, total: 100, created_at: ts, updated_at: ts },
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
        commondities: [
          {
            id: '1',
            typeId: 'bento',
            name: 'Test',
            price: 100,
            onMarket: 1,
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

    it('transforms employeeId to employee_id in attendances', () => {
      const input: V1BackupData = {
        attendances: [
          { id: '1', employeeId: 'e1', date: '2026-03-29', type: 'regular' },
        ],
      }

      const result = transformV1Data(input)
      const records = result.tables.get('attendances')!

      expect(records[0]).toHaveProperty('employee_id')
      expect(records[0]?.employee_id).toBe('e1')
    })
  })

  // ── Empty input ───────────────────────────────────────────────────────

  describe('empty input', () => {
    it('returns empty map for empty input', () => {
      const result = transformV1Data({})

      expect(result.tables.size).toBe(0)
      // Should have warnings about all known tables being missing
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })

  // ── Full round trip ───────────────────────────────────────────────────

  describe('full transformation', () => {
    it('transforms multiple tables simultaneously', () => {
      const input: V1BackupData = {
        commondity_types: [
          {
            id: '1',
            typeId: 'bento',
            type: 'bento',
            label: 'Bento',
            color: '#fff',
          },
        ],
        commondities: [
          { id: '1', typeId: 'bento', name: 'Product A', price: 100 },
        ],
        orders: [{ id: '1', number: 1, total: 100 }],
        employees: [{ id: '1', name: 'Employee A' }],
        attendances: [
          { id: '1', employeeId: 'e1', date: '2026-03-29', type: 'regular' },
        ],
        dailyData: [{ id: '1', date: '2026-03-29', total: 5000 }],
      }

      const result = transformV1Data(input)

      expect(result.tables.size).toBe(6)
      expect(result.tables.has('commodity_types')).toBe(true)
      expect(result.tables.has('commodities')).toBe(true)
      expect(result.tables.has('orders')).toBe(true)
      expect(result.tables.has('employees')).toBe(true)
      expect(result.tables.has('attendances')).toBe(true)
      expect(result.tables.has('daily_data')).toBe(true)
      // No warnings when all known tables are present and no unknown tables
      expect(result.warnings).toHaveLength(0)
    })
  })
})
