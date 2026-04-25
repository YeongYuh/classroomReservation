import { describe, it, expect } from 'vitest'
import { buildRevenueStats, buildTopTeachers, buildHeatmap } from '../analytics'

describe('buildRevenueStats', () => {
  it('sums amounts correctly across multiple payments', () => {
    const result = buildRevenueStats([
      { amount: 1000, platformFee: 150, teacherAmount: 850 },
      { amount: 500, platformFee: 75, teacherAmount: 425 },
    ])
    expect(result).toEqual({ totalRevenue: 1500, platformFee: 225, teacherAmount: 1275 })
  })

  it('returns zeros for empty input', () => {
    expect(buildRevenueStats([])).toEqual({ totalRevenue: 0, platformFee: 0, teacherAmount: 0 })
  })

  it('handles a single payment', () => {
    const result = buildRevenueStats([{ amount: 300, platformFee: 45, teacherAmount: 255 }])
    expect(result).toEqual({ totalRevenue: 300, platformFee: 45, teacherAmount: 255 })
  })
})

describe('buildTopTeachers', () => {
  it('counts reservations per teacher and sorts DESC', () => {
    const rows = [
      { teacherId: 'a', displayName: 'Alice' },
      { teacherId: 'b', displayName: 'Bob' },
      { teacherId: 'a', displayName: 'Alice' },
      { teacherId: 'b', displayName: 'Bob' },
      { teacherId: 'b', displayName: 'Bob' },
    ]
    const result = buildTopTeachers(rows)
    expect(result[0]).toEqual({ teacherId: 'b', displayName: 'Bob', reservationCount: 3 })
    expect(result[1]).toEqual({ teacherId: 'a', displayName: 'Alice', reservationCount: 2 })
  })

  it('limits result to top 5', () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({
      teacherId: String(i),
      displayName: `Teacher${i}`,
    }))
    expect(buildTopTeachers(rows).length).toBeLessThanOrEqual(5)
  })

  it('returns empty array for no reservations', () => {
    expect(buildTopTeachers([])).toEqual([])
  })
})

describe('buildHeatmap', () => {
  it('returns exactly 168 cells (7 days × 24 hours)', () => {
    expect(buildHeatmap([]).length).toBe(168)
  })

  it('all cells are zero for empty input', () => {
    const cells = buildHeatmap([])
    expect(cells.every((c) => c.count === 0)).toBe(true)
  })

  it('buckets Monday 9am into weekday=0, hour=9', () => {
    // 2026-04-27 is a Monday
    const monday9am = new Date('2026-04-27T09:00:00')
    const cells = buildHeatmap([monday9am, monday9am])
    const cell = cells.find((c) => c.weekday === 0 && c.hour === 9)
    expect(cell?.count).toBe(2)
  })

  it('buckets Sunday into weekday=6', () => {
    // 2026-04-26 is a Sunday
    const sunday10am = new Date('2026-04-26T10:00:00')
    const cells = buildHeatmap([sunday10am])
    const cell = cells.find((c) => c.weekday === 6 && c.hour === 10)
    expect(cell?.count).toBe(1)
  })

  it('covers weekday range 0–6 and hour range 0–23', () => {
    const cells = buildHeatmap([])
    const weekdays = [...new Set(cells.map((c) => c.weekday))].sort()
    const hours = [...new Set(cells.map((c) => c.hour))].sort((a, b) => a - b)
    expect(weekdays).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(hours).toEqual(Array.from({ length: 24 }, (_, i) => i))
  })
})
