import { verifyQrPayload } from './qr'

export enum ScanOutcome {
  ATTENDED = 'ATTENDED',
  ALREADY_USED = 'ALREADY_USED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_QR = 'INVALID_QR',
}

export interface ScanContext {
  payload: string
  secret: string
  reservation: {
    id: string
    status: string
    courseTeacherId: string
  } | null
  requestingTeacherId: string
}

export interface ScanResult {
  outcome: ScanOutcome
  reservationId?: string
}

export function processScanResult(ctx: ScanContext): ScanResult {
  const { payload, secret, reservation, requestingTeacherId } = ctx

  const { valid, reservationId } = verifyQrPayload(payload, secret)
  if (!valid || !reservationId) return { outcome: ScanOutcome.INVALID_QR }

  if (!reservation) return { outcome: ScanOutcome.INVALID_QR }

  if (reservation.courseTeacherId !== requestingTeacherId) {
    return { outcome: ScanOutcome.FORBIDDEN }
  }

  if (reservation.status === 'ATTENDED') {
    return { outcome: ScanOutcome.ALREADY_USED, reservationId }
  }

  if (reservation.status !== 'PAID') {
    return { outcome: ScanOutcome.INVALID_QR }
  }

  return { outcome: ScanOutcome.ATTENDED, reservationId }
}
