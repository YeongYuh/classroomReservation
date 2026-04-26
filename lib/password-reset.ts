import { randomBytes, createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import bcrypt from 'bcryptjs'

const TOKEN_EXPIRES_MINUTES = 60
const RATE_LIMIT_MINUTES = 5

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not set')
  return new Resend(key)
}

export async function createResetToken(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (!user) return // Always return without revealing whether email exists

  const rateLimitWindow = new Date(Date.now() - RATE_LIMIT_MINUTES * 60 * 1000)
  const recentToken = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, createdAt: { gte: rateLimitWindow } },
  })
  if (recentToken) return // Rate limited, silently ignore

  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRES_MINUTES * 60 * 1000)

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  })

  const resetUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/reset-password?token=${rawToken}`

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'noreply@classroom.example.com',
    to: email,
    subject: '密碼重設連結',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2>密碼重設</h2>
        <p>您收到此信件是因為有人要求重設您的帳號密碼。</p>
        <p>請點擊以下連結重設密碼（連結 ${TOKEN_EXPIRES_MINUTES} 分鐘內有效）：</p>
        <a href="${resetUrl}" style="display: inline-block; margin: 16px 0; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px;">
          重設密碼
        </a>
        <p style="color: #6b7280; font-size: 14px;">如果您沒有提出此請求，請忽略此郵件。</p>
      </div>
    `,
  })
}

export async function validateResetToken(rawToken: string): Promise<{ valid: true; userId: string } | { valid: false }> {
  const tokenHash = hashToken(rawToken)
  const token = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { userId: true, expiresAt: true, usedAt: true },
  })
  if (!token) return { valid: false }
  if (token.usedAt) return { valid: false }
  if (token.expiresAt < new Date()) return { valid: false }
  return { valid: true, userId: token.userId }
}

export async function consumeResetToken(rawToken: string, newPassword: string): Promise<boolean> {
  const tokenHash = hashToken(rawToken)

  try {
    const passwordHash = await bcrypt.hash(newPassword, 12)
    await prisma.$transaction(async (tx) => {
      const token = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
        select: { id: true, userId: true, expiresAt: true, usedAt: true },
      })
      if (!token || token.usedAt || token.expiresAt < new Date()) {
        throw new Error('Token invalid')
      }
      await tx.passwordResetToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      })
      await tx.user.update({
        where: { id: token.userId },
        data: { passwordHash },
      })
    })
    return true
  } catch {
    return false
  }
}
