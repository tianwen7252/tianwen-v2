/**
 * Tests for OrderTypeRepository.
 * Uses a mock AsyncDatabase since SQLite WASM cannot run in Node/Vitest.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AsyncDatabase } from '@/lib/worker-database'
import { createOrderTypeRepository } from './order-type-repository'

function createMockAsyncDb(): AsyncDatabase {
  return {
    exec: vi.fn(async () => ({ rows: [], changes: 0 })),
    exportDatabase: vi.fn(async () => new Uint8Array()),
    importDatabase: vi.fn(async () => undefined),
    restorePreviousDatabase: vi.fn(async () => undefined),
    hasPreviousDatabase: vi.fn(async () => false),
  }
}

describe('OrderTypeRepository', () => {
  let db: AsyncDatabase

  beforeEach(() => {
    db = createMockAsyncDb()
  })

  // ─── findAll ────────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('calls db.exec with correct SQL', async () => {
      const repo = createOrderTypeRepository(db)
      await repo.findAll()

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM order_types ORDER BY priority ASC, name ASC',
      )
    })

    it('returns empty array when no rows exist', async () => {
      const repo = createOrderTypeRepository(db)
      const result = await repo.findAll()

      expect(result).toEqual([])
    })

    it('maps rows to OrderType objects', async () => {
      const mockRows = [
        {
          id: 'ot-001',
          name: '攤位',
          priority: 1,
          type: 'order',
          color: 'green',
          editor: null,
          created_at: 1700000000000,
          updated_at: 1700000000000,
        },
        {
          id: 'ot-002',
          name: '外送',
          priority: 2,
          type: 'order',
          color: 'blue',
          editor: 'admin',
          created_at: 1700000000000,
          updated_at: 1700000000000,
        },
      ]

      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: mockRows,
        changes: 0,
      })

      const repo = createOrderTypeRepository(db)
      const result = await repo.findAll()

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 'ot-001',
        name: '攤位',
        priority: 1,
        type: 'order',
        color: 'green',
        editor: undefined,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      })
      expect(result[1]).toEqual({
        id: 'ot-002',
        name: '外送',
        priority: 2,
        type: 'order',
        color: 'blue',
        editor: 'admin',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      })
    })

    it('handles null color as undefined', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'ot-001',
            name: '攤位',
            priority: 1,
            type: 'order',
            color: null,
            editor: null,
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createOrderTypeRepository(db)
      const result = await repo.findAll()

      expect(result[0]!.color).toBeUndefined()
    })
  })

  // ─── findById ───────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('calls db.exec with correct SQL and param', async () => {
      const repo = createOrderTypeRepository(db)
      await repo.findById('ot-001')

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM order_types WHERE id = ?',
        ['ot-001'],
      )
    })

    it('returns undefined when no row found', async () => {
      const repo = createOrderTypeRepository(db)
      const result = await repo.findById('non-existent')

      expect(result).toBeUndefined()
    })

    it('returns mapped OrderType when row found', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'ot-001',
            name: '攤位',
            priority: 1,
            type: 'order',
            color: 'green',
            editor: null,
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createOrderTypeRepository(db)
      const result = await repo.findById('ot-001')

      expect(result).toEqual({
        id: 'ot-001',
        name: '攤位',
        priority: 1,
        type: 'order',
        color: 'green',
        editor: undefined,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      })
    })
  })

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('calls db.exec with INSERT SQL and correct params', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'generated-id',
              name: '攤位',
              priority: 1,
              type: 'order',
              color: 'green',
              editor: null,
              created_at: 1700000000000,
              updated_at: 1700000000000,
            },
          ],
          changes: 0,
        })

      const repo = createOrderTypeRepository(db)
      await repo.create({
        name: '攤位',
        priority: 1,
        type: 'order',
        color: 'green',
      })

      const insertCall = vi.mocked(db.exec).mock.calls[0]
      expect(insertCall![0]).toContain('INSERT INTO order_types')
      expect(insertCall![1]).toEqual(
        expect.arrayContaining(['攤位', 1, 'order', 'green']),
      )
    })

    it('returns the created OrderType', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'generated-id',
              name: '外送',
              priority: 2,
              type: 'order',
              color: 'blue',
              editor: null,
              created_at: 1700000000000,
              updated_at: 1700000000000,
            },
          ],
          changes: 0,
        })

      const repo = createOrderTypeRepository(db)
      const result = await repo.create({
        name: '外送',
        priority: 2,
        type: 'order',
        color: 'blue',
      })

      expect(result).toEqual({
        id: 'generated-id',
        name: '外送',
        priority: 2,
        type: 'order',
        color: 'blue',
        editor: undefined,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      })
    })

    it('handles optional fields (color, editor) as null', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'generated-id',
              name: '自取',
              priority: 3,
              type: 'order',
              color: null,
              editor: null,
              created_at: 1700000000000,
              updated_at: 1700000000000,
            },
          ],
          changes: 0,
        })

      const repo = createOrderTypeRepository(db)
      const result = await repo.create({
        name: '自取',
        priority: 3,
        type: 'order',
      })

      expect(result.color).toBeUndefined()
      expect(result.editor).toBeUndefined()
    })
  })

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('returns undefined when item does not exist', async () => {
      const repo = createOrderTypeRepository(db)
      const result = await repo.update('non-existent', { name: '新名稱' })

      expect(result).toBeUndefined()
    })

    it('returns existing item when no fields provided', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'ot-001',
            name: '攤位',
            priority: 1,
            type: 'order',
            color: 'green',
            editor: null,
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createOrderTypeRepository(db)
      const result = await repo.update('ot-001', {})

      expect(result).toBeDefined()
      expect(result!.name).toBe('攤位')
    })

    it('calls UPDATE with correct fields for partial update', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'ot-001',
              name: '攤位',
              priority: 1,
              type: 'order',
              color: 'green',
              editor: null,
              created_at: 1700000000000,
              updated_at: 1700000000000,
            },
          ],
          changes: 0,
        })
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'ot-001',
              name: '內用',
              priority: 1,
              type: 'order',
              color: 'red',
              editor: null,
              created_at: 1700000000000,
              updated_at: 1700000050000,
            },
          ],
          changes: 0,
        })

      const repo = createOrderTypeRepository(db)
      const result = await repo.update('ot-001', { name: '內用', color: 'red' })

      const updateCall = vi.mocked(db.exec).mock.calls[1]
      expect(updateCall![0]).toContain('UPDATE order_types SET')
      expect(updateCall![0]).toContain('name = ?')
      expect(updateCall![0]).toContain('color = ?')
      expect(updateCall![0]).toContain('updated_at = ?')

      expect(result).toBeDefined()
      expect(result!.name).toBe('內用')
      expect(result!.color).toBe('red')
    })

    it('can update priority field', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'ot-001',
              name: '攤位',
              priority: 1,
              type: 'order',
              color: 'green',
              editor: null,
              created_at: 1700000000000,
              updated_at: 1700000000000,
            },
          ],
          changes: 0,
        })
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'ot-001',
              name: '攤位',
              priority: 5,
              type: 'order',
              color: 'green',
              editor: null,
              created_at: 1700000000000,
              updated_at: 1700000050000,
            },
          ],
          changes: 0,
        })

      const repo = createOrderTypeRepository(db)
      const result = await repo.update('ot-001', { priority: 5 })

      const updateCall = vi.mocked(db.exec).mock.calls[1]
      expect(updateCall![0]).toContain('priority = ?')
      expect(result!.priority).toBe(5)
    })
  })

  // ─── remove ─────────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('calls db.exec with DELETE SQL and correct param', async () => {
      const repo = createOrderTypeRepository(db)
      await repo.remove('ot-001')

      expect(db.exec).toHaveBeenCalledWith(
        'DELETE FROM order_types WHERE id = ?',
        ['ot-001'],
      )
    })

    it('returns true when row was deleted', async () => {
      db.exec = vi.fn(async () => ({ rows: [], changes: 1 }))
      const repo = createOrderTypeRepository(db)
      const result = await repo.remove('ot-001')

      expect(result).toBe(true)
    })

    it('returns false when row did not exist', async () => {
      db.exec = vi.fn(async () => ({ rows: [], changes: 0 }))
      const repo = createOrderTypeRepository(db)
      const result = await repo.remove('non-existent')

      expect(result).toBe(false)
    })
  })

  // ─── updatePriorities ──────────────────────────────────────────────────────

  describe('updatePriorities()', () => {
    it('calls db.exec for each ID with correct priority', async () => {
      const repo = createOrderTypeRepository(db)
      await repo.updatePriorities(['ot-002', 'ot-001', 'ot-003'])

      // Should call exec 3 times
      expect(db.exec).toHaveBeenCalledTimes(3)

      // First call: ot-002 gets priority 1
      const call0 = vi.mocked(db.exec).mock.calls[0]
      expect(call0![0]).toContain(
        'UPDATE order_types SET priority = ?, updated_at = ? WHERE id = ?',
      )
      expect(call0![1]![0]).toBe(1) // priority
      expect(call0![1]![2]).toBe('ot-002') // id

      // Second call: ot-001 gets priority 2
      const call1 = vi.mocked(db.exec).mock.calls[1]
      expect(call1![1]![0]).toBe(2)
      expect(call1![1]![2]).toBe('ot-001')

      // Third call: ot-003 gets priority 3
      const call2 = vi.mocked(db.exec).mock.calls[2]
      expect(call2![1]![0]).toBe(3)
      expect(call2![1]![2]).toBe('ot-003')
    })

    it('does nothing when given empty array', async () => {
      const repo = createOrderTypeRepository(db)
      await repo.updatePriorities([])

      expect(db.exec).not.toHaveBeenCalled()
    })

    it('handles single item array', async () => {
      const repo = createOrderTypeRepository(db)
      await repo.updatePriorities(['ot-001'])

      expect(db.exec).toHaveBeenCalledTimes(1)
      const call0 = vi.mocked(db.exec).mock.calls[0]
      expect(call0![1]![0]).toBe(1)
      expect(call0![1]![2]).toBe('ot-001')
    })
  })
})
