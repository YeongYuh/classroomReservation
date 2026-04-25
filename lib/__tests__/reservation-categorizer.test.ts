import { describe, it, expect } from 'vitest'
import { categorizeReservations, type ReservationForDisplay } from '../reservation-categorizer'

const now = new Date('2026-04-24T12:00:00Z')

function makeRes(
  overrides: Partial<ReservationForDisplay> & { startAt?: Date }
): ReservationForDisplay {
  return {
    id: 'res_1',
    courseId: 'course_1',
    status: 'PAID',
    qrCode: null,
    paidAt: new Date('2026-04-20T10:00:00Z'),
    hasReview: false,
    course: {
      title: 'Yoga',
      location: '台北',
      startAt: new Date('2026-04-30T10:00:00Z'),
      durationMin: 60,
      price: '500',
      teacher: { displayName: '老師甲', avatarUrl: null },
    },
    ...overrides,
  }
}

describe('categorizeReservations', () => {
  it('puts PAID future course in upcoming', () => {
    const { upcoming, history } = categorizeReservations([makeRes({})], now)
    expect(upcoming).toHaveLength(1)
    expect(history).toHaveLength(0)
  })

  it('puts PAID past course in history', () => {
    const pastRes = makeRes({ course: { ...makeRes({}).course, startAt: new Date('2026-04-01T10:00:00Z') } })
    const { upcoming, history } = categorizeReservations([pastRes], now)
    expect(upcoming).toHaveLength(0)
    expect(history).toHaveLength(1)
  })

  it('puts ATTENDED in history', () => {
    const { upcoming, history } = categorizeReservations([makeRes({ status: 'ATTENDED' })], now)
    expect(upcoming).toHaveLength(0)
    expect(history).toHaveLength(1)
  })

  it('puts CANCELLED in history', () => {
    const { upcoming, history } = categorizeReservations([makeRes({ status: 'CANCELLED' })], now)
    expect(upcoming).toHaveLength(0)
    expect(history).toHaveLength(1)
  })

  it('excludes PENDING from both lists', () => {
    const { upcoming, history } = categorizeReservations([makeRes({ status: 'PENDING' })], now)
    expect(upcoming).toHaveLength(0)
    expect(history).toHaveLength(0)
  })

  it('sorts upcoming by startAt ascending', () => {
    const a = makeRes({ id: 'a', course: { ...makeRes({}).course, startAt: new Date('2026-05-10T10:00:00Z') } })
    const b = makeRes({ id: 'b', course: { ...makeRes({}).course, startAt: new Date('2026-05-01T10:00:00Z') } })
    const { upcoming } = categorizeReservations([a, b], now)
    expect(upcoming[0].id).toBe('b')
    expect(upcoming[1].id).toBe('a')
  })

  it('handles empty list', () => {
    const { upcoming, history } = categorizeReservations([], now)
    expect(upcoming).toHaveLength(0)
    expect(history).toHaveLength(0)
  })
})
