import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function POST() {
  const session = await auth()
  if (!session || session.user.role !== Role.TEACHER) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  await prisma.teacherProfile.update({
    where: { userId: session.user.id },
    data: { lineNotifyToken: null },
  })

  return NextResponse.json({ ok: true })
}
