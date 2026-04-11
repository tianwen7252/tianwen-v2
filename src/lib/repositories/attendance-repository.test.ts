/**
 * Tests for AttendanceRepository, focused on the new findByMonth method.
 * Uses a mock AsyncDatabase since SQLite WASM cannot run in Node/Vitest.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AsyncDatabase } from '@/lib/worker-database'
import { createAttendanceRepository } from './attendance-repository'

function createMockAsyncDb(): AsyncDatabase {
  return {
    exec: vi.fn(async () => ({ rows: [], changes: 0 })),
    exportDatabase: vi.fn(async () => new Uint8Array()),
    importDatabase: vi.fn(async () => undefined),
    restorePreviousDatabase: vi.fn(async () => undefined),
    hasPreviousDatabase: vi.fn(async () => false),
    getDatabaseSizes: vi.fn(async () => ({ current: { raw: 0, compressed: 0 }, prev: { raw: 0, compressed: 0 } })),
    deletePreviousDatabase: vi.fn(async () => undefined),
  }
}

describe('AttendanceRepository', () => {
  describe('findByMonth()', () => {
    let db: AsyncDatabase

    beforeEach(() => {
      db = createMockAsyncDb()
    })

    it('calls db.exec with correct SQL and LIKE param for single-digit month', async () => {
      const repo = createAttendanceRepository(db)
      await repo.findByMonth(2026, 3)

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM attendances WHERE date LIKE ? ORDER BY date DESC',
        ['2026-03%'],
      )
    })

    it('calls db.exec with correct SQL and LIKE param for double-digit month', async () => {
      const repo = createAttendanceRepository(db)
      await repo.findByMonth(2026, 12)

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM attendances WHERE date LIKE ? ORDER BY date DESC',
        ['2026-12%'],
      )
    })

    it('pads single-digit month to two digits', async () => {
      const repo = createAttendanceRepository(db)
      await repo.findByMonth(2025, 1)

      const call = vi.mocked(db.exec).mock.calls[0]
      expect(call![1]).toEqual(['2025-01%'])
    })

    it('returns empty array when no rows match', async () => {
      const repo = createAttendanceRepository(db)
      const result = await repo.findByMonth(2026, 3)

      expect(result).toEqual([])
    })

    it('maps rows to Attendance objects', async () => {
      const mockRows = [
        {
          id: 'att-100',
          employee_id: 'emp-001',
          date: '2026-03-15',
          clock_in: 1742018400000,
          clock_out: 1742050800000,
          type: 'regular',
          created_at: 1742018400000,
          updated_at: 1742018400000,
        },
        {
          id: 'att-101',
          employee_id: 'emp-002',
          date: '2026-03-10',
          clock_in: 1741586400000,
          clock_out: null,
          type: 'paid_leave',
          created_at: 1741586400000,
          updated_at: 1741586400000,
        },
      ]

      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: mockRows,
        changes: 0,
      })

      const repo = createAttendanceRepository(db)
      const result = await repo.findByMonth(2026, 3)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 'att-100',
        employeeId: 'emp-001',
        date: '2026-03-15',
        clockIn: 1742018400000,
        clockOut: 1742050800000,
        type: 'regular',
        createdAt: 1742018400000,
        updatedAt: 1742018400000,
      })
      expect(result[1]).toEqual({
        id: 'att-101',
        employeeId: 'emp-002',
        date: '2026-03-10',
        clockIn: 1741586400000,
        clockOut: undefined,
        type: 'paid_leave',
        createdAt: 1741586400000,
        updatedAt: 1741586400000,
      })
    })

    it('handles year boundary correctly (January)', async () => {
      const repo = createAttendanceRepository(db)
      await repo.findByMonth(2027, 1)

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM attendances WHERE date LIKE ? ORDER BY date DESC',
        ['2027-01%'],
      )
    })

    it('handles year boundary correctly (December)', async () => {
      const repo = createAttendanceRepository(db)
      await repo.findByMonth(2025, 12)

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM attendances WHERE date LIKE ? ORDER BY date DESC',
        ['2025-12%'],
      )
    })
  })
})
