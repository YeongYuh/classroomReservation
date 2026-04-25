import crypto from 'crypto'

const IS_SANDBOX = process.env.LINEPAY_IS_SANDBOX !== 'false'
const LINEPAY_BASE = IS_SANDBOX
  ? 'https://sandbox-api-pay.line.me'
  : 'https://api-pay.line.me'

// ── Signature helpers (pure, no side-effects) ──────────────────────────────

/**
 * Computes LINE Pay v3 HMAC-SHA256 signature.
 * message = channelSecret + path + body + nonce
 */
export function signLinePayRequest(
  channelSecret: string,
  path: string,
  body: string,
  nonce: string
): string {
  const message = channelSecret + path + body + nonce
  return crypto.createHmac('sha256', channelSecret).update(message).digest('base64')
}

/**
 * Verifies an incoming LINE Pay signature using timing-safe comparison.
 */
export function verifyLinePaySignature(
  channelSecret: string,
  path: string,
  body: string,
  nonce: string,
  signature: string
): boolean {
  if (!signature) return false
  try {
    const expected = signLinePayRequest(channelSecret, path, body, nonce)
    const expectedBuf = Buffer.from(expected)
    const sigBuf = Buffer.from(signature)
    if (expectedBuf.length !== sigBuf.length) return false
    return crypto.timingSafeEqual(expectedBuf, sigBuf)
  } catch {
    return false
  }
}

// ── API call helpers ───────────────────────────────────────────────────────

function makeHeaders(channelId: string, channelSecret: string, path: string, body: string) {
  const nonce = crypto.randomUUID()
  return {
    'Content-Type': 'application/json',
    'X-LINE-ChannelId': channelId,
    'X-LINE-Authorization-Nonce': nonce,
    'X-LINE-Authorization': signLinePayRequest(channelSecret, path, body, nonce),
  }
}

function getCredentials() {
  return {
    channelId: process.env.LINEPAY_CHANNEL_ID ?? '',
    channelSecret: process.env.LINEPAY_CHANNEL_SECRET_KEY ?? '',
  }
}

// ── Payment Request ────────────────────────────────────────────────────────

export interface LinePayRequestParams {
  orderId: string
  amount: number
  currency: string
  productName: string
  confirmUrl: string
  cancelUrl: string
}

export interface LinePayRequestResult {
  paymentUrl: string
  transactionId: string
}

export async function requestPayment(params: LinePayRequestParams): Promise<LinePayRequestResult> {
  const { channelId, channelSecret } = getCredentials()
  const path = '/v3/payments/request'
  const bodyObj = {
    amount: params.amount,
    currency: params.currency,
    orderId: params.orderId,
    packages: [
      {
        id: params.orderId,
        amount: params.amount,
        name: params.productName,
        products: [
          { id: params.orderId, name: params.productName, quantity: 1, price: params.amount },
        ],
      },
    ],
    redirectUrls: {
      confirmUrl: params.confirmUrl,
      cancelUrl: params.cancelUrl,
    },
  }
  const body = JSON.stringify(bodyObj)

  const res = await fetch(`${LINEPAY_BASE}${path}`, {
    method: 'POST',
    headers: makeHeaders(channelId, channelSecret, path, body),
    body,
  })
  const data = await res.json() as { returnCode: string; returnMessage: string; info?: { paymentUrl: { web: string }; transactionId: number } }

  if (data.returnCode !== '0000') {
    throw new Error(`LINE Pay request error ${data.returnCode}: ${data.returnMessage}`)
  }

  return {
    paymentUrl: data.info!.paymentUrl.web,
    transactionId: String(data.info!.transactionId),
  }
}

// ── Payment Confirm ────────────────────────────────────────────────────────

export async function confirmPayment(
  transactionId: string,
  amount: number,
  currency = 'TWD'
): Promise<boolean> {
  const { channelId, channelSecret } = getCredentials()
  const path = `/v3/payments/${transactionId}/confirm`
  const body = JSON.stringify({ amount, currency })

  const res = await fetch(`${LINEPAY_BASE}${path}`, {
    method: 'POST',
    headers: makeHeaders(channelId, channelSecret, path, body),
    body,
  })
  const data = await res.json() as { returnCode: string }
  return data.returnCode === '0000'
}

// ── Payment Refund ─────────────────────────────────────────────────────────

export async function refundPayment(
  transactionId: string,
  refundAmount?: number
): Promise<boolean> {
  const { channelId, channelSecret } = getCredentials()
  const path = `/v3/payments/${transactionId}/refund`
  const bodyObj = refundAmount !== undefined ? { refundAmount } : {}
  const body = JSON.stringify(bodyObj)

  const res = await fetch(`${LINEPAY_BASE}${path}`, {
    method: 'POST',
    headers: makeHeaders(channelId, channelSecret, path, body),
    body,
  })
  const data = await res.json() as { returnCode: string }
  return data.returnCode === '0000'
}
