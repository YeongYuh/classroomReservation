export type CourseStatus = 'ACTIVE' | 'CANCELLED' | 'COMPLETED'

export interface ReservationCheckInput {
  courseStatus: CourseStatus
  paidCount: number
  maxSlots: number
  hasExistingReservation: boolean
}

export interface ReservationCheckResult {
  canReserve: boolean
  statusCode?: number
  error?: string
}

export function checkCanReserve(input: ReservationCheckInput): ReservationCheckResult {
  if (input.courseStatus !== 'ACTIVE') {
    return { canReserve: false, statusCode: 400, error: '課程不接受預約' }
  }
  if (input.paidCount >= input.maxSlots) {
    return { canReserve: false, statusCode: 409, error: '課程已額滿' }
  }
  if (input.hasExistingReservation) {
    return { canReserve: false, statusCode: 400, error: '您已預約此課程' }
  }
  return { canReserve: true }
}
