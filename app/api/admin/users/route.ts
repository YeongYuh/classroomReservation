import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { Role, UserStatus } from '@prisma/client'
import { auth } from '@/lib/auth'

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.nativeEnum(Role),
  status: z.nativeEnum(UserStatus),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: '無權限' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { email, name, role, status } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: '此 Email 已被使用' }, { status: 409 })
  }

  const tempPassword = randomBytes(8).toString('hex')
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role,
      status,
      ...(role === Role.TEACHER
        ? {
            teacherProfile: {
              create: { displayName: name, isVerified: false, isHidden: false },
            },
          }
        : {}),
    },
  })

  return NextResponse.json({ tempPassword }, { status: 201 })
}
