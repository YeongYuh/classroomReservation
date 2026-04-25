export interface AdFilter {
  isActive: boolean
  startAt: Date
  endAt: Date
}

export function filterActiveAds<T extends AdFilter>(ads: T[], now: Date): T[] {
  return ads.filter((ad) => ad.isActive && ad.startAt <= now && ad.endAt >= now)
}
