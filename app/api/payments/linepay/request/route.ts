import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ReservationStatus, PaymentStatus, PaymentMethod } from '@prisma/client'
import { z } from 'zod'
import { requestPayment } from '@/lib/linepay'

const schema = z.object({ reservationId: z.string().min(1) })

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '請先登入' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: '資料格式錯誤' }, { status: 400 })

  const { reservationId } = parsed.data
  const userId = session.user.id

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { course: { select: { title: true, price: true } }, payment: true },
  })

  if (!reservation || reservation.userId !== userId) {
    return NextResponse.json({ error: '預約不存在' }, { status: 404 })
  }
  if (reservation.status !== ReservationStatus.PENDING) {
    return NextResponse.json({ error: '此預約無法付款' }, { status: 400 })
  }
  if (reservation.payment) {
    return NextResponse.json({ error: '付款請求已建立' }, { status: 409 })
  }

  const amount = Math.round(Number(reservation.course.price))
  const origin = new URL(request.url).origin

  const { paymentUrl, transactionId } = await requestPayment({
    orderId: reservationId,
    amount,
    currency: 'TWD',
    productName: reservation.course.title,
    confirmUrl: `${origin}/api/payments/linepay/confirm`,
    cancelUrl: `${origin}/api/payments/linepay/cancel`,
  })

  await prisma.payment.create({
    data: {
      reservationId,
      method: PaymentMethod.LINEPAY,
      amount: reservation.course.price,
      platformFee: 0,
      teacherAmount: 0,
      txnId: transactionId,
      status: PaymentStatus.PENDING,
    },
  })

  return NextResponse.json({ paymentUrl })
}
