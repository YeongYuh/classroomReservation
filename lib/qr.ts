import crypto from 'crypto'
import QRCode from 'qrcode'

export function generateQrPayload(reservationId: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret).update(reservationId).digest('hex')
  return `${reservationId}:${hmac}`
}

export function verifyQrPayload(
  payload: string,
  secret: string
): { valid: boolean; reservationId?: string } {
  if (!payload) return { valid: false }
  const colonIdx = payload.indexOf(':')
  if (colonIdx === -1) return { valid: false }

  const reservationId = payload.slice(0, colonIdx)
  const providedHmac = payload.slice(colonIdx + 1)

  const expected = crypto.createHmac('sha256', secret).update(reservationId).digest('hex')

  try {
    const expectedBuf = Buffer.from(expected, 'hex')
    const providedBuf = Buffer.from(providedHmac, 'hex')
    if (expectedBuf.length !== providedBuf.length) return { valid: false }
    if (!crypto.timingSafeEqual(expectedBuf, providedBuf)) return { valid: false }
    return { valid: true, reservationId }
  } catch {
    return { valid: false }
  }
}

export async function generateQrImage(payload: string): Promise<string> {
  return QRCode.toDataURL(payload)
}
