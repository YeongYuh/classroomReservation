export function isCourseAvailable(paidCount: number, maxSlots: number): boolean {
  return paidCount < maxSlots
}

export function remainingSlots(paidCount: number, maxSlots: number): number {
  return Math.max(0, maxSlots - paidCount)
}
