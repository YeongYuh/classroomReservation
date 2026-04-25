import { describe, it, expect } from 'vitest'
import { checkCanReserve } from '../reservation-check'

const base = {
  courseStatus: 'ACTIVE' as const,
  paidCount: 3,
  maxSlots: 10,
  hasExistingReservation: false,
}

describe('checkCanReserve', () => {
  it('allows a valid reservation', () => {
    expect(checkCanReserve(base).canReserve).toBe(true)
  })

  it('rejects when course is CANCELLED', () => {
    const r = checkCanReserve({ ...base, courseStatus: 'CANCELLED' })
    expect(r.canReserve).toBe(false)
    expect(r.statusCode).toBe(400)
  })

  it('rejects when course is COMPLETED', () => {
    const r = checkCanReserve({ ...base, courseStatus: 'COMPLETED' })
    expect(r.canReserve).toBe(false)
    expect(r.statusCode).toBe(400)
  })

  it('rejects with 409 when course is exactly full', () => {
    const r = checkCanReserve({ ...base, paidCount: 10, maxSlots: 10 })
    expect(r.canReserve).toBe(false)
    expect(r.statusCode).toBe(409)
  })

  it('rejects with 409 when course is over-full', () => {
    const r = checkCanReserve({ ...base, paidCount: 11, maxSlots: 10 })
    expect(r.canReserve).toBe(false)
    expect(r.statusCode).toBe(409)
  })

  it('rejects with 400 when user already has a reservation', () => {
    const r = checkCanReserve({ ...base, hasExistingReservation: true })
    expect(r.canReserve).toBe(false)
    expect(r.statusCode).toBe(400)
  })

  it('returns 409 (full) before 400 (duplicate) when both apply', () => {
    const r = checkCanReserve({ ...base, paidCount: 10, maxSlots: 10, hasExistingReservation: true })
    expect(r.statusCode).toBe(409)
  })

  it('returns error message on rejection', () => {
    const r = checkCanReserve({ ...base, paidCount: 10, maxSlots: 10 })
    expect(typeof r.error).toBe('string')
    expect(r.error!.length).toBeGreaterThan(0)
  })
})
