/**
 * Tests for device utility functions.
 * Covers device ID generation/caching, device type detection, and device name read/write.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─── Mock localStorage ──────────────────────────────────────────────────────

const localStorageStore: Record<string, string> = {}
const mockLocalStorage = {
  getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageStore[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageStore[key]
  }),
  clear: vi.fn(() => {
    Object.keys(localStorageStore).forEach(k => delete localStorageStore[k])
  }),
}

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
})

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('device utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
    vi.resetModules()
    // Reset getItem to use the in-memory store (cleared above)
    mockLocalStorage.getItem.mockImplementation(
      (key: string) => localStorageStore[key] ?? null,
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getDeviceId', () => {
    it('generates a new ID when none exists in localStorage', async () => {
      const { getDeviceId } = await import('./device')
      const id = getDeviceId()

      expect(id).toBeTruthy()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('stores the generated ID in localStorage', async () => {
      const { getDeviceId } = await import('./device')
      getDeviceId()

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'DEVICE_ID',
        expect.any(String),
      )
    })

    it('returns the same ID on subsequent calls (reads from localStorage)', async () => {
      const { getDeviceId } = await import('./device')
      const first = getDeviceId()
      const second = getDeviceId()

      expect(first).toBe(second)
    })

    it('returns the existing ID if one is already stored', async () => {
      mockLocalStorage.getItem.mockReturnValue('existing-device-id')
      const { getDeviceId } = await import('./device')
      const id = getDeviceId()

      expect(id).toBe('existing-device-id')
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
    })

    it('generates a non-empty string ID', async () => {
      const { getDeviceId } = await import('./device')
      const id = getDeviceId()

      expect(id).not.toBe('')
    })
  })

  describe('getDeviceType', () => {
    it('returns "Android-phone" for Android mobile user agent', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) Mobile Safari/537.36',
        writable: true,
        configurable: true,
      })
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 1,
        writable: true,
        configurable: true,
      })

      const { getDeviceType } = await import('./device')
      expect(getDeviceType()).toBe('Android-phone')
    })

    it('returns "Android-tablet" for Android tablet user agent', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 13; Nexus 10) AppleWebKit/537.36',
        writable: true,
        configurable: true,
      })
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 5,
        writable: true,
        configurable: true,
      })

      const { getDeviceType } = await import('./device')
      expect(getDeviceType()).toBe('Android-tablet')
    })

    it('returns "iPhone" for iPhone user agent', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        writable: true,
        configurable: true,
      })
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 5,
        writable: true,
        configurable: true,
      })

      const { getDeviceType } = await import('./device')
      expect(getDeviceType()).toBe('iPhone')
    })

    it('returns "iPad" for legacy iPad user agent', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)',
        writable: true,
        configurable: true,
      })
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 5,
        writable: true,
        configurable: true,
      })

      const { getDeviceType } = await import('./device')
      expect(getDeviceType()).toBe('iPad')
    })

    it('returns "iPad" for iPadOS 13+ masquerading as Macintosh with touch points', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
        writable: true,
        configurable: true,
      })
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 5,
        writable: true,
        configurable: true,
      })

      const { getDeviceType } = await import('./device')
      expect(getDeviceType()).toBe('iPad')
    })

    it('returns "Mac" for real Macintosh with no touch points', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        writable: true,
        configurable: true,
      })
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        writable: true,
        configurable: true,
      })

      const { getDeviceType } = await import('./device')
      expect(getDeviceType()).toBe('Mac')
    })

    it('returns "Browser" for unknown user agent', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Unknown Device)',
        writable: true,
        configurable: true,
      })
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        writable: true,
        configurable: true,
      })

      const { getDeviceType } = await import('./device')
      expect(getDeviceType()).toBe('Browser')
    })
  })

  describe('getDeviceName', () => {
    it('returns null when no device name is set', async () => {
      const { getDeviceName } = await import('./device')
      const name = getDeviceName()

      expect(name).toBeNull()
    })

    it('returns the stored device name from localStorage', async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'DEVICE_NAME') return 'Dining Room iPad'
        return null
      })

      const { getDeviceName } = await import('./device')
      const name = getDeviceName()

      expect(name).toBe('Dining Room iPad')
    })

    it('reads from DEVICE_NAME key in localStorage', async () => {
      const { getDeviceName } = await import('./device')
      getDeviceName()

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('DEVICE_NAME')
    })
  })

  describe('getDefaultDeviceName', () => {
    it('returns "{type}-{id}" format', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Unknown Device)',
        writable: true,
        configurable: true,
      })
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        writable: true,
        configurable: true,
      })

      const { getDefaultDeviceName, getDeviceId } = await import('./device')
      const id = getDeviceId()
      expect(getDefaultDeviceName()).toBe(`Browser-${id}`)
    })
  })

  describe('getDeviceDisplayName', () => {
    it('returns custom name when set', async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'DEVICE_NAME') return 'iPad-MAIN'
        if (key === 'DEVICE_ID') return 'abc123'
        return null
      })

      const { getDeviceDisplayName } = await import('./device')
      expect(getDeviceDisplayName()).toBe('iPad-MAIN')
    })

    it('falls back to default name when no custom name set', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Unknown Device)',
        writable: true,
        configurable: true,
      })
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        writable: true,
        configurable: true,
      })

      const { getDeviceDisplayName, getDeviceId } = await import('./device')
      const id = getDeviceId()
      expect(getDeviceDisplayName()).toBe(`Browser-${id}`)
    })
  })

  describe('setDeviceName', () => {
    it('writes the device name to localStorage', async () => {
      const { setDeviceName } = await import('./device')
      setDeviceName('Bar Counter')

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'DEVICE_NAME',
        'Bar Counter',
      )
    })

    it('can set a name with special characters', async () => {
      const { setDeviceName } = await import('./device')
      setDeviceName('Kitchen 廚房')

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'DEVICE_NAME',
        'Kitchen 廚房',
      )
    })

    it('overwrites existing device name', async () => {
      const { setDeviceName, getDeviceName } = await import('./device')
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'DEVICE_NAME') return 'Old Name'
        return null
      })

      setDeviceName('New Name')

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'DEVICE_NAME',
        'New Name',
      )
      // After setting, getDeviceName should use the new value
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'DEVICE_NAME') return 'New Name'
        return null
      })
      expect(getDeviceName()).toBe('New Name')
    })
  })
})
