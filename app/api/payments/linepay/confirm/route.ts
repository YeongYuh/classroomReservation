import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ReservationStatus, PaymentStatus } from '@prisma/client'
import { verifyLinePaySignature, confirmPayment } from '@/lib/linepay'
import { calculateCommission } from '@/lib/commission'
import { generateQrPayload, generateQrImage } from '@/lib/qr'
import { sendBookingConfirmation } from '@/lib/email'
import { buildEnrollmentNotifyMessage, sendLineNotify } from '@/lib/line-notify'

const CHANNEL_SECRET = process.env.LINEPAY_CHANNEL_SECRET_KEY ?? ''
const QR_SECRET = process.env.QR_SECRET ?? 'dev-qr-secret'
const DEFAULT_COMMISSION_RATE = 0.15

async function processConfirm(transactionId: string, orderId: string) {
  const reservation = await prisma.$transaction(async (tx) => {
    const res = await tx.reservation.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        user: true,
        course: {
          include: { teacher: { include: { commission: true } } },
        },
      },
    })

    if (!res) throw Object.assign(new Error('預約不存在'), { statusCode: 404 })
    if (!res.payment) throw Object.assign(new Error('付款記錄不存在'), { statusCode: 404 })
    // Idempotent — already confirmed
    if (res.payment.status === PaymentStatus.COMPLETED) return res

    const amount = Math.round(Number(res.course.price))

    const ok = await confirmPayment(transactionId, amount)
    if (!ok) throw Object.assign(new Error('LINE Pay 確認失敗'), { statusCode: 402 })

    const rate = Number(res.course.teacher.commission?.rate ?? DEFAULT_COMMISSION_RATE)
    const { platformFee, teacherAmount } = calculateCommission(amount * 100, rate)

    const qrPayload = generateQrPayload(orderId, QR_SECRET)

    await tx.payment.update({
      where: { id: res.payment.id },
      data: {
        status: PaymentStatus.COMPLETED,
        txnId: transactionId,
        platformFee,
        teacherAmount,
      },
    })

    await tx.reservation.update({
      where: { id: orderId },
      data: { status: ReservationStatus.PAID, paidAt: new Date(), qrCode: qrPayload },
    })

    return res
  })

  // Send confirmation email outside the transaction (non-critical path)
  if (reservation.user.email) {
    const qrPayload = generateQrPayload(orderId, QR_SECRET)
    const qrImage = await generateQrImage(qrPayload)
    await sendBookingConfirmation({
      to: reservation.user.email,
      studentName: reservation.user.name ?? reservation.user.email,
      courseTitle: reservation.course.title,
      startAt: reservation.course.startAt,
      location: reservation.course.location,
      qrImageDataUrl: qrImage,
      reservationId: orderId,
    }).catch(() => {
      // Email failure is non-critical; payment is already confirmed
    })
  }

  // LINE Notify to teacher (silent fail)
  const notifyToken = reservation.course.teacher.lineNotifyToken
  if (notifyToken) {
    const paidCount = await prisma.reservation.count({
      where: { courseId: reservation.courseId, status: 'PAID' },
    })
    const message = buildEnrollmentNotifyMessage({
      courseTitle: reservation.course.title,
      studentName: reservation.user.name ?? reservation.user.email ?? '學員',
      startAt: reservation.course.startAt,
      currentCount: paidCount,
      maxSlots: reservation.course.maxSlots,
    })
    await sendLineNotify(notifyToken, message).catch((err) => {
      console.error('LINE Notify failed:', err)
    })
  }

  return reservation
}

// ── POST — server-to-server webhook from LINE Pay ──────────────────────────

export async function POST(request: Request) {
  const rawBody = await request.text()
  const nonce = request.headers.get('X-LINE-Authorization-Nonce') ?? ''
  const signature = request.headers.get('X-LINE-Authorization') ?? ''

  const url = new URL(request.url)

  if (!verifyLinePaySignature(CHANNEL_SECRET, url.pathname, rawBody, nonce, signature)) {
    return NextResponse.json({ returnCode: '0001', returnMessage: 'Unauthorized' }, { status: 400 })
  }

  let body: { transactionId: string | number; orderId: string }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ returnCode: '0002', returnMessage: 'Invalid body' }, { status: 400 })
  }

  try {
    await processConfirm(String(body.transactionId), body.orderId)
    return NextResponse.json({ returnCode: '0000', returnMessage: 'OK' })
  } catch (err) {
    const e = err as { message?: string; statusCode?: number }
    return NextResponse.json({ returnCode: '9999', returnMessage: e.message }, { status: e.statusCode ?? 500 })
  }
}

// ── GET — browser redirect from LINE Pay after user pays ───────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const transactionId = searchParams.get('transactionId') ?? ''
  const orderId = searchParams.get('orderId') ?? ''

  if (!transactionId || !orderId) {
    redirect('/profile?payment=invalid')
  }

  try {
    await processConfirm(transactionId, orderId)
    redirect('/profile?payment=success')
  } catch {
    redirect('/profile?payment=failed')
  }
}
