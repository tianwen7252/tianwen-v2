/**
 * Tests for EmployeeRepository.
 * Uses a mock AsyncDatabase since SQLite WASM cannot run in Node/Vitest.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AsyncDatabase } from '@/lib/worker-database'
import { createEmployeeRepository } from './employee-repository'

function createMockAsyncDb(): AsyncDatabase {
  return {
    exec: vi.fn(async () => ({ rows: [], changes: 0 })),
    exportDatabase: vi.fn(async () => new Uint8Array()),
    importDatabase: vi.fn(async () => undefined),
    restorePreviousDatabase: vi.fn(async () => undefined),
    hasPreviousDatabase: vi.fn(async () => false),
    getPreviousDatabaseSize: vi.fn(async () => 0),
    deletePreviousDatabase: vi.fn(async () => undefined),
  }
}

describe('EmployeeRepository', () => {
  let db: AsyncDatabase

  beforeEach(() => {
    db = createMockAsyncDb()
  })

  // ─── findAll ────────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('calls db.exec with correct SQL', async () => {
      const repo = createEmployeeRepository(db)
      await repo.findAll()

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM employees ORDER BY employee_no ASC',
      )
    })

    it('returns empty array when no rows exist', async () => {
      const repo = createEmployeeRepository(db)
      const result = await repo.findAll()

      expect(result).toEqual([])
    })

    it('maps rows to Employee objects', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'emp-001',
            name: 'Alex',
            avatar: null,
            status: 'active',
            shift_type: 'regular',
            employee_no: 'E001',
            is_admin: 0,
            hire_date: '2025-01-01',
            resignation_date: null,
            google_sub: null,
            google_email: null,
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createEmployeeRepository(db)
      const result = await repo.findAll()

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'emp-001',
        name: 'Alex',
        status: 'active',
        shiftType: 'regular',
        employeeNo: 'E001',
        isAdmin: false,
        hireDate: '2025-01-01',
        resignationDate: undefined,
        googleSub: undefined,
        googleEmail: undefined,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      })
    })

    it('maps is_admin: 1 to isAdmin: true', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'emp-001',
            name: 'Admin',
            avatar: null,
            status: 'active',
            shift_type: 'regular',
            employee_no: 'E001',
            is_admin: 1,
            hire_date: null,
            resignation_date: null,
            google_sub: null,
            google_email: null,
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createEmployeeRepository(db)
      const result = await repo.findAll()

      expect(result[0]!.isAdmin).toBe(true)
    })

    it('maps google_sub to googleSub when present', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'emp-001',
            name: 'Alex',
            avatar: null,
            status: 'active',
            shift_type: 'regular',
            employee_no: 'E001',
            is_admin: 0,
            hire_date: null,
            resignation_date: null,
            google_sub: '112232479673923380065',
            google_email: 'alex@gmail.com',
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createEmployeeRepository(db)
      const result = await repo.findAll()

      expect(result[0]!.googleSub).toBe('112232479673923380065')
      expect(result[0]!.googleEmail).toBe('alex@gmail.com')
    })

    it('maps google_sub: null to googleSub: undefined', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'emp-001',
            name: 'Alex',
            avatar: null,
            status: 'active',
            shift_type: 'regular',
            employee_no: 'E001',
            is_admin: 0,
            hire_date: null,
            resignation_date: null,
            google_sub: null,
            google_email: null,
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createEmployeeRepository(db)
      const result = await repo.findAll()

      expect(result[0]!.googleSub).toBeUndefined()
      expect(result[0]!.googleEmail).toBeUndefined()
    })
  })

  // ─── findById ───────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('calls db.exec with correct SQL and params', async () => {
      const repo = createEmployeeRepository(db)
      await repo.findById('emp-001')

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM employees WHERE id = ?',
        ['emp-001'],
      )
    })

    it('returns undefined when no row found', async () => {
      const repo = createEmployeeRepository(db)
      const result = await repo.findById('emp-999')

      expect(result).toBeUndefined()
    })
  })

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('inserts a new employee and returns it', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // INSERT
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'new-id',
              name: 'New Employee',
              avatar: null,
              status: 'active',
              shift_type: 'regular',
              employee_no: 'E005',
              is_admin: 0,
              hire_date: null,
              resignation_date: null,
              google_sub: null,
              google_email: null,
              created_at: 1700000000000,
              updated_at: 1700000000000,
            },
          ],
          changes: 0,
        }) // findById

      const repo = createEmployeeRepository(db)
      const result = await repo.create({
        name: 'New Employee',
        status: 'active',
        shiftType: 'regular',
        isAdmin: false,
      })

      expect(result.name).toBe('New Employee')
    })
  })

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('returns undefined when employee not found', async () => {
      // findById returns nothing
      vi.mocked(db.exec).mockResolvedValueOnce({ rows: [], changes: 0 })

      const repo = createEmployeeRepository(db)
      const result = await repo.update('emp-999', { name: 'Ghost' })

      expect(result).toBeUndefined()
    })
  })

  // ─── bindGoogleAccount ───────────────────────────────────────────────────────

  describe('bindGoogleAccount()', () => {
    it('updates google_sub and google_email for the given employee', async () => {
      const repo = createEmployeeRepository(db)

      // First call: findById to verify employee exists
      vi.mocked(db.exec)
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'emp-001',
              name: 'Alex',
              avatar: null,
              status: 'active',
              shift_type: 'regular',
              employee_no: 'E001',
              is_admin: 1,
              hire_date: null,
              resignation_date: null,
              google_sub: null,
              google_email: null,
              created_at: 1700000000000,
              updated_at: 1700000000000,
            },
          ],
          changes: 0,
        }) // findById pre-update
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // UPDATE
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'emp-001',
              name: 'Alex',
              avatar: null,
              status: 'active',
              shift_type: 'regular',
              employee_no: 'E001',
              is_admin: 1,
              hire_date: null,
              resignation_date: null,
              google_sub: '112232479673923380065',
              google_email: 'alex@gmail.com',
              created_at: 1700000000000,
              updated_at: 1700000001000,
            },
          ],
          changes: 0,
        }) // findById post-update

      const result = await repo.bindGoogleAccount(
        'emp-001',
        '112232479673923380065',
        'alex@gmail.com',
      )

      expect(result).not.toBeUndefined()
      expect(result!.googleSub).toBe('112232479673923380065')
      expect(result!.googleEmail).toBe('alex@gmail.com')
    })

    it('executes UPDATE SQL with google_sub and google_email', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'emp-001',
              name: 'Alex',
              avatar: null,
              status: 'active',
              shift_type: 'regular',
              employee_no: 'E001',
              is_admin: 1,
              hire_date: null,
              resignation_date: null,
              google_sub: null,
              google_email: null,
              created_at: 1700000000000,
              updated_at: 1700000000000,
            },
          ],
          changes: 0,
        })
        .mockResolvedValueOnce({ rows: [], changes: 0 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'emp-001',
              name: 'Alex',
              avatar: null,
              status: 'active',
              shift_type: 'regular',
              employee_no: 'E001',
              is_admin: 1,
              hire_date: null,
              resignation_date: null,
              google_sub: 'sub-123',
              google_email: 'test@gmail.com',
              created_at: 1700000000000,
              updated_at: 1700000001000,
            },
          ],
          changes: 0,
        })

      const repo = createEmployeeRepository(db)
      await repo.bindGoogleAccount('emp-001', 'sub-123', 'test@gmail.com')

      const updateCall = vi.mocked(db.exec).mock.calls[1]
      expect(updateCall![0]).toContain('google_sub')
      expect(updateCall![0]).toContain('google_email')
      expect(updateCall![1]).toContain('sub-123')
      expect(updateCall![1]).toContain('test@gmail.com')
      expect(updateCall![1]).toContain('emp-001')
    })

    it('returns undefined when employee not found', async () => {
      // findById returns empty
      vi.mocked(db.exec).mockResolvedValueOnce({ rows: [], changes: 0 })

      const repo = createEmployeeRepository(db)
      const result = await repo.bindGoogleAccount(
        'emp-999',
        'sub-abc',
        'none@test.com',
      )

      expect(result).toBeUndefined()
    })

    it('does not mutate existing employee fields', async () => {
      const existingRow = {
        id: 'emp-001',
        name: 'Alex',
        avatar: 'avatar.png',
        status: 'active',
        shift_type: 'regular',
        employee_no: 'E001',
        is_admin: 1,
        hire_date: '2025-01-01',
        resignation_date: null,
        google_sub: null,
        google_email: null,
        created_at: 1700000000000,
        updated_at: 1700000000000,
      }

      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [existingRow], changes: 0 })
        .mockResolvedValueOnce({ rows: [], changes: 0 })
        .mockResolvedValueOnce({
          rows: [
            {
              ...existingRow,
              google_sub: 'new-sub',
              google_email: 'new@gmail.com',
            },
          ],
          changes: 0,
        })

      const repo = createEmployeeRepository(db)
      const result = await repo.bindGoogleAccount(
        'emp-001',
        'new-sub',
        'new@gmail.com',
      )

      // Other fields should remain intact
      expect(result!.name).toBe('Alex')
      expect(result!.avatar).toBe('avatar.png')
      expect(result!.isAdmin).toBe(true)
      expect(result!.hireDate).toBe('2025-01-01')
    })
  })

  // ─── remove ─────────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('calls db.exec with correct SQL', async () => {
      const repo = createEmployeeRepository(db)
      await repo.remove('emp-001')

      expect(db.exec).toHaveBeenCalledWith(
        'DELETE FROM employees WHERE id = ?',
        ['emp-001'],
      )
    })

    it('returns true after deletion', async () => {
      const repo = createEmployeeRepository(db)
      const result = await repo.remove('emp-001')

      expect(result).toBe(true)
    })
  })
})
