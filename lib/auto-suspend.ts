const GRACE_DAYS = 5

export interface SuspendCheckInput {
  plan: 'PERCENTAGE' | 'MONTHLY'
  billingDay: number | null
  today: Date
  hasPaymentThisMonth: boolean
}

export function shouldAutoSuspend(input: SuspendCheckInput): boolean {
  const { plan, billingDay, today, hasPaymentThisMonth } = input

  if (plan !== 'MONTHLY') return false
  if (billingDay === null) return false
  if (hasPaymentThisMonth) return false

  const dayOfMonth = today.getDate()

  // Overdue when today's day-of-month > billingDay + grace
  // For billingDay=1 and grace=5: suspend when dayOfMonth > 6 (i.e., day 7+)
  if (dayOfMonth > billingDay + GRACE_DAYS) return true

  // Handle month wrap: if billingDay is near end of previous month
  // e.g. billingDay=28, today=June 5 → days past = (days in May - 28) + 5 = 3 + 5 = 8 > 5
  // Cross-month only applies when we're still within the first GRACE_DAYS of the
  // month — meaning we could still be in the grace window of a late-month billing day.
  // If dayOfMonth > GRACE_DAYS and dayOfMonth < billingDay, billing simply hasn't
  // occurred this month yet.
  if (dayOfMonth <= billingDay && dayOfMonth <= GRACE_DAYS) {
    // We're in the month after billing — calculate days elapsed since billing
    const billingDate = new Date(today.getFullYear(), today.getMonth() - 1, billingDay)
    const msPerDay = 1000 * 60 * 60 * 24
    const daysPast = Math.floor((today.getTime() - billingDate.getTime()) / msPerDay)
    if (daysPast > GRACE_DAYS) return true
  }

  return false
}
