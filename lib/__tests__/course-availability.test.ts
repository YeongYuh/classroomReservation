import { describe, it, expect } from 'vitest'
import { isCourseAvailable, remainingSlots } from '../course-availability'

describe('isCourseAvailable', () => {
  it('returns true when no one has paid', () => {
    expect(isCourseAvailable(0, 10)).toBe(true)
  })

  it('returns true when one slot remains', () => {
    expect(isCourseAvailable(9, 10)).toBe(true)
  })

  it('returns false when exactly full', () => {
    expect(isCourseAvailable(10, 10)).toBe(false)
  })

  it('returns false when over-filled (defensive)', () => {
    expect(isCourseAvailable(11, 10)).toBe(false)
  })

  it('returns false when maxSlots is 0', () => {
    expect(isCourseAvailable(0, 0)).toBe(false)
  })
})

describe('remainingSlots', () => {
  it('returns full capacity when no one has paid', () => {
    expect(remainingSlots(0, 10)).toBe(10)
  })

  it('returns correct remaining count', () => {
    expect(remainingSlots(3, 10)).toBe(7)
  })

  it('returns 0 when full', () => {
    expect(remainingSlots(10, 10)).toBe(0)
  })

  it('clamps to 0 on overflow (defensive)', () => {
    expect(remainingSlots(11, 10)).toBe(0)
  })
})
