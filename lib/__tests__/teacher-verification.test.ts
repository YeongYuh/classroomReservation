import { describe, it, expect } from 'vitest'
import { canTeacherAccessDashboard } from '../teacher-verification'

describe('canTeacherAccessDashboard', () => {
  it('returns false when profile is null', () => {
    expect(canTeacherAccessDashboard(null)).toBe(false)
  })

  it('returns false when isVerified is false', () => {
    expect(canTeacherAccessDashboard({ isVerified: false })).toBe(false)
  })

  it('returns true when isVerified is true', () => {
    expect(canTeacherAccessDashboard({ isVerified: true })).toBe(true)
  })
})
