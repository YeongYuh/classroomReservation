import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role, CourseStatus, ReservationStatus, PaymentStatus } from '@prisma/client'
import { z } from 'zod'
import { classifyForBatchCancellation } from '@/lib/batch-cancel'
import { refundPayment } from '@/lib/linepay'
import { sendCourseCancellation } from '@/lib/email'

const patchSchema = z.object({
  status: z.enum(['CANCELLED']),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== Role.TEACHER) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '資料格式錯誤' }, { status: 400 })
  }

  const { id } = await params

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!profile) return NextResponse.json({ error: '老師資料不存在' }, { status: 404 })

  const course = await prisma.course.findFirst({
    where: { id, teacherId: profile.id },
    select: { id: true, title: true, startAt: true, price: true, status: true },
  })
  if (!course) {
    return NextResponse.json({ error: '課程不存在或無權限' }, { status: 404 })
  }

  if (course.status === CourseStatus.CANCELLED) {
    return NextResponse.json({ error: '課程已取消' }, { status: 400 })
  }

  const reservations = await prisma.reservation.findMany({
    where: { courseId: id },
    include: {
      payment: { select: { id: true, txnId: true, status: true } },
      user: { select: { email: true, name: true } },
    },
  })

  const { needsRefund, noRefund } = classifyForBatchCancellation(reservations)

  // Cancel course atomically — mark all active reservations CANCELLED in DB
  await prisma.$transaction(async (tx) => {
    await tx.course.update({ where: { id }, data: { status: CourseStatus.CANCELLED } })

    const cancelIds = [...needsRefund, ...noRefund].map((r) => r.id)
    if (cancelIds.length > 0) {
      await tx.reservation.updateMany({
        where: { id: { in: cancelIds } },
        data: { status: ReservationStatus.CANCELLED, cancelledAt: new Date() },
      })
    }
  })

  // Refunds and emails are outside the transaction (partial failure tolerance)
  const refundResults: Record<string, boolean> = {}

  await Promise.all(
    needsRefund.map(async (res) => {
      const amount = Math.round(Number(course.price))
      const ok = await refundPayment(res.payment!.txnId!, amount).catch((err) => {
        console.error(`Refund failed for reservation ${res.id}:`, err)
        return false
      })
      refundResults[res.id] = ok
      if (ok) {
        await prisma.payment
          .update({ where: { id: res.payment!.id }, data: { status: PaymentStatus.REFUNDED } })
          .catch(() => null)
      }
    })
  )

  // Send cancellation emails (fire-and-forget)
  const allNotify = [...needsRefund, ...noRefund]
  await Promise.all(
    allNotify.map((res) =>
      sendCourseCancellation({
        to: res.user.email,
        studentName: res.user.name ?? res.user.email,
        courseTitle: course.title,
        startAt: course.startAt,
        refunded: refundResults[res.id] === true,
      }).catch((err) => {
        console.error(`Email failed for reservation ${res.id}:`, err)
      })
    )
  )

  const refundedCount = Object.values(refundResults).filter(Boolean).length
  const failedCount = needsRefund.length - refundedCount

  return NextResponse.json({
    id,
    status: CourseStatus.CANCELLED,
    cancelledReservations: needsRefund.length + noRefund.length,
    refundedCount,
    failedRefundCount: failedCount,
  })
}
