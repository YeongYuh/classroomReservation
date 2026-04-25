import { describe, it, expect } from 'vitest'
import { generateQrPayload, verifyQrPayload } from '../qr'

const secret = 'test-qr-secret-xyz'
const reservationId = 'res_abc123def456'

describe('generateQrPayload', () => {
  it('produces a payload containing the reservationId prefix', () => {
    const payload = generateQrPayload(reservationId, secret)
    expect(payload.startsWith(reservationId + ':')).toBe(true)
  })

  it('is deterministic for same inputs', () => {
    expect(generateQrPayload(reservationId, secret)).toBe(
      generateQrPayload(reservationId, secret)
    )
  })

  it('changes when secret changes', () => {
    expect(generateQrPayload(reservationId, secret)).not.toBe(
      generateQrPayload(reservationId, 'different-secret')
    )
  })

  it('changes when reservationId changes', () => {
    expect(generateQrPayload(reservationId, secret)).not.toBe(
      generateQrPayload('other-id', secret)
    )
  })
})

describe('verifyQrPayload', () => {
  it('verifies a correctly generated payload', () => {
    const payload = generateQrPayload(reservationId, secret)
    const result = verifyQrPayload(payload, secret)
    expect(result.valid).toBe(true)
    expect(result.reservationId).toBe(reservationId)
  })

  it('rejects a tampered reservationId', () => {
    const payload = generateQrPayload(reservationId, secret)
    const tampered = 'HACKED_ID:' + payload.split(':')[1]
    expect(verifyQrPayload(tampered, secret).valid).toBe(false)
  })

  it('rejects a tampered HMAC', () => {
    const payload = generateQrPayload(reservationId, secret)
    const tampered = payload.split(':')[0] + ':000000000000000000000000000000000000000000000000000000000000000'
    expect(verifyQrPayload(tampered, secret).valid).toBe(false)
  })

  it('rejects wrong secret', () => {
    const payload = generateQrPayload(reservationId, secret)
    expect(verifyQrPayload(payload, 'wrong-secret').valid).toBe(false)
  })

  it('rejects empty payload', () => {
    expect(verifyQrPayload('', secret).valid).toBe(false)
  })

  it('rejects payload without colon delimiter', () => {
    expect(verifyQrPayload('nodivider', secret).valid).toBe(false)
  })
})
