/**
 * Client-side device utility functions.
 * Handles device ID generation, device type detection, and device name management.
 */

import { nanoid } from 'nanoid'

const DEVICE_ID_KEY = 'DEVICE_ID'
const DEVICE_NAME_KEY = 'DEVICE_NAME'

/**
 * Get or generate a persistent device ID stored in localStorage.
 * Generates a new nanoid on the first call and caches it for subsequent calls.
 */
export function getDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_ID_KEY)
  if (existing !== null) return existing

  const id = nanoid()
  localStorage.setItem(DEVICE_ID_KEY, id)
  return id
}

/**
 * Detect the device type based on the user agent string.
 * Handles Android phones/tablets, iPhone, iPad (legacy and iPadOS 13+),
 * real Mac, and generic browser fallback.
 */
export function getDeviceType(): string {
  const ua = navigator.userAgent

  // Android
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'Android-phone' : 'Android-tablet'

  // iPhone
  if (/iPhone/.test(ua)) return 'iPhone'

  // iPad (legacy or forced mobile mode)
  if (/iPad/.test(ua)) return 'iPad'

  // iPad masquerading as Mac (iPadOS 13+)
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return 'iPad'

  // Real Mac
  if (/Macintosh/.test(ua)) return 'Mac'

  return 'Browser'
}

/**
 * Read the device name from localStorage.
 * Returns null if no device name has been set.
 */
export function getDeviceName(): string | null {
  return localStorage.getItem(DEVICE_NAME_KEY)
}

/**
 * Persist the device name in localStorage.
 */
export function setDeviceName(name: string): void {
  localStorage.setItem(DEVICE_NAME_KEY, name)
}
