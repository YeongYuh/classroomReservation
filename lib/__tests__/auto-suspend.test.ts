import { describe, it, expect } from 'vitest'
import { shouldAutoSuspend, type SuspendCheckInput } from '../auto-suspend'

function makeInput(overrides: Partial<SuspendCheckInput> = {}): SuspendCheckInput {
  return {
    plan: 'MONTHLY',
    billingDay: 1,
    today: new Date('2026-05-10'), // day 10, billing on 1 → 9 days overdue
    hasPaymentThisMonth: false,
    ...overrides,
  }
}

describe('shouldAutoSuspend', () => {
  it('suspends MONTHLY teacher past grace period with no payment', () => {
    expect(shouldAutoSuspend(makeInput())).toBe(true)
  })

  it('does NOT suspend if payment exists this month', () => {
    expect(shouldAutoSuspend(makeInput({ hasPaymentThisMonth: true }))).toBe(false)
  })

  it('does NOT suspend PERCENTAGE plan teachers', () => {
    expect(shouldAutoSuspend(makeInput({ plan: 'PERCENTAGE' }))).toBe(false)
  })

  it('does NOT suspend within grace period (billingDay + 5 days)', () => {
    // billingDay=1, today=5th → exactly at grace period boundary (1+5=6, day 5 is ok)
    expect(shouldAutoSuspend(makeInput({ today: new Date('2026-05-05') }))).toBe(false)
  })

  it('does NOT suspend on the first overdue day inside grace window', () => {
    // billingDay=1, grace=5 → suspend only when day > 6
    expect(shouldAutoSuspend(makeInput({ today: new Date('2026-05-06') }))).toBe(false)
  })

  it('suspends on first day after grace window', () => {
    // billingDay=1, grace=5 → day 7 is past grace (1+5+1=7)
    expect(shouldAutoSuspend(makeInput({ today: new Date('2026-05-07') }))).toBe(true)
  })

  it('does NOT suspend when billingDay is null (not configured)', () => {
    expect(shouldAutoSuspend(makeInput({ billingDay: null }))).toBe(false)
  })

  it('handles billingDay=28 correctly at end of month', () => {
    // billing on 28th, today=5th of next month → 5 days past + grace
    const input = makeInput({ billingDay: 28, today: new Date('2026-06-05') })
    expect(shouldAutoSuspend(input)).toBe(true)
  })

  it('does NOT suspend when today is before billing day', () => {
    // billing on 15th, today=10th → not yet due
    expect(shouldAutoSuspend(makeInput({ billingDay: 15, today: new Date('2026-05-10') }))).toBe(false)
  })
})
