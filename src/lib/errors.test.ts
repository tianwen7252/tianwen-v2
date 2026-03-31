/**
 * Tests for custom error classes in errors.ts.
 * Covers AuthExpiredError construction, inheritance, and behavior.
 */

import { describe, it, expect } from 'vitest'
import { AuthExpiredError } from './errors'

// ── AuthExpiredError ─────────────────────────────────────────────────────────

describe('AuthExpiredError', () => {
  it('is an instance of Error', () => {
    const err = new AuthExpiredError()
    expect(err).toBeInstanceOf(Error)
  })

  it('is an instance of AuthExpiredError', () => {
    const err = new AuthExpiredError()
    expect(err).toBeInstanceOf(AuthExpiredError)
  })

  it('has name "AuthExpiredError"', () => {
    const err = new AuthExpiredError()
    expect(err.name).toBe('AuthExpiredError')
  })

  it('uses default message when none is provided', () => {
    const err = new AuthExpiredError()
    expect(err.message).toBe('Authentication expired')
  })

  it('uses custom message when provided', () => {
    const err = new AuthExpiredError('Token has expired')
    expect(err.message).toBe('Token has expired')
  })

  it('can be caught as a generic Error', () => {
    const throwAuthExpired = () => {
      throw new AuthExpiredError()
    }

    expect(throwAuthExpired).toThrow(Error)
    expect(throwAuthExpired).toThrow('Authentication expired')
  })

  it('can be distinguished from a generic Error with instanceof', () => {
    const err = new Error('generic')
    expect(err).not.toBeInstanceOf(AuthExpiredError)
  })

  it('has a stack trace', () => {
    const err = new AuthExpiredError()
    expect(err.stack).toBeDefined()
  })
})
