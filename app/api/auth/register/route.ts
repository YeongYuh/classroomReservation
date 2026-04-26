import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { Role, UserStatus } from '@prisma/client'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(['STUDENT', 'TEACHER']).default('STUDENT'),
})

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const { allowed, retryAfterSec } = checkRateLimit(`register:${ip}`, { maxAttempts: 10, windowMs: 15 * 60 * 1000 })
  if (!allowed) {
    return NextResponse.json(
      { error: '請求過於頻繁，請稍後再試' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
    )
  }

  const body = await request.json()
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '資料格式錯誤' }, { status: 400 })
  }

  const { email, password, name, role } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: '此 Email 已被註冊' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: role as Role,
      status: UserStatus.PENDING,
      ...(role === 'TEACHER'
        ? {
            teacherProfile: {
              create: {
                displayName: name,
                isVerified: false,
                isHidden: false,
              },
            },
          }
        : {}),
    },
  })

  return NextResponse.json({ id: user.id }, { status: 201 })
}
