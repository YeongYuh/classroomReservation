import { describe, it, expect } from 'vitest'
import { signLinePayRequest, verifyLinePaySignature } from '../linepay'

const secret = 'test-channel-secret'
const path = '/v3/payments/request'
const body = '{"amount":500}'
const nonce = 'test-nonce-abc'

describe('signLinePayRequest', () => {
  it('produces a non-empty base64 string', () => {
    const sig = signLinePayRequest(secret, path, body, nonce)
    expect(sig.length).toBeGreaterThan(0)
    expect(() => Buffer.from(sig, 'base64')).not.toThrow()
  })

  it('is deterministic for same inputs', () => {
    expect(signLinePayRequest(secret, path, body, nonce)).toBe(
      signLinePayRequest(secret, path, body, nonce)
    )
  })

  it('changes when any input changes', () => {
    const base = signLinePayRequest(secret, path, body, nonce)
    expect(signLinePayRequest('other-secret', path, body, nonce)).not.toBe(base)
    expect(signLinePayRequest(secret, '/other', body, nonce)).not.toBe(base)
    expect(signLinePayRequest(secret, path, '{}', nonce)).not.toBe(base)
    expect(signLinePayRequest(secret, path, body, 'other-nonce')).not.toBe(base)
  })
})

describe('verifyLinePaySignature', () => {
  it('accepts a correctly signed request', () => {
    const sig = signLinePayRequest(secret, path, body, nonce)
    expect(verifyLinePaySignature(secret, path, body, nonce, sig)).toBe(true)
  })

  it('rejects wrong channel secret', () => {
    const sig = signLinePayRequest(secret, path, body, nonce)
    expect(verifyLinePaySignature('wrong-secret', path, body, nonce, sig)).toBe(false)
  })

  it('rejects tampered body', () => {
    const sig = signLinePayRequest(secret, path, body, nonce)
    expect(verifyLinePaySignature(secret, path, '{"amount":9999}', nonce, sig)).toBe(false)
  })

  it('rejects wrong nonce', () => {
    const sig = signLinePayRequest(secret, path, body, nonce)
    expect(verifyLinePaySignature(secret, path, body, 'wrong-nonce', sig)).toBe(false)
  })

  it('rejects empty signature', () => {
    expect(verifyLinePaySignature(secret, path, body, nonce, '')).toBe(false)
  })
})
