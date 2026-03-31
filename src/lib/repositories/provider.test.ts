/**
 * Tests for the repository provider module.
 * Verifies singleton lifecycle: init, get, reset.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { AsyncDatabase } from '@/lib/worker-database'

import {
  initRepositories,
  getEmployeeRepo,
  getAttendanceRepo,
  getCommodityTypeRepo,
  getCommodityRepo,
  getOrderRepo,
  getOrderItemRepo,
  getOrderDiscountRepo,
  getStatisticsRepo,
  getErrorLogRepo,
  getOrderTypeRepo,
  getPriceChangeLogRepo,
  resetRepositories,
} from './provider'

function createMockAsyncDb(): AsyncDatabase {
  return {
    exec: vi.fn(async () => ({ rows: [], changes: 0 })),
    exportDatabase: vi.fn(async () => new Uint8Array()),
  }
}

describe('Repository Provider', () => {
  beforeEach(() => {
    // Ensure clean state before each test
    resetRepositories()
  })

  describe('getEmployeeRepo()', () => {
    it('throws before initRepositories() is called', () => {
      expect(() => getEmployeeRepo()).toThrow(
        'Repositories not initialized. Call initRepositories(db) first.',
      )
    })

    it('returns a repository after initRepositories() is called', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      const repo = getEmployeeRepo()
      expect(repo).toBeDefined()
      expect(typeof repo.findAll).toBe('function')
      expect(typeof repo.findById).toBe('function')
      expect(typeof repo.create).toBe('function')
      expect(typeof repo.update).toBe('function')
      expect(typeof repo.remove).toBe('function')
      expect(typeof repo.findByStatus).toBe('function')
      expect(typeof repo.findByEmployeeNo).toBe('function')
    })

    it('returns the same instance on repeated calls', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      const repo1 = getEmployeeRepo()
      const repo2 = getEmployeeRepo()
      expect(repo1).toBe(repo2)
    })
  })

  describe('getAttendanceRepo()', () => {
    it('throws before initRepositories() is called', () => {
      expect(() => getAttendanceRepo()).toThrow(
        'Repositories not initialized. Call initRepositories(db) first.',
      )
    })

    it('returns a repository after initRepositories() is called', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      const repo = getAttendanceRepo()
      expect(repo).toBeDefined()
      expect(typeof repo.findAll).toBe('function')
      expect(typeof repo.findById).toBe('function')
      expect(typeof repo.create).toBe('function')
      expect(typeof repo.update).toBe('function')
      expect(typeof repo.remove).toBe('function')
      expect(typeof repo.findByEmployeeId).toBe('function')
      expect(typeof repo.findByDate).toBe('function')
      expect(typeof repo.findByEmployeeAndDate).toBe('function')
      expect(typeof repo.findByMonth).toBe('function')
    })

    it('returns the same instance on repeated calls', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      const repo1 = getAttendanceRepo()
      const repo2 = getAttendanceRepo()
      expect(repo1).toBe(repo2)
    })
  })

  describe('getCommodityTypeRepo()', () => {
    it('throws before initRepositories() is called', () => {
      expect(() => getCommodityTypeRepo()).toThrow(
        'Repositories not initialized. Call initRepositories(db) first.',
      )
    })

    it('returns a repository after initRepositories() is called', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      const repo = getCommodityTypeRepo()
      expect(repo).toBeDefined()
      expect(typeof repo.findAll).toBe('function')
      expect(typeof repo.findById).toBe('function')
      expect(typeof repo.findByTypeId).toBe('function')
      expect(typeof repo.create).toBe('function')
      expect(typeof repo.remove).toBe('function')
    })

    it('returns the same instance on repeated calls', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      const repo1 = getCommodityTypeRepo()
      const repo2 = getCommodityTypeRepo()
      expect(repo1).toBe(repo2)
    })
  })

  describe('getCommodityRepo()', () => {
    it('throws before initRepositories() is called', () => {
      expect(() => getCommodityRepo()).toThrow(
        'Repositories not initialized. Call initRepositories(db) first.',
      )
    })

    it('returns a repository after initRepositories() is called', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      const repo = getCommodityRepo()
      expect(repo).toBeDefined()
      expect(typeof repo.findAll).toBe('function')
      expect(typeof repo.findById).toBe('function')
      expect(typeof repo.findByTypeId).toBe('function')
      expect(typeof repo.findOnMarket).toBe('function')
      expect(typeof repo.create).toBe('function')
      expect(typeof repo.update).toBe('function')
      expect(typeof repo.remove).toBe('function')
    })

    it('returns the same instance on repeated calls', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      const repo1 = getCommodityRepo()
      const repo2 = getCommodityRepo()
      expect(repo1).toBe(repo2)
    })
  })

  describe('getOrderRepo()', () => {
    it('throws before initRepositories() is called', () => {
      expect(() => getOrderRepo()).toThrow(
        'Repositories not initialized. Call initRepositories(db) first.',
      )
    })

    it('returns a repository after initRepositories() is called', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      const repo = getOrderRepo()
      expect(repo).toBeDefined()
      expect(typeof repo.findAll).toBe('function')
      expect(typeof repo.findById).toBe('function')
      expect(typeof repo.findByDateRange).toBe('function')
      expect(typeof repo.create).toBe('function')
      expect(typeof repo.getNextOrderNumber).toBe('function')
    })

    it('returns the same instance on repeated calls', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      const repo1 = getOrderRepo()
      const repo2 = getOrderRepo()
      expect(repo1).toBe(repo2)
    })
  })

  describe('getOrderItemRepo()', () => {
    it('throws before initRepositories() is called', () => {
      expect(() => getOrderItemRepo()).toThrow(
        'Repositories not initialized. Call initRepositories(db) first.',
      )
    })

    it('returns a repository after initRepositories() is called', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      const repo = getOrderItemRepo()
      expect(repo).toBeDefined()
      expect(typeof repo.findByOrderId).toBe('function')
      expect(typeof repo.createBatch).toBe('function')
      expect(typeof repo.removeByOrderId).toBe('function')
    })

    it('returns the same instance on repeated calls', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      const repo1 = getOrderItemRepo()
      const repo2 = getOrderItemRepo()
      expect(repo1).toBe(repo2)
    })
  })

  describe('getOrderDiscountRepo()', () => {
    it('throws before initRepositories() is called', () => {
      expect(() => getOrderDiscountRepo()).toThrow(
        'Repositories not initialized. Call initRepositories(db) first.',
      )
    })

    it('returns a repository after initRepositories() is called', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      const repo = getOrderDiscountRepo()
      expect(repo).toBeDefined()
      expect(typeof repo.findByOrderId).toBe('function')
      expect(typeof repo.createBatch).toBe('function')
      expect(typeof repo.removeByOrderId).toBe('function')
    })

    it('returns the same instance on repeated calls', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      const repo1 = getOrderDiscountRepo()
      const repo2 = getOrderDiscountRepo()
      expect(repo1).toBe(repo2)
    })
  })

  describe('resetRepositories()', () => {
    it('causes getEmployeeRepo() to throw after reset', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      // Sanity: getter works before reset
      expect(() => getEmployeeRepo()).not.toThrow()

      resetRepositories()

      expect(() => getEmployeeRepo()).toThrow(
        'Repositories not initialized. Call initRepositories(db) first.',
      )
    })

    it('causes getAttendanceRepo() to throw after reset', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      expect(() => getAttendanceRepo()).not.toThrow()

      resetRepositories()

      expect(() => getAttendanceRepo()).toThrow(
        'Repositories not initialized. Call initRepositories(db) first.',
      )
    })

    it('causes getCommodityTypeRepo() to throw after reset', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      expect(() => getCommodityTypeRepo()).not.toThrow()

      resetRepositories()

      expect(() => getCommodityTypeRepo()).toThrow(
        'Repositories not initialized. Call initRepositories(db) first.',
      )
    })

    it('causes getCommodityRepo() to throw after reset', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      expect(() => getCommodityRepo()).not.toThrow()

      resetRepositories()

      expect(() => getCommodityRepo()).toThrow(
        'Repositories not initialized. Call initRepositories(db) first.',
      )
    })

    it('causes getOrderRepo() to throw after reset', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      expect(() => getOrderRepo()).not.toThrow()

      resetRepositories()

      expect(() => getOrderRepo()).toThrow(
        'Repositories not initialized. Call initRepositories(db) first.',
      )
    })

    it('causes getOrderItemRepo() to throw after reset', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      expect(() => getOrderItemRepo()).not.toThrow()

      resetRepositories()

      expect(() => getOrderItemRepo()).toThrow(
        'Repositories not initialized. Call initRepositories(db) first.',
      )
    })

    it('causes getOrderDiscountRepo() to throw after reset', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      expect(() => getOrderDiscountRepo()).not.toThrow()

      resetRepositories()

      expect(() => getOrderDiscountRepo()).toThrow(
        'Repositories not initialized. Call initRepositories(db) first.',
      )
    })

    it('allows re-initialization after reset', () => {
      const db1 = createMockAsyncDb()
      const db2 = createMockAsyncDb()

      initRepositories(db1)
      // Verify repo works before reset
      expect(() => getEmployeeRepo()).not.toThrow()

      resetRepositories()
      initRepositories(db2)

      const repoAfterReset = getEmployeeRepo()
      // Should be a new instance since we used a different db
      expect(repoAfterReset).toBeDefined()
      expect(typeof repoAfterReset.findAll).toBe('function')
    })
  })

  describe('getStatisticsRepo()', () => {
    it('throws before initRepositories() is called', () => {
      expect(() => getStatisticsRepo()).toThrow(
        'Repositories not initialized. Call initRepositories(db) first.',
      )
    })

    it('returns a repository after initRepositories() is called', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      const repo = getStatisticsRepo()
      expect(repo).toBeDefined()
      expect(typeof repo.getProductKpis).toBe('function')
      expect(typeof repo.getHourlyOrderDistribution).toBe('function')
      expect(typeof repo.getTopProducts).toBe('function')
      expect(typeof repo.getBottomBentos).toBe('function')
      expect(typeof repo.getDailyRevenue).toBe('function')
      expect(typeof repo.getAvgOrderValue).toBe('function')
      expect(typeof repo.getStaffKpis).toBe('function')
      expect(typeof repo.getEmployeeHours).toBe('function')
      expect(typeof repo.getDailyHeadcount).toBe('function')
      expect(typeof repo.getDailyAttendeeList).toBe('function')
    })

    it('returns the same instance on repeated calls', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      const repo1 = getStatisticsRepo()
      const repo2 = getStatisticsRepo()
      expect(repo1).toBe(repo2)
    })
  })

  describe('resetRepositories() — statisticsRepo', () => {
    it('causes getStatisticsRepo() to throw after reset', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      expect(() => getStatisticsRepo()).not.toThrow()

      resetRepositories()

      expect(() => getStatisticsRepo()).toThrow(
        'Repositories not initialized. Call initRepositories(db) first.',
      )
    })
  })

  describe('getErrorLogRepo()', () => {
    it('throws before initRepositories() is called', () => {
      expect(() => getErrorLogRepo()).toThrow(
        'Repositories not initialized. Call initRepositories(db) first.',
      )
    })

    it('returns a repository after initRepositories() is called', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      const repo = getErrorLogRepo()
      expect(repo).toBeDefined()
      expect(typeof repo.create).toBe('function')
      expect(typeof repo.findRecent).toBe('function')
      expect(typeof repo.findPaginated).toBe('function')
      expect(typeof repo.clearAll).toBe('function')
      expect(typeof repo.count).toBe('function')
    })

    it('returns the same instance on repeated calls', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      const repo1 = getErrorLogRepo()
      const repo2 = getErrorLogRepo()
      expect(repo1).toBe(repo2)
    })
  })

  describe('resetRepositories() -- errorLogRepo', () => {
    it('causes getErrorLogRepo() to throw after reset', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      expect(() => getErrorLogRepo()).not.toThrow()

      resetRepositories()

      expect(() => getErrorLogRepo()).toThrow(
        'Repositories not initialized. Call initRepositories(db) first.',
      )
    })
  })

  describe('getOrderTypeRepo()', () => {
    it('throws before initRepositories() is called', () => {
      expect(() => getOrderTypeRepo()).toThrow(
        'Repositories not initialized. Call initRepositories(db) first.',
      )
    })

    it('returns a repository after initRepositories() is called', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      const repo = getOrderTypeRepo()
      expect(repo).toBeDefined()
      expect(typeof repo.findAll).toBe('function')
      expect(typeof repo.findById).toBe('function')
      expect(typeof repo.create).toBe('function')
      expect(typeof repo.update).toBe('function')
      expect(typeof repo.remove).toBe('function')
      expect(typeof repo.updatePriorities).toBe('function')
    })

    it('returns the same instance on repeated calls', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      const repo1 = getOrderTypeRepo()
      const repo2 = getOrderTypeRepo()
      expect(repo1).toBe(repo2)
    })
  })

  describe('resetRepositories() -- orderTypeRepo', () => {
    it('causes getOrderTypeRepo() to throw after reset', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      expect(() => getOrderTypeRepo()).not.toThrow()

      resetRepositories()

      expect(() => getOrderTypeRepo()).toThrow(
        'Repositories not initialized. Call initRepositories(db) first.',
      )
    })
  })

  describe('getPriceChangeLogRepo()', () => {
    it('throws before initRepositories() is called', () => {
      expect(() => getPriceChangeLogRepo()).toThrow(
        'Repositories not initialized. Call initRepositories(db) first.',
      )
    })

    it('returns a repository after initRepositories() is called', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      const repo = getPriceChangeLogRepo()
      expect(repo).toBeDefined()
      expect(typeof repo.findAll).toBe('function')
      expect(typeof repo.count).toBe('function')
      expect(typeof repo.create).toBe('function')
    })

    it('returns the same instance on repeated calls', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      const repo1 = getPriceChangeLogRepo()
      const repo2 = getPriceChangeLogRepo()
      expect(repo1).toBe(repo2)
    })
  })

  describe('resetRepositories() -- priceChangeLogRepo', () => {
    it('causes getPriceChangeLogRepo() to throw after reset', () => {
      const db = createMockAsyncDb()
      initRepositories(db)

      expect(() => getPriceChangeLogRepo()).not.toThrow()

      resetRepositories()

      expect(() => getPriceChangeLogRepo()).toThrow(
        'Repositories not initialized. Call initRepositories(db) first.',
      )
    })
  })

  describe('initRepositories()', () => {
    it('can be called with a valid AsyncDatabase object', () => {
      const db = createMockAsyncDb()
      expect(() => initRepositories(db)).not.toThrow()
    })
  })
})
