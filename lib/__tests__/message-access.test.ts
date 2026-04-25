import { describe, it, expect } from 'vitest'
import { canAccessThread, buildThreadKey, validateMessageBody } from '../message-access'

describe('canAccessThread', () => {
  it('allows sender to read the thread', () => {
    expect(canAccessThread('user_A', 'user_A', 'user_B')).toBe(true)
  })

  it('allows receiver to read the thread', () => {
    expect(canAccessThread('user_B', 'user_A', 'user_B')).toBe(true)
  })

  it('blocks third party', () => {
    expect(canAccessThread('user_C', 'user_A', 'user_B')).toBe(false)
  })

  it('blocks empty currentUserId', () => {
    expect(canAccessThread('', 'user_A', 'user_B')).toBe(false)
  })
})

describe('buildThreadKey', () => {
  it('produces same key regardless of argument order', () => {
    expect(buildThreadKey('user_A', 'user_B')).toBe(buildThreadKey('user_B', 'user_A'))
  })

  it('produces different keys for different pairs', () => {
    expect(buildThreadKey('user_A', 'user_B')).not.toBe(buildThreadKey('user_A', 'user_C'))
  })

  it('key contains both user ids', () => {
    const key = buildThreadKey('user_A', 'user_B')
    expect(key).toContain('user_A')
    expect(key).toContain('user_B')
  })
})

describe('validateMessageBody', () => {
  it('accepts non-empty body', () => {
    expect(validateMessageBody('Hello!')).toEqual({ valid: true })
  })

  it('rejects empty string', () => {
    const result = validateMessageBody('')
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('rejects whitespace-only string', () => {
    expect(validateMessageBody('   ').valid).toBe(false)
  })

  it('rejects body over 2000 characters', () => {
    expect(validateMessageBody('a'.repeat(2001)).valid).toBe(false)
  })

  it('accepts body exactly 2000 characters', () => {
    expect(validateMessageBody('a'.repeat(2000)).valid).toBe(true)
  })
})
