import { describe, it, expect } from 'vitest'
import { processScanResult, ScanOutcome, type ScanContext } from '../qr-scan'
import { generateQrPayload } from '../qr'

const secret = 'test-secret-xyz'
const reservationId = 'res_abc123'
const validPayload = generateQrPayload(reservationId, secret)

function makeCtx(overrides: Partial<ScanContext> = {}): ScanContext {
  return {
    payload: validPayload,
    secret,
    reservation: {
      id: reservationId,
      status: 'PAID',
      courseTeacherId: 'teacher_1',
    },
    requestingTeacherId: 'teacher_1',
    ...overrides,
  }
}

describe('processScanResult', () => {
  it('returns ATTENDED outcome for valid PAID reservation belonging to requesting teacher', () => {
    const result = processScanResult(makeCtx())
    expect(result.outcome).toBe(ScanOutcome.ATTENDED)
    expect(result.reservationId).toBe(reservationId)
  })

  it('returns INVALID_QR for tampered payload', () => {
    const result = processScanResult(makeCtx({ payload: 'HACKED:000000' }))
    expect(result.outcome).toBe(ScanOutcome.INVALID_QR)
  })

  it('returns INVALID_QR when payload HMAC uses wrong secret', () => {
    const wrongPayload = generateQrPayload(reservationId, 'wrong-secret')
    const result = processScanResult(makeCtx({ payload: wrongPayload }))
    expect(result.outcome).toBe(ScanOutcome.INVALID_QR)
  })

  it('returns ALREADY_USED when reservation status is ATTENDED', () => {
    const result = processScanResult(makeCtx({ reservation: { id: reservationId, status: 'ATTENDED', courseTeacherId: 'teacher_1' } }))
    expect(result.outcome).toBe(ScanOutcome.ALREADY_USED)
  })

  it('returns FORBIDDEN when course belongs to a different teacher', () => {
    const result = processScanResult(makeCtx({ reservation: { id: reservationId, status: 'PAID', courseTeacherId: 'teacher_2' } }))
    expect(result.outcome).toBe(ScanOutcome.FORBIDDEN)
  })

  it('returns INVALID_QR when reservation does not exist', () => {
    const result = processScanResult(makeCtx({ reservation: null }))
    expect(result.outcome).toBe(ScanOutcome.INVALID_QR)
  })

  it('returns INVALID_QR when reservation is not PAID or ATTENDED (e.g. PENDING)', () => {
    const result = processScanResult(makeCtx({ reservation: { id: reservationId, status: 'PENDING', courseTeacherId: 'teacher_1' } }))
    expect(result.outcome).toBe(ScanOutcome.INVALID_QR)
  })

  it('returns INVALID_QR for empty payload', () => {
    const result = processScanResult(makeCtx({ payload: '' }))
    expect(result.outcome).toBe(ScanOutcome.INVALID_QR)
  })
})
