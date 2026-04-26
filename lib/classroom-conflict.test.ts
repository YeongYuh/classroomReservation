import { describe, it, expect } from 'vitest'
import { hasConflict } from './classroom-conflict'

const d = (h: number, m = 0) => new Date(2026, 3, 25, h, m)

describe('hasConflict', () => {
  const existing = [{ startAt: d(10), endAt: d(12) }]

  it('returns false when no existing bookings', () => {
    expect(hasConflict([], d(10), d(12))).toBe(false)
  })

  it('returns false when slot is before existing', () => {
    expect(hasConflict(existing, d(8), d(10))).toBe(false)
  })

  it('returns false when slot is after existing', () => {
    expect(hasConflict(existing, d(12), d(14))).toBe(false)
  })

  it('returns false for touching end (newStart === existing.endAt)', () => {
    expect(hasConflict(existing, d(12), d(13))).toBe(false)
  })

  it('returns false for touching start (newEnd === existing.startAt)', () => {
    expect(hasConflict(existing, d(9), d(10))).toBe(false)
  })

  it('returns true for partial overlap at start', () => {
    expect(hasConflict(existing, d(9), d(11))).toBe(true)
  })

  it('returns true for partial overlap at end', () => {
    expect(hasConflict(existing, d(11), d(13))).toBe(true)
  })

  it('returns true when new slot fully contains existing', () => {
    expect(hasConflict(existing, d(9), d(13))).toBe(true)
  })

  it('returns true when existing fully contains new slot', () => {
    expect(hasConflict(existing, d(10, 30), d(11, 30))).toBe(true)
  })

  it('handles multiple existing bookings', () => {
    const multi = [
      { startAt: d(8), endAt: d(10) },
      { startAt: d(14), endAt: d(16) },
    ]
    expect(hasConflict(multi, d(10), d(14))).toBe(false)
    expect(hasConflict(multi, d(9), d(11))).toBe(true)
    expect(hasConflict(multi, d(13), d(15))).toBe(true)
  })
})
