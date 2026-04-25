export interface CommissionSettingsInput {
  plan: 'PERCENTAGE' | 'MONTHLY'
  rate: number
}

export function validateCommissionSettings(
  input: CommissionSettingsInput
): { valid: boolean; error?: string } {
  const { plan, rate } = input

  if (plan !== 'PERCENTAGE' && plan !== 'MONTHLY') {
    return { valid: false, error: '無效的分潤方案' }
  }

  if (plan === 'PERCENTAGE') {
    if (rate < 0 || rate > 1) {
      return { valid: false, error: '百分比費率必須在 0 到 1 之間' }
    }
    return { valid: true }
  }

  // MONTHLY
  if (rate < 0) {
    return { valid: false, error: '月費不可為負數' }
  }
  if (!Number.isInteger(rate)) {
    return { valid: false, error: '月費必須為整數（NT$）' }
  }
  return { valid: true }
}
