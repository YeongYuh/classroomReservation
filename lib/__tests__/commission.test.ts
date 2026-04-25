import { describe, it, expect } from 'vitest'
import { calculateCommission } from '../commission'

describe('calculateCommission', () => {
  it('splits 15% correctly on 1000 NT (in cents: 100000)', () => {
    const { platformFee, teacherAmount } = calculateCommission(100000, 0.15)
    expect(platformFee).toBe(150)
    expect(teacherAmount).toBe(850)
  })

  it('platformFee + teacherAmount equals full amount', () => {
    const { platformFee, teacherAmount } = calculateCommission(99900, 0.2)
    expect(Math.round((platformFee + teacherAmount) * 100)).toBe(99900)
  })

  it('rounds platform fee to 2 decimal places', () => {
    const { platformFee } = calculateCommission(10000, 0.333)
    const decimalPlaces = (platformFee.toString().split('.')[1] ?? '').length
    expect(decimalPlaces).toBeLessThanOrEqual(2)
  })
})
