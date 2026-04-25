export function calculateCommission(amountCents: number, rate: number) {
  const platformFee = Math.round(amountCents * rate) / 100
  const teacherAmount = amountCents / 100 - platformFee
  return {
    platformFee: Math.round(platformFee * 100) / 100,
    teacherAmount: Math.round(teacherAmount * 100) / 100,
  }
}
