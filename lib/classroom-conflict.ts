export function hasConflict(
  existing: { startAt: Date; endAt: Date }[],
  newStart: Date,
  newEnd: Date,
): boolean {
  return existing.some(
    (slot) => newStart < slot.endAt && newEnd > slot.startAt,
  )
}
