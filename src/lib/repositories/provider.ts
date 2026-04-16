/**
 * Repository provider — singleton access to repository instances.
 * Call initRepositories(db) once at app startup, then use
 * getEmployeeRepo() / getAttendanceRepo() / etc. anywhere.
 */

import type { AsyncDatabase } from '@/lib/worker-database'
import {
  createEmployeeRepository,
  type EmployeeRepository,
} from './employee-repository'
import {
  createAttendanceRepository,
  type AttendanceRepository,
} from './attendance-repository'
import {
  createCommodityTypeRepository,
  type CommodityTypeRepository,
} from './commodity-type-repository'
import {
  createCommodityRepository,
  type CommodityRepository,
} from './commodity-repository'
import { createOrderRepository, type OrderRepository } from './order-repository'
import {
  createOrderItemRepository,
  type OrderItemRepository,
} from './order-item-repository'
import {
  createOrderDiscountRepository,
  type OrderDiscountRepository,
} from './order-discount-repository'
import {
  createStatisticsRepository,
  type StatisticsRepository,
} from './statistics-repository'
import {
  createErrorLogRepository,
  type ErrorLogRepository,
} from './error-log-repository'
import {
  createCustomOrderNameRepository,
  type CustomOrderNameRepository,
} from './custom-order-name-repository'
import {
  createBackupLogRepository,
  type BackupLogRepository,
} from './backup-log-repository'
import {
  createOrderTypeRepository,
  type OrderTypeRepository,
} from './order-type-repository'
import {
  createPriceChangeLogRepository,
  type PriceChangeLogRepository,
} from './price-change-log-repository'
import {
  createSettingsRepository,
  type SettingsRepository,
} from './settings-repository'
import {
  createShiftCheckoutRepository,
  type ShiftCheckoutRepository,
} from './shift-checkout-repository'

let employeeRepo: EmployeeRepository | null = null
let attendanceRepo: AttendanceRepository | null = null
let commodityTypeRepo: CommodityTypeRepository | null = null
let commodityRepo: CommodityRepository | null = null
let orderRepo: OrderRepository | null = null
let orderItemRepo: OrderItemRepository | null = null
let orderDiscountRepo: OrderDiscountRepository | null = null
let statisticsRepo: StatisticsRepository | null = null
let errorLogRepo: ErrorLogRepository | null = null
let customOrderNameRepo: CustomOrderNameRepository | null = null
let backupLogRepo: BackupLogRepository | null = null
let orderTypeRepo: OrderTypeRepository | null = null
let priceChangeLogRepo: PriceChangeLogRepository | null = null
let settingsRepo: SettingsRepository | null = null
let shiftCheckoutRepo: ShiftCheckoutRepository | null = null
let dbInstance: AsyncDatabase | null = null

/**
 * Initialize all repositories with the given async database instance.
 * Must be called before any getXxxRepo() calls.
 */
export function initRepositories(db: AsyncDatabase): void {
  dbInstance = db
  employeeRepo = createEmployeeRepository(db)
  attendanceRepo = createAttendanceRepository(db)
  commodityTypeRepo = createCommodityTypeRepository(db)
  commodityRepo = createCommodityRepository(db)
  orderRepo = createOrderRepository(db)
  orderItemRepo = createOrderItemRepository(db)
  orderDiscountRepo = createOrderDiscountRepository(db)
  statisticsRepo = createStatisticsRepository(db)
  errorLogRepo = createErrorLogRepository(db)
  customOrderNameRepo = createCustomOrderNameRepository(db)
  backupLogRepo = createBackupLogRepository(db)
  orderTypeRepo = createOrderTypeRepository(db)
  priceChangeLogRepo = createPriceChangeLogRepository(db)
  settingsRepo = createSettingsRepository(db)
  shiftCheckoutRepo = createShiftCheckoutRepository(db)
}

/**
 * Get the EmployeeRepository singleton.
 * Throws if initRepositories() has not been called.
 */
export function getEmployeeRepo(): EmployeeRepository {
  if (!employeeRepo) {
    throw new Error(
      'Repositories not initialized. Call initRepositories(db) first.',
    )
  }
  return employeeRepo
}

/**
 * Get the AttendanceRepository singleton.
 * Throws if initRepositories() has not been called.
 */
export function getAttendanceRepo(): AttendanceRepository {
  if (!attendanceRepo) {
    throw new Error(
      'Repositories not initialized. Call initRepositories(db) first.',
    )
  }
  return attendanceRepo
}

/**
 * Get the CommodityTypeRepository singleton.
 * Throws if initRepositories() has not been called.
 */
export function getCommodityTypeRepo(): CommodityTypeRepository {
  if (!commodityTypeRepo) {
    throw new Error(
      'Repositories not initialized. Call initRepositories(db) first.',
    )
  }
  return commodityTypeRepo
}

/**
 * Get the CommodityRepository singleton.
 * Throws if initRepositories() has not been called.
 */
export function getCommodityRepo(): CommodityRepository {
  if (!commodityRepo) {
    throw new Error(
      'Repositories not initialized. Call initRepositories(db) first.',
    )
  }
  return commodityRepo
}

/**
 * Get the OrderRepository singleton.
 * Throws if initRepositories() has not been called.
 */
export function getOrderRepo(): OrderRepository {
  if (!orderRepo) {
    throw new Error(
      'Repositories not initialized. Call initRepositories(db) first.',
    )
  }
  return orderRepo
}

/**
 * Get the OrderItemRepository singleton.
 * Throws if initRepositories() has not been called.
 */
export function getOrderItemRepo(): OrderItemRepository {
  if (!orderItemRepo) {
    throw new Error(
      'Repositories not initialized. Call initRepositories(db) first.',
    )
  }
  return orderItemRepo
}

/**
 * Get the OrderDiscountRepository singleton.
 * Throws if initRepositories() has not been called.
 */
export function getOrderDiscountRepo(): OrderDiscountRepository {
  if (!orderDiscountRepo) {
    throw new Error(
      'Repositories not initialized. Call initRepositories(db) first.',
    )
  }
  return orderDiscountRepo
}

/**
 * Get the StatisticsRepository singleton.
 * Throws if initRepositories() has not been called.
 */
export function getStatisticsRepo(): StatisticsRepository {
  if (!statisticsRepo) {
    throw new Error(
      'Repositories not initialized. Call initRepositories(db) first.',
    )
  }
  return statisticsRepo
}

/**
 * Get the ErrorLogRepository singleton.
 * Throws if initRepositories() has not been called.
 */
export function getErrorLogRepo(): ErrorLogRepository {
  if (!errorLogRepo) {
    throw new Error(
      'Repositories not initialized. Call initRepositories(db) first.',
    )
  }
  return errorLogRepo
}

/**
 * Get the CustomOrderNameRepository singleton.
 * Throws if initRepositories() has not been called.
 */
export function getCustomOrderNameRepo(): CustomOrderNameRepository {
  if (!customOrderNameRepo) {
    throw new Error(
      'Repositories not initialized. Call initRepositories(db) first.',
    )
  }
  return customOrderNameRepo
}

/**
 * Get the BackupLogRepository singleton.
 * Throws if initRepositories() has not been called.
 */
export function getBackupLogRepo(): BackupLogRepository {
  if (!backupLogRepo) {
    throw new Error(
      'Repositories not initialized. Call initRepositories(db) first.',
    )
  }
  return backupLogRepo
}

/**
 * Get the OrderTypeRepository singleton.
 * Throws if initRepositories() has not been called.
 */
export function getOrderTypeRepo(): OrderTypeRepository {
  if (!orderTypeRepo) {
    throw new Error(
      'Repositories not initialized. Call initRepositories(db) first.',
    )
  }
  return orderTypeRepo
}

/**
 * Get the PriceChangeLogRepository singleton.
 * Throws if initRepositories() has not been called.
 */
export function getPriceChangeLogRepo(): PriceChangeLogRepository {
  if (!priceChangeLogRepo) {
    throw new Error(
      'Repositories not initialized. Call initRepositories(db) first.',
    )
  }
  return priceChangeLogRepo
}

/**
 * Get the SettingsRepository singleton.
 * Throws if initRepositories() has not been called.
 */
export function getSettingsRepo(): SettingsRepository {
  if (!settingsRepo) {
    throw new Error(
      'Repositories not initialized. Call initRepositories(db) first.',
    )
  }
  return settingsRepo
}

/**
 * Get the ShiftCheckoutRepository singleton.
 * Throws if initRepositories() has not been called.
 */
export function getShiftCheckoutRepo(): ShiftCheckoutRepository {
  if (!shiftCheckoutRepo) {
    throw new Error(
      'Repositories not initialized. Call initRepositories(db) first.',
    )
  }
  return shiftCheckoutRepo
}

/**
 * Get the raw AsyncDatabase instance.
 * Throws if initRepositories() has not been called.
 * Useful for raw SQL queries like table stats.
 */
export function getDatabase(): AsyncDatabase {
  if (!dbInstance) {
    throw new Error(
      'Repositories not initialized. Call initRepositories(db) first.',
    )
  }
  return dbInstance
}

/**
 * Reset all repository singletons to null.
 * Useful for testing or app teardown.
 */
export function resetRepositories(): void {
  employeeRepo = null
  attendanceRepo = null
  commodityTypeRepo = null
  commodityRepo = null
  orderRepo = null
  orderItemRepo = null
  orderDiscountRepo = null
  statisticsRepo = null
  errorLogRepo = null
  customOrderNameRepo = null
  backupLogRepo = null
  orderTypeRepo = null
  priceChangeLogRepo = null
  settingsRepo = null
  shiftCheckoutRepo = null
  dbInstance = null
}
