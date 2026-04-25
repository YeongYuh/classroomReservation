import { describe, it, expect } from 'vitest'
import { classifyForBatchCancellation, type ReservationForCancel } from '../batch-cancel'

function makeRes(overrides: Partial<ReservationForCancel> = {}): ReservationForCancel {
  return {
    id: 'res_1',
    status: 'PAID',
    payment: { id: 'pay_1', txnId: 'txn_001', status: 'COMPLETED' },
    user: { email: 'alice@example.com', name: 'Alice' },
    ...overrides,
  }
}

describe('classifyForBatchCancellation', () => {
  it('PAID + COMPLETED payment with txnId → needsRefund', () => {
    const { needsRefund, noRefund, skip } = classifyForBatchCancellation([makeRes()])
    expect(needsRefund).toHaveLength(1)
    expect(noRefund).toHaveLength(0)
    expect(skip).toHaveLength(0)
  })

  it('PAID + no payment record → noRefund (enroll without paying edge case)', () => {
    const { needsRefund, noRefund } = classifyForBatchCancellation([makeRes({ payment: null })])
    expect(needsRefund).toHaveLength(0)
    expect(noRefund).toHaveLength(1)
  })

  it('PAID + payment not COMPLETED (PENDING) → noRefund', () => {
    const { needsRefund, noRefund } = classifyForBatchCancellation([
      makeRes({ payment: { id: 'pay_1', txnId: null, status: 'PENDING' } }),
    ])
    expect(needsRefund).toHaveLength(0)
    expect(noRefund).toHaveLength(1)
  })

  it('PENDING reservation → noRefund', () => {
    const { needsRefund, noRefund } = classifyForBatchCancellation([makeRes({ status: 'PENDING' })])
    expect(needsRefund).toHaveLength(0)
    expect(noRefund).toHaveLength(1)
  })

  it('already CANCELLED → skip', () => {
    const { skip } = classifyForBatchCancellation([makeRes({ status: 'CANCELLED' })])
    expect(skip).toHaveLength(1)
  })

  it('ATTENDED → skip', () => {
    const { skip } = classifyForBatchCancellation([makeRes({ status: 'ATTENDED' })])
    expect(skip).toHaveLength(1)
  })

  it('handles mixed list correctly', () => {
    const reservations = [
      makeRes({ id: 'a', status: 'PAID' }),
      makeRes({ id: 'b', status: 'PENDING', payment: null }),
      makeRes({ id: 'c', status: 'CANCELLED' }),
    ]
    const { needsRefund, noRefund, skip } = classifyForBatchCancellation(reservations)
    expect(needsRefund.map((r) => r.id)).toEqual(['a'])
    expect(noRefund.map((r) => r.id)).toEqual(['b'])
    expect(skip.map((r) => r.id)).toEqual(['c'])
  })

  it('handles empty list', () => {
    const result = classifyForBatchCancellation([])
    expect(result.needsRefund).toHaveLength(0)
    expect(result.noRefund).toHaveLength(0)
    expect(result.skip).toHaveLength(0)
  })
})
