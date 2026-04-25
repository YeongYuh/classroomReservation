import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ReservationStatus, PaymentStatus } from '@prisma/client'
import { checkCanCancel } from '@/lib/cancel-check'
import { refundPayment } from '@/lib/linepay'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 })
  }

  const { id } = await params

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      payment: { select: { id: true, txnId: true, status: true } },
      course: { select: { startAt: true, price: true } },
    },
  })

  if (!reservation) {
    return NextResponse.json({ error: '預約不存在' }, { status: 404 })
  }

  if (reservation.userId !== session.user.id) {
    return NextResponse.json({ error: '無權限' }, { status: 403 })
  }

  const check = checkCanCancel({
    reservationStatus: reservation.status,
    courseStartAt: reservation.course.startAt,
  })

  if (!check.canCancel) {
    return NextResponse.json({ error: check.error }, { status: 400 })
  }

  const now = new Date()
  let refunded = false

  if (
    check.isRefundable &&
    reservation.payment?.status === PaymentStatus.COMPLETED &&
    reservation.payment.txnId
  ) {
    const amount = Math.round(Number(reservation.course.price))
    const ok = await refundPayment(reservation.payment.txnId, amount).catch(() => false)

    if (ok) {
      await prisma.payment.update({
        where: { id: reservation.payment.id },
        data: { status: PaymentStatus.REFUNDED },
      })
      refunded = true
    }
  }

  await prisma.reservation.update({
    where: { id },
    data: { status: ReservationStatus.CANCELLED, cancelledAt: now },
  })

  return NextResponse.json({ ok: true, refunded })
}
