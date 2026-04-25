import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role, CommissionPlan } from '@prisma/client'
import { z } from 'zod'
import { validateCommissionSettings } from '@/lib/commission-settings'

const patchSchema = z.object({
  isVerified: z.boolean().optional(),
  isHidden: z.boolean().optional(),
  commission: z
    .object({
      plan: z.enum(['PERCENTAGE', 'MONTHLY']),
      rate: z.number(),
    })
    .optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '資料格式錯誤' }, { status: 400 })
  }

  const { id } = await params
  const { isVerified, isHidden, commission } = parsed.data

  if (commission) {
    const validation = validateCommissionSettings(commission)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
  }

  // Find profile by userId (id param is userId)
  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: id },
    select: { id: true },
  })
  if (!profile) {
    return NextResponse.json({ error: '老師不存在' }, { status: 404 })
  }

  const [updated] = await prisma.$transaction([
    prisma.teacherProfile.update({
      where: { userId: id },
      data: {
        ...(isVerified !== undefined && { isVerified }),
        ...(isHidden !== undefined && { isHidden }),
      },
      select: { userId: true, isVerified: true, isHidden: true },
    }),
    ...(commission
      ? [
          prisma.commission.upsert({
            where: { teacherId: profile.id },
            create: {
              teacherId: profile.id,
              plan: commission.plan as CommissionPlan,
              rate: commission.rate,
            },
            update: {
              plan: commission.plan as CommissionPlan,
              rate: commission.rate,
            },
          }),
        ]
      : []),
  ])

  return NextResponse.json(updated)
}
