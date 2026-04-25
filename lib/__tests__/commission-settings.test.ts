import { describe, it, expect } from 'vitest'
import { validateCommissionSettings, type CommissionSettingsInput } from '../commission-settings'

describe('validateCommissionSettings', () => {
  describe('PERCENTAGE plan', () => {
    it('accepts valid percentage rate (0.15)', () => {
      expect(validateCommissionSettings({ plan: 'PERCENTAGE', rate: 0.15 }).valid).toBe(true)
    })

    it('accepts boundary 0', () => {
      expect(validateCommissionSettings({ plan: 'PERCENTAGE', rate: 0 }).valid).toBe(true)
    })

    it('accepts boundary 1', () => {
      expect(validateCommissionSettings({ plan: 'PERCENTAGE', rate: 1 }).valid).toBe(true)
    })

    it('rejects rate > 1', () => {
      const result = validateCommissionSettings({ plan: 'PERCENTAGE', rate: 1.01 })
      expect(result.valid).toBe(false)
      expect(result.error).toMatch(/0.*1/)
    })

    it('rejects negative rate', () => {
      expect(validateCommissionSettings({ plan: 'PERCENTAGE', rate: -0.1 }).valid).toBe(false)
    })
  })

  describe('MONTHLY plan', () => {
    it('accepts positive integer monthly fee', () => {
      expect(validateCommissionSettings({ plan: 'MONTHLY', rate: 500 }).valid).toBe(true)
    })

    it('accepts rate of 0', () => {
      expect(validateCommissionSettings({ plan: 'MONTHLY', rate: 0 }).valid).toBe(true)
    })

    it('rejects negative monthly fee', () => {
      expect(validateCommissionSettings({ plan: 'MONTHLY', rate: -1 }).valid).toBe(false)
    })

    it('rejects non-integer monthly fee', () => {
      const result = validateCommissionSettings({ plan: 'MONTHLY', rate: 499.5 })
      expect(result.valid).toBe(false)
      expect(result.error).toMatch(/整數/)
    })
  })

  it('rejects unknown plan', () => {
    const result = validateCommissionSettings({ plan: 'UNKNOWN' as CommissionSettingsInput['plan'], rate: 0.1 })
    expect(result.valid).toBe(false)
  })
})
