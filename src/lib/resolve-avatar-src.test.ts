/**
 * Tests for resolveAvatarSrc utility.
 */

import { describe, it, expect } from 'vitest'
import { resolveAvatarSrc } from './resolve-avatar-src'

describe('resolveAvatarSrc', () => {
  describe('filename-only input (new format)', () => {
    it('prepends base path for a plain filename', () => {
      expect(resolveAvatarSrc('doberman.png')).toBe('images/aminals/doberman.png')
    })

    it('prepends base path for any .png filename', () => {
      expect(resolveAvatarSrc('deer.png')).toBe(
        'images/aminals/deer.png',
      )
    })

    it('prepends base path for .jpg filename', () => {
      expect(resolveAvatarSrc('avatar.jpg')).toBe('images/aminals/avatar.jpg')
    })
  })

  describe('backward compatibility — full local paths (old DB records)', () => {
    it('returns full path as-is when it already contains a slash', () => {
      expect(resolveAvatarSrc('images/aminals/doberman.png')).toBe(
        'images/aminals/doberman.png',
      )
    })

    it('returns absolute path as-is', () => {
      expect(resolveAvatarSrc('/images/aminals/puppy.png')).toBe(
        '/images/aminals/puppy.png',
      )
    })

    it('returns any path with a directory separator as-is', () => {
      expect(resolveAvatarSrc('some/other/path.png')).toBe(
        'some/other/path.png',
      )
    })
  })

  describe('backward compatibility — http URLs', () => {
    it('returns http URL as-is', () => {
      expect(resolveAvatarSrc('http://example.com/avatar.png')).toBe(
        'http://example.com/avatar.png',
      )
    })

    it('returns https URL as-is', () => {
      expect(
        resolveAvatarSrc('https://lh3.googleusercontent.com/photo.jpg'),
      ).toBe('https://lh3.googleusercontent.com/photo.jpg')
    })
  })

  describe('edge cases', () => {
    it('returns empty string for empty input', () => {
      expect(resolveAvatarSrc('')).toBe('')
    })
  })
})
