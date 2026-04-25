import { describe, it, expect } from 'vitest'
import { isRefundable } from '../refund'

describe('isRefundable', () => {
  it('returns true when course starts more than 24 hours from now', () => {
    const future = new Date(Date.now() + 25 * 60 * 60 * 1000)
    expect(isRefundable(future)).toBe(true)
  })

  it('returns false when course starts in less than 24 hours', () => {
    const soon = new Date(Date.now() + 23 * 60 * 60 * 1000)
    expect(isRefundable(soon)).toBe(false)
  })

  it('returns false when course starts exactly at 24 hours boundary', () => {
    const exact = new Date(Date.now() + 24 * 60 * 60 * 1000 - 1)
    expect(isRefundable(exact)).toBe(false)
  })

  it('returns false when course has already started', () => {
    const past = new Date(Date.now() - 1000)
    expect(isRefundable(past)).toBe(false)
  })
})
