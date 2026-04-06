import { describe, it, expect } from 'vitest'
import { formatBytes } from './format-bytes'

describe('formatBytes', () => {
  it('returns "0 B" for 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B')
  })

  it('returns bytes for sizes under 1024', () => {
    expect(formatBytes(512)).toBe('512 B')
  })

  it('returns KB for sizes between 1024 and 1048575', () => {
    expect(formatBytes(1536)).toBe('1.5 KB')
  })

  it('returns MB for sizes >= 1048576', () => {
    expect(formatBytes(5242880)).toBe('5.0 MB')
  })

  it('returns GB for sizes >= 1073741824', () => {
    expect(formatBytes(1073741824)).toBe('1.0 GB')
  })

  it('handles fractional values with 1 decimal', () => {
    expect(formatBytes(1500)).toBe('1.5 KB')
  })

  it('handles exact unit boundaries', () => {
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(1048576)).toBe('1.0 MB')
  })
})
