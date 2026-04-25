const REFUND_CUTOFF_HOURS = 24

export function isRefundable(courseStartAt: Date): boolean {
  const hoursUntilStart = (courseStartAt.getTime() - Date.now()) / (1000 * 60 * 60)
  return hoursUntilStart >= REFUND_CUTOFF_HOURS
}
