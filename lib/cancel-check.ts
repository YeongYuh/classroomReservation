import { isRefundable } from './refund'

export interface CancelCheckInput {
  reservationStatus: string
  courseStartAt: Date
}

export interface CancelCheckResult {
  canCancel: boolean
  isRefundable?: boolean
  error?: string
}

export function checkCanCancel(input: CancelCheckInput): CancelCheckResult {
  const { reservationStatus, courseStartAt } = input

  if (reservationStatus === 'CANCELLED') {
    return { canCancel: false, error: '預約已取消' }
  }

  if (reservationStatus === 'ATTENDED') {
    return { canCancel: false, error: '已出席的課程無法取消' }
  }

  if (courseStartAt <= new Date()) {
    return { canCancel: false, error: '課程已開始，無法取消' }
  }

  if (!isRefundable(courseStartAt)) {
    return { canCancel: false, error: '課程開始前 24 小時內無法取消' }
  }

  return { canCancel: true, isRefundable: true }
}
