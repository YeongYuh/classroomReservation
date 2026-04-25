import { describe, it, expect } from 'vitest'
import { buildEnrollmentView, type RawEnrollment } from '../enrollment-view'

function makeRaw(overrides: Partial<RawEnrollment> = {}): RawEnrollment {
  return {
    id: 'res_1',
    status: 'PAID',
    paidAt: new Date('2026-04-20T10:00:00Z'),
    user: { id: 'user_1', name: 'Alice', email: 'alice@example.com' },
    ...overrides,
  }
}

describe('buildEnrollmentView', () => {
  it('returns userId, displayName, status, paidAt', () => {
    const result = buildEnrollmentView([makeRaw()])
    expect(result[0]).toMatchObject({
      userId: 'user_1',
      displayName: 'Alice',
      status: 'PAID',
    })
    expect(result[0]).toHaveProperty('paidAt')
  })

  it('never exposes email', () => {
    const result = buildEnrollmentView([makeRaw()])
    expect(result[0]).not.toHaveProperty('email')
    expect(JSON.stringify(result[0])).not.toContain('alice@example.com')
  })

  it('uses id as fallback displayName when name is null', () => {
    const result = buildEnrollmentView([makeRaw({ user: { id: 'user_2', name: null, email: 'x@x.com' } })])
    expect(result[0].displayName).toBe('user_2')
  })

  it('handles empty list', () => {
    expect(buildEnrollmentView([])).toEqual([])
  })

  it('preserves all statuses', () => {
    const statuses = ['PENDING', 'PAID', 'ATTENDED', 'CANCELLED'] as const
    const rows = statuses.map((s) => makeRaw({ id: s, status: s }))
    const result = buildEnrollmentView(rows)
    expect(result.map((r) => r.status)).toEqual(statuses)
  })
})
