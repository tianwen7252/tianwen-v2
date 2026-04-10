import { describe, it, expect, beforeEach } from 'vitest'
import i18n from './i18n'
import zhTW from '@/locales/zh-TW.json'

describe('i18n configuration', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('zh-TW')
  })

  describe('initialization', () => {
    it('should initialize with zh-TW as default language', () => {
      expect(i18n.language).toBe('zh-TW')
    })

    it('should have zh-TW as fallback language', () => {
      expect(i18n.options.fallbackLng).toEqual(['zh-TW'])
    })

    it('should have escapeValue disabled for React', () => {
      expect(i18n.options.interpolation?.escapeValue).toBe(false)
    })

    it('should be initialized', () => {
      expect(i18n.isInitialized).toBe(true)
    })
  })

  describe('fallback behavior', () => {
    it('should fall back to zh-TW for unsupported language', () => {
      const result = i18n.t('common.confirm', { lng: 'fr' })
      expect(result).toBe('確認')
    })
  })

  describe('translation completeness', () => {
    it('should not have any empty string values in zh-TW', () => {
      function findEmptyValues(
        obj: Record<string, unknown>,
        prefix = '',
      ): string[] {
        const empties: string[] = []
        for (const [key, value] of Object.entries(obj)) {
          const fullKey = prefix ? `${prefix}.${key}` : key
          if (typeof value === 'string' && value.trim() === '') {
            empties.push(fullKey)
          } else if (typeof value === 'object' && value !== null) {
            empties.push(
              ...findEmptyValues(value as Record<string, unknown>, fullKey),
            )
          }
        }
        return empties
      }

      const empties = findEmptyValues(zhTW as Record<string, unknown>)
      expect(empties).toEqual([])
    })
  })

  describe('translations', () => {
    it('should return zh-TW translation for common.confirm', () => {
      expect(i18n.t('common.confirm')).toBe('確認')
    })

    it('should handle nested keys correctly', () => {
      expect(i18n.t('staff.title')).toBe('員工管理')
      expect(i18n.t('auth.title')).toBe('權限不足')
      expect(i18n.t('error.title')).toBe('發生錯誤')
    })

    it('should return key path for missing translations', () => {
      const result = i18n.t('nonexistent.key')
      expect(result).toBe('nonexistent.key')
    })
  })

  describe('interpolation', () => {
    it('should interpolate {{name}} in staff.confirmDeleteMessage', () => {
      const result = i18n.t('staff.confirmDeleteMessage', { name: 'Alex' })
      expect(result).toBe('確定要刪除員工「Alex」嗎？')
    })

    it('should interpolate {{name}} in clockIn.confirmClockIn', () => {
      const result = i18n.t('clockIn.confirmClockIn', { name: 'Mia' })
      expect(result).toBe('確認 Mia 的上班打卡？')
    })

    it('should interpolate {{date}} and {{weekday}} in clockIn.todayTitle', () => {
      const result = i18n.t('clockIn.todayTitle', {
        date: '2026/3/22',
        weekday: '日',
      })
      expect(result).toBe('今天: 2026/3/22 (日)')
    })

    it('should interpolate {{time}} in clockIn.reClockOutHint', () => {
      const result = i18n.t('clockIn.reClockOutHint', { time: '17:30' })
      expect(result).toBe('目前下班時間: 17:30')
    })

    it('should interpolate {{number}} in records.shiftNumber', () => {
      const result = i18n.t('records.shiftNumber', { number: 2 })
      expect(result).toBe('第 2 班')
    })
  })
})
