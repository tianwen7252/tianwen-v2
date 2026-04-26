import { nanoid } from 'nanoid'
import type { AsyncDatabase } from '@/lib/worker-database'
import type { Attendance, CreateAttendance } from '@/lib/schemas'

export interface AttendanceRepository {
  findAll(): Promise<Attendance[]>
  findById(id: string): Promise<Attendance | undefined>
  findByEmployeeId(employeeId: string): Promise<Attendance[]>
  findByDate(date: string): Promise<Attendance[]>
  findByEmployeeAndDate(
    employeeId: string,
    date: string,
  ): Promise<Attendance | undefined>
  findByMonth(year: number, month: number): Promise<Attendance[]>
  create(data: CreateAttendance): Promise<Attendance>
  update(
    id: string,
    data: Partial<CreateAttendance>,
  ): Promise<Attendance | undefined>
  remove(id: string): Promise<boolean>
}

function toAttendance(row: Record<string, unknown>): Attendance {
  return {
    id: String(row['id']),
    employeeId: String(row['employee_id']),
    date: String(row['date']),
    clockIn: row['clock_in'] != null ? Number(row['clock_in']) : undefined,
    clockOut: row['clock_out'] != null ? Number(row['clock_out']) : undefined,
    type: (row['type'] as Attendance['type']) ?? 'regular',
    createdAt: Number(row['created_at']),
    updatedAt: Number(row['updated_at']),
  }
}

export function createAttendanceRepository(
  db: AsyncDatabase,
): AttendanceRepository {
  return {
    async findAll() {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM attendances ORDER BY date DESC',
      )
      return result.rows.map(toAttendance)
    },

    async findById(id: string) {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM attendances WHERE id = ?',
        [id],
      )
      const row = result.rows[0]
      return row ? toAttendance(row) : undefined
    },

    async findByEmployeeId(employeeId: string) {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM attendances WHERE employee_id = ? ORDER BY date DESC',
        [employeeId],
      )
      return result.rows.map(toAttendance)
    },

    async findByDate(date: string) {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM attendances WHERE date = ?',
        [date],
      )
      return result.rows.map(toAttendance)
    },

    async findByEmployeeAndDate(employeeId: string, date: string) {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM attendances WHERE employee_id = ? AND date = ?',
        [employeeId, date],
      )
      const row = result.rows[0]
      return row ? toAttendance(row) : undefined
    },

    async findByMonth(year: number, month: number) {
      const prefix = `${year}-${String(month).padStart(2, '0')}%`
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM attendances WHERE date LIKE ? ORDER BY date DESC',
        [prefix],
      )
      return result.rows.map(toAttendance)
    },

    async create(data: CreateAttendance) {
      const id = nanoid()
      await db.exec(
        `INSERT INTO attendances (id, employee_id, date, clock_in, clock_out, type)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.employeeId,
          data.date,
          data.clockIn ?? null,
          data.clockOut ?? null,
          data.type,
        ],
      )
      const created = await this.findById(id)
      if (!created) {
        throw new Error(
          `Attendance INSERT for id="${id}" succeeded but row could not be re-read`,
        )
      }
      return created
    },

    async update(id: string, data: Partial<CreateAttendance>) {
      const existing = await this.findById(id)
      if (!existing) return undefined

      const fields: string[] = []
      const values: unknown[] = []

      if (data.clockIn !== undefined) {
        fields.push('clock_in = ?')
        values.push(data.clockIn)
      }
      if (data.clockOut !== undefined) {
        fields.push('clock_out = ?')
        values.push(data.clockOut)
      }
      if (data.type !== undefined) {
        fields.push('type = ?')
        values.push(data.type)
      }

      if (fields.length === 0) return existing

      values.push(id)
      await db.exec(
        `UPDATE attendances SET ${fields.join(', ')} WHERE id = ?`,
        values,
      )
      const updated = await this.findById(id)
      if (!updated) {
        throw new Error(
          `Attendance UPDATE for id="${id}" succeeded but row could not be re-read`,
        )
      }
      return updated
    },

    async remove(id: string) {
      const result = await db.exec('DELETE FROM attendances WHERE id = ?', [id])
      return (result.changes ?? 0) > 0
    },
  }
}
