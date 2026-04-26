import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHash } from 'crypto'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    passwordResetToken: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ id: 'mock-email-id' }) },
  })),
}))

import { prisma } from '@/lib/prisma'
import { validateResetToken, consumeResetToken } from './password-reset'

function hashToken(raw: string) {
  return createHash('sha256').update(raw).digest('hex')
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('validateResetToken', () => {
  it('returns invalid when token not found', async () => {
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(null)
    const result = await validateResetToken('nonexistent-token')
    expect(result.valid).toBe(false)
  })

  it('returns invalid when token is already used', async () => {
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 60000),
      usedAt: new Date(),
    } as never)
    const result = await validateResetToken('some-token')
    expect(result.valid).toBe(false)
  })

  it('returns invalid when token is expired', async () => {
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
      userId: 'user-1',
      expiresAt: new Date(Date.now() - 60000), // 1 min ago
      usedAt: null,
    } as never)
    const result = await validateResetToken('some-token')
    expect(result.valid).toBe(false)
  })

  it('returns valid with userId for a fresh token', async () => {
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 3600000),
      usedAt: null,
    } as never)
    const result = await validateResetToken('valid-token')
    expect(result.valid).toBe(true)
    if (result.valid) expect(result.userId).toBe('user-1')
  })
})

describe('consumeResetToken', () => {
  it('returns false when transaction throws', async () => {
    vi.mocked(prisma.$transaction).mockRejectedValue(new Error('Token invalid'))
    const result = await consumeResetToken('bad-token', 'NewPass123!')
    expect(result).toBe(false)
  })

  it('returns true on successful consumption', async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const txMock = {
        passwordResetToken: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'token-id',
            userId: 'user-1',
            expiresAt: new Date(Date.now() + 3600000),
            usedAt: null,
          }),
          update: vi.fn().mockResolvedValue({}),
        },
        user: { update: vi.fn().mockResolvedValue({}) },
      }
      return fn(txMock as never)
    })
    const result = await consumeResetToken('valid-raw-token', 'NewPass123!')
    expect(result).toBe(true)
  })

  it('returns false when token is already used inside transaction', async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const txMock = {
        passwordResetToken: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'token-id',
            userId: 'user-1',
            expiresAt: new Date(Date.now() + 3600000),
            usedAt: new Date(), // already used
          }),
          update: vi.fn(),
        },
        user: { update: vi.fn() },
      }
      return fn(txMock as never)
    })
    const result = await consumeResetToken('used-token', 'NewPass123!')
    expect(result).toBe(false)
  })
})
