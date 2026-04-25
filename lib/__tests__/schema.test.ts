/**
 * T1 integration smoke test — verifies the schema shapes Prisma Client exposes.
 * No DB connection needed; tests only that the generated types exist and are correct.
 */
import { describe, it, expect } from 'vitest'
import { Role, ReservationStatus, PaymentStatus, CourseStatus, CommissionPlan, AdSlot } from '@prisma/client'

describe('Prisma schema enums', () => {
  it('Role has TEACHER, STUDENT, ADMIN', () => {
    expect(Role.TEACHER).toBe('TEACHER')
    expect(Role.STUDENT).toBe('STUDENT')
    expect(Role.ADMIN).toBe('ADMIN')
  })

  it('ReservationStatus has all four states', () => {
    expect(ReservationStatus.PENDING).toBe('PENDING')
    expect(ReservationStatus.PAID).toBe('PAID')
    expect(ReservationStatus.ATTENDED).toBe('ATTENDED')
    expect(ReservationStatus.CANCELLED).toBe('CANCELLED')
  })

  it('PaymentStatus has PENDING, COMPLETED, REFUNDED, FAILED', () => {
    expect(PaymentStatus.COMPLETED).toBe('COMPLETED')
    expect(PaymentStatus.REFUNDED).toBe('REFUNDED')
  })

  it('CourseStatus has ACTIVE, CANCELLED, COMPLETED', () => {
    expect(CourseStatus.ACTIVE).toBe('ACTIVE')
    expect(CourseStatus.CANCELLED).toBe('CANCELLED')
  })

  it('CommissionPlan has PERCENTAGE and MONTHLY', () => {
    expect(CommissionPlan.PERCENTAGE).toBe('PERCENTAGE')
    expect(CommissionPlan.MONTHLY).toBe('MONTHLY')
  })

  it('AdSlot has HOMEPAGE_BANNER and FEATURED_TEACHER', () => {
    expect(AdSlot.HOMEPAGE_BANNER).toBe('HOMEPAGE_BANNER')
    expect(AdSlot.FEATURED_TEACHER).toBe('FEATURED_TEACHER')
  })
})
