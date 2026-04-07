/**
 * Tests for seed data module.
 * Verifies seed data arrays have correct structure and values.
 */

import { describe, it, expect } from 'vitest'
import {
  SEED_EMPLOYEES,
  buildSeedAttendances,
  SEED_COMMODITY_TYPES,
  SEED_COMMODITIES,
} from './seed-data'

describe('Seed Data', () => {
  describe('SEED_COMMODITY_TYPES', () => {
    it('has 4 categories', () => {
      expect(SEED_COMMODITY_TYPES).toHaveLength(4)
    })

    it('contains bento, single, drink, dumpling typeIds', () => {
      const typeIds = SEED_COMMODITY_TYPES.map(ct => ct.typeId)
      expect(typeIds).toEqual(['bento', 'single', 'drink', 'dumpling'])
    })

    it('each item has required fields', () => {
      for (const ct of SEED_COMMODITY_TYPES) {
        expect(ct.id).toBeTruthy()
        expect(ct.typeId).toBeTruthy()
        expect(ct.type).toBeTruthy()
        expect(ct.label).toBeTruthy()
        expect(typeof ct.createdAt).toBe('number')
        expect(typeof ct.updatedAt).toBe('number')
      }
    })

    it('has correct labels from V1', () => {
      const labels = SEED_COMMODITY_TYPES.map(ct => ct.label)
      expect(labels).toEqual(['餐盒', '單點', '飲料', '水餃'])
    })
  })

  describe('SEED_COMMODITIES', () => {
    it('has 48 total items (19 bento + 15 single + 9 drink + 5 dumpling)', () => {
      expect(SEED_COMMODITIES).toHaveLength(48)
    })

    it('has correct item counts per category', () => {
      const bento = SEED_COMMODITIES.filter(c => c.typeId === 'bento')
      const single = SEED_COMMODITIES.filter(c => c.typeId === 'single')
      const drink = SEED_COMMODITIES.filter(c => c.typeId === 'drink')
      const dumpling = SEED_COMMODITIES.filter(c => c.typeId === 'dumpling')
      expect(bento).toHaveLength(19)
      expect(single).toHaveLength(15)
      expect(drink).toHaveLength(9)
      expect(dumpling).toHaveLength(5)
    })

    it('all items have unique ids', () => {
      const ids = SEED_COMMODITIES.map(com => com.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('all items have positive prices', () => {
      for (const com of SEED_COMMODITIES) {
        expect(com.price).toBeGreaterThan(0)
      }
    })

    it('all items are on market by default', () => {
      for (const com of SEED_COMMODITIES) {
        expect(com.onMarket).toBe(true)
      }
    })

    it('first bento item is 油淋雞腿飯 at $140', () => {
      expect(SEED_COMMODITIES[0]!.name).toBe('油淋雞腿飯')
      expect(SEED_COMMODITIES[0]!.price).toBe(140)
    })

    it('bento 加蛋, 加菜, 加菜(大), and 白飯 have hideOnMode', () => {
      const hidden = SEED_COMMODITIES.filter(c => c.hideOnMode != null)
      expect(hidden).toHaveLength(4)
      expect(hidden.map(c => c.name)).toEqual(['加蛋', '加菜', '加菜(大)', '白飯'])
    })
  })

  describe('SEED_EMPLOYEES', () => {
    it('has 8 employees', () => {
      expect(SEED_EMPLOYEES).toHaveLength(8)
    })
  })

  describe('buildSeedAttendances()', () => {
    it('returns a new array each call (immutable)', () => {
      const a1 = buildSeedAttendances()
      const a2 = buildSeedAttendances()
      expect(a1).not.toBe(a2)
      expect(a1).toHaveLength(a2.length)
      // Compare structure without timestamp fields which may differ by ~1ms between calls
      for (let i = 0; i < a1.length; i++) {
        expect(a1[i]!.id).toBe(a2[i]!.id)
        expect(a1[i]!.employeeId).toBe(a2[i]!.employeeId)
        expect(a1[i]!.date).toBe(a2[i]!.date)
        expect(a1[i]!.clockIn).toBe(a2[i]!.clockIn)
        expect(a1[i]!.clockOut).toBe(a2[i]!.clockOut)
        expect(a1[i]!.type).toBe(a2[i]!.type)
        expect(typeof a1[i]!.createdAt).toBe('number')
        expect(typeof a1[i]!.updatedAt).toBe('number')
      }
    })
  })
})
