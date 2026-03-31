import { describe, it, expect, vi } from 'vitest'
import { CREATE_TABLES, initSchema, SCHEMA_VERSION } from './schema'

describe('schema', () => {
  describe('SCHEMA_VERSION', () => {
    it('should be version 1', () => {
      expect(SCHEMA_VERSION).toBe(1)
    })
  })

  describe('CREATE_TABLES', () => {
    it('should include all 7 core tables', () => {
      const tables = [
        'commodity_types',
        'commodities',
        'orders',
        'order_types',
        'daily_data',
        'employees',
        'attendances',
      ]

      for (const table of tables) {
        expect(CREATE_TABLES).toContain(`CREATE TABLE IF NOT EXISTS ${table}`)
      }
    })

    it('should include schema_meta table for version tracking', () => {
      expect(CREATE_TABLES).toContain('CREATE TABLE IF NOT EXISTS schema_meta')
    })

    it('should create indexes on orders.created_at', () => {
      expect(CREATE_TABLES).toContain('idx_orders_created_at')
    })

    it('should create indexes on daily_data.date', () => {
      expect(CREATE_TABLES).toContain('idx_daily_data_date')
    })

    it('should create composite index on attendances(employee_id, date)', () => {
      expect(CREATE_TABLES).toContain('idx_attendances_employee_date')
    })

    it('should define foreign key from commodities to commodity_types', () => {
      expect(CREATE_TABLES).toContain(
        'FOREIGN KEY (type_id) REFERENCES commodity_types(type_id)',
      )
    })

    it('should define foreign key from attendances to employees', () => {
      expect(CREATE_TABLES).toContain(
        'FOREIGN KEY (employee_id) REFERENCES employees(id)',
      )
    })

    it('should include price_change_logs table', () => {
      expect(CREATE_TABLES).toContain(
        'CREATE TABLE IF NOT EXISTS price_change_logs',
      )
    })

    it('should create index on price_change_logs.created_at', () => {
      expect(CREATE_TABLES).toContain('idx_price_change_logs_created_at')
    })

    it('should use TEXT primary keys for nanoid compatibility', () => {
      // All core tables should use TEXT PRIMARY KEY (not INTEGER autoincrement)
      // to support nanoid-generated IDs in V2
      const textPkPattern = /id TEXT PRIMARY KEY/g
      const matches = CREATE_TABLES.match(textPkPattern)
      // 13 core tables use "id TEXT PRIMARY KEY"
      // schema_meta uses "key TEXT PRIMARY KEY" (different column name)
      expect(matches?.length).toBe(13)
    })

    it('should not include a data column in the orders table DDL', () => {
      // V2-56: orders.data was removed — ensure it stays removed from fresh DDL
      const ordersSection = CREATE_TABLES.slice(
        CREATE_TABLES.indexOf('CREATE TABLE IF NOT EXISTS orders'),
        CREATE_TABLES.indexOf('CREATE TABLE IF NOT EXISTS order_types'),
      )
      expect(ordersSection).not.toContain('data TEXT')
      expect(ordersSection).not.toContain('data BLOB')
    })
  })

  describe('initSchema', () => {
    it('should enable foreign keys, create tables, and run migrations', () => {
      const mockExec = vi.fn()
      initSchema(mockExec)
      expect(mockExec).toHaveBeenNthCalledWith(1, 'PRAGMA foreign_keys = ON')
      expect(mockExec).toHaveBeenNthCalledWith(2, CREATE_TABLES)
      // Third call is the V2-76 rename migration for commodity_types
      expect(mockExec).toHaveBeenNthCalledWith(
        3,
        'ALTER TABLE commondity_types RENAME TO commodity_types',
      )
    })
  })
})
