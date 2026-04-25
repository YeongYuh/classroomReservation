import { describe, it, expect } from 'vitest'
import { checkCanCancel, type CancelCheckInput } from '../cancel-check'

const futureStart = new Date(Date.now() + 48 * 60 * 60 * 1000)
const pastStart = new Date(Date.now() - 1000)

function makeInput(overrides: Partial<CancelCheckInput> = {}): CancelCheckInput {
  return {
    reservationStatus: 'PAID',
    courseStartAt: futureStart,
    ...overrides,
  }
}

describe('checkCanCancel', () => {
  it('allows cancellation of a PAID future course', () => {
    const result = checkCanCancel(makeInput())
    expect(result.canCancel).toBe(true)
  })

  it('allows cancellation of a PENDING future course', () => {
    const result = checkCanCancel(makeInput({ reservationStatus: 'PENDING' }))
    expect(result.canCancel).toBe(true)
  })

  it('rejects already CANCELLED reservation', () => {
    const result = checkCanCancel(makeInput({ reservationStatus: 'CANCELLED' }))
    expect(result.canCancel).toBe(false)
    expect(result.error).toMatch(/已取消/)
  })

  it('rejects ATTENDED reservation', () => {
    const result = checkCanCancel(makeInput({ reservationStatus: 'ATTENDED' }))
    expect(result.canCancel).toBe(false)
    expect(result.error).toMatch(/已出席/)
  })

  it('rejects when course has already started', () => {
    const result = checkCanCancel(makeInput({ courseStartAt: pastStart }))
    expect(result.canCancel).toBe(false)
    expect(result.error).toMatch(/已開始/)
  })

  it('includes isRefundable=true when course starts in more than 24 hours', () => {
    const result = checkCanCancel(makeInput({ courseStartAt: new Date(Date.now() + 25 * 60 * 60 * 1000) }))
    expect(result.canCancel).toBe(true)
    expect(result.isRefundable).toBe(true)
  })

  it('includes isRefundable=false when course starts in less than 24 hours', () => {
    const result = checkCanCancel(makeInput({ courseStartAt: new Date(Date.now() + 23 * 60 * 60 * 1000) }))
    expect(result.canCancel).toBe(false)
    expect(result.error).toMatch(/24 小時/)
  })
})
