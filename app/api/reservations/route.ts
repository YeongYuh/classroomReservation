import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ReservationStatus, Prisma } from '@prisma/client'
import { z } from 'zod'
import { checkCanReserve } from '@/lib/reservation-check'

const schema = z.object({
  courseId: z.string().min(1),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 })
  }
  const userId = session.user.id

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '資料格式錯誤' }, { status: 400 })
  }
  const { courseId } = parsed.data

  try {
    const reservation = await prisma.$transaction(async (tx) => {
      const course = await tx.course.findUnique({
        where: { id: courseId },
        select: { id: true, status: true, maxSlots: true },
      })

      if (!course) {
        throw Object.assign(new Error('課程不存在'), { statusCode: 404 })
      }

      const paidCount = await tx.reservation.count({
        where: { courseId, status: ReservationStatus.PAID },
      })

      const existing = await tx.reservation.findUnique({
        where: { courseId_userId: { courseId, userId } },
        select: { id: true },
      })

      const check = checkCanReserve({
        courseStatus: course.status as 'ACTIVE' | 'CANCELLED' | 'COMPLETED',
        paidCount,
        maxSlots: course.maxSlots,
        hasExistingReservation: existing !== null,
      })

      if (!check.canReserve) {
        throw Object.assign(new Error(check.error), { statusCode: check.statusCode })
      }

      return tx.reservation.create({
        data: { courseId, userId, status: ReservationStatus.PENDING },
        select: { id: true },
      })
    })

    return NextResponse.json({ reservationId: reservation.id }, { status: 201 })
  } catch (err) {
    // Unique constraint violation — race-condition duplicate
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ error: '您已預約此課程' }, { status: 400 })
    }
    const e = err as { message?: string; statusCode?: number }
    const status = e.statusCode ?? 500
    return NextResponse.json({ error: e.message ?? '預約失敗' }, { status })
  }
}
