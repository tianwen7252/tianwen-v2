import { nanoid } from 'nanoid'
import type { AsyncDatabase } from '@/lib/worker-database'
import type { Employee, CreateEmployee } from '@/lib/schemas'

export interface EmployeeRepository {
  findAll(): Promise<Employee[]>
  findById(id: string): Promise<Employee | undefined>
  findByStatus(status: 'active' | 'inactive'): Promise<Employee[]>
  findByEmployeeNo(employeeNo: string): Promise<Employee | undefined>
  create(data: CreateEmployee): Promise<Employee>
  update(
    id: string,
    data: Partial<CreateEmployee>,
  ): Promise<Employee | undefined>
  remove(id: string): Promise<boolean>
  /**
   * Bind a Google account to an employee record.
   * Sets google_sub and google_email for the given employee id.
   * Returns the updated employee, or undefined if not found.
   */
  bindGoogleAccount(
    employeeId: string,
    googleSub: string,
    googleEmail: string,
  ): Promise<Employee | undefined>
}

/**
 * Parse a raw DB row into an Employee object.
 */
function toEmployee(row: Record<string, unknown>): Employee {
  return {
    id: String(row['id']),
    name: String(row['name']),
    avatar: row['avatar'] != null ? String(row['avatar']) : undefined,
    status: (row['status'] as 'active' | 'inactive') ?? 'active',
    shiftType: (row['shift_type'] as 'regular' | 'shift') ?? 'regular',
    employeeNo:
      row['employee_no'] != null ? String(row['employee_no']) : undefined,
    isAdmin: row['is_admin'] === 1 || row['is_admin'] === true,
    hireDate: row['hire_date'] != null ? String(row['hire_date']) : undefined,
    resignationDate:
      row['resignation_date'] != null
        ? String(row['resignation_date'])
        : undefined,
    googleSub:
      row['google_sub'] != null ? String(row['google_sub']) : undefined,
    googleEmail:
      row['google_email'] != null ? String(row['google_email']) : undefined,
    createdAt: Number(row['created_at']),
    updatedAt: Number(row['updated_at']),
  }
}

export function createEmployeeRepository(
  db: AsyncDatabase,
): EmployeeRepository {
  return {
    async findAll() {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM employees ORDER BY employee_no ASC',
      )
      return result.rows.map(toEmployee)
    },

    async findById(id: string) {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM employees WHERE id = ?',
        [id],
      )
      const row = result.rows[0]
      return row ? toEmployee(row) : undefined
    },

    async findByStatus(status: 'active' | 'inactive') {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM employees WHERE status = ? ORDER BY employee_no ASC',
        [status],
      )
      return result.rows.map(toEmployee)
    },

    async findByEmployeeNo(employeeNo: string) {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM employees WHERE employee_no = ?',
        [employeeNo],
      )
      const row = result.rows[0]
      return row ? toEmployee(row) : undefined
    },

    async create(data: CreateEmployee) {
      const id = nanoid()
      const now = Date.now()
      await db.exec(
        `INSERT INTO employees (id, name, avatar, status, shift_type, employee_no, is_admin, hire_date, resignation_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.name,
          data.avatar ?? null,
          data.status,
          data.shiftType,
          data.employeeNo ?? null,
          data.isAdmin ? 1 : 0,
          data.hireDate ?? null,
          data.resignationDate ?? null,
          now,
          now,
        ],
      )
      const created = await this.findById(id)
      return created!
    },

    async update(id: string, data: Partial<CreateEmployee>) {
      const existing = await this.findById(id)
      if (!existing) return undefined

      const fields: string[] = []
      const values: unknown[] = []

      if (data.name !== undefined) {
        fields.push('name = ?')
        values.push(data.name)
      }
      if (data.avatar !== undefined) {
        fields.push('avatar = ?')
        values.push(data.avatar)
      }
      if (data.status !== undefined) {
        fields.push('status = ?')
        values.push(data.status)
      }
      if (data.shiftType !== undefined) {
        fields.push('shift_type = ?')
        values.push(data.shiftType)
      }
      if (data.employeeNo !== undefined) {
        fields.push('employee_no = ?')
        values.push(data.employeeNo)
      }
      if (data.isAdmin !== undefined) {
        fields.push('is_admin = ?')
        values.push(data.isAdmin ? 1 : 0)
      }
      if (data.hireDate !== undefined) {
        fields.push('hire_date = ?')
        values.push(data.hireDate)
      }
      if (data.resignationDate !== undefined) {
        fields.push('resignation_date = ?')
        values.push(data.resignationDate)
      }

      if (fields.length === 0) return existing

      fields.push('updated_at = ?')
      values.push(Date.now())
      values.push(id)

      await db.exec(
        `UPDATE employees SET ${fields.join(', ')} WHERE id = ?`,
        values,
      )
      const updated = await this.findById(id)
      return updated!
    },

    async remove(id: string) {
      await db.exec('DELETE FROM employees WHERE id = ?', [id])
      return true
    },

    async bindGoogleAccount(
      employeeId: string,
      googleSub: string,
      googleEmail: string,
    ) {
      const existing = await this.findById(employeeId)
      if (!existing) return undefined

      await db.exec(
        'UPDATE employees SET google_sub = ?, google_email = ?, updated_at = ? WHERE id = ?',
        [googleSub, googleEmail, Date.now(), employeeId],
      )
      const updated = await this.findById(employeeId)
      return updated!
    },
  }
}
