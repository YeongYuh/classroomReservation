import { describe, it, expect } from 'vitest'
import { filterActiveAds } from '../ads'

const past = new Date('2026-01-01T00:00:00')
const future = new Date('2026-12-31T23:59:59')
const now = new Date('2026-04-25T12:00:00')

function makeAd(overrides: Partial<{ isActive: boolean; startAt: Date; endAt: Date }> = {}) {
  return {
    id: 'ad1',
    isActive: true,
    startAt: past,
    endAt: future,
    ...overrides,
  }
}

describe('filterActiveAds', () => {
  it('returns empty array for no ads', () => {
    expect(filterActiveAds([], now)).toEqual([])
  })

  it('returns active, in-range ad', () => {
    const ad = makeAd()
    expect(filterActiveAds([ad], now)).toHaveLength(1)
  })

  it('filters out inactive ads (isActive=false)', () => {
    const ad = makeAd({ isActive: false })
    expect(filterActiveAds([ad], now)).toHaveLength(0)
  })

  it('filters out ads where startAt is in the future', () => {
    const ad = makeAd({ startAt: new Date('2026-06-01') })
    expect(filterActiveAds([ad], now)).toHaveLength(0)
  })

  it('filters out ads where endAt is in the past', () => {
    const ad = makeAd({ endAt: new Date('2026-03-01') })
    expect(filterActiveAds([ad], now)).toHaveLength(0)
  })

  it('includes ad where startAt equals now', () => {
    const ad = makeAd({ startAt: now })
    expect(filterActiveAds([ad], now)).toHaveLength(1)
  })

  it('includes ad where endAt equals now', () => {
    const ad = makeAd({ endAt: now })
    expect(filterActiveAds([ad], now)).toHaveLength(1)
  })

  it('returns only the active in-range ads from a mixed list', () => {
    const ads = [
      makeAd(),                                     // valid
      makeAd({ isActive: false }),                  // inactive
      makeAd({ startAt: new Date('2026-12-01') }),  // not started
      makeAd({ endAt: new Date('2026-01-01') }),    // expired
    ]
    expect(filterActiveAds(ads, now)).toHaveLength(1)
  })
})
