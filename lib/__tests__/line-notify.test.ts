import { describe, it, expect } from 'vitest'
import { buildEnrollmentNotifyMessage, type EnrollmentNotifyPayload } from '../line-notify'

const payload: EnrollmentNotifyPayload = {
  courseTitle: '瑜珈入門班',
  studentName: 'Alice',
  startAt: new Date('2026-05-01T10:00:00+08:00'),
  currentCount: 3,
  maxSlots: 10,
}

describe('buildEnrollmentNotifyMessage', () => {
  it('includes course title', () => {
    expect(buildEnrollmentNotifyMessage(payload)).toContain('瑜珈入門班')
  })

  it('includes student name', () => {
    expect(buildEnrollmentNotifyMessage(payload)).toContain('Alice')
  })

  it('includes slot count', () => {
    const msg = buildEnrollmentNotifyMessage(payload)
    expect(msg).toContain('3')
    expect(msg).toContain('10')
  })

  it('starts with newline (LINE Notify convention)', () => {
    expect(buildEnrollmentNotifyMessage(payload).startsWith('\n')).toBe(true)
  })

  it('differs when student name changes', () => {
    const other = buildEnrollmentNotifyMessage({ ...payload, studentName: 'Bob' })
    expect(buildEnrollmentNotifyMessage(payload)).not.toBe(other)
  })
})
