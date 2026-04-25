import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role, ReservationStatus } from '@prisma/client'
import { z } from 'zod'
import { processScanResult, ScanOutcome } from '@/lib/qr-scan'

const QR_SECRET = process.env.QR_SECRET ?? 'dev-qr-secret'

const schema = z.object({ payload: z.string().min(1) })

const outcomeStatus: Record<ScanOutcome, number> = {
  [ScanOutcome.ATTENDED]: 200,
  [ScanOutcome.ALREADY_USED]: 409,
  [ScanOutcome.FORBIDDEN]: 403,
  [ScanOutcome.INVALID_QR]: 400,
}

const outcomeMessage: Record<ScanOutcome, string> = {
  [ScanOutcome.ATTENDED]: '簽到成功',
  [ScanOutcome.ALREADY_USED]: '此 QR Code 已使用',
  [ScanOutcome.FORBIDDEN]: '無權限掃描此 QR Code',
  [ScanOutcome.INVALID_QR]: 'QR Code 無效',
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== Role.TEACHER) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '資料格式錯誤' }, { status: 400 })
  }

  const { payload } = parsed.data

  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!teacherProfile) {
    return NextResponse.json({ error: '老師資料不存在' }, { status: 404 })
  }

  // Extract reservationId from payload to fetch reservation
  const colonIdx = payload.indexOf(':')
  const reservationId = colonIdx !== -1 ? payload.slice(0, colonIdx) : ''

  const reservation = reservationId
    ? await prisma.reservation.findUnique({
        where: { id: reservationId },
        include: {
          user: { select: { name: true } },
          course: { select: { teacherId: true, title: true } },
        },
      })
    : null

  const result = processScanResult({
    payload,
    secret: QR_SECRET,
    reservation: reservation
      ? { id: reservation.id, status: reservation.status, courseTeacherId: reservation.course.teacherId }
      : null,
    requestingTeacherId: teacherProfile.id,
  })

  if (result.outcome === ScanOutcome.ATTENDED && reservation) {
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: ReservationStatus.ATTENDED },
    })
  }

  const status = outcomeStatus[result.outcome]
  return NextResponse.json(
    {
      outcome: result.outcome,
      message: outcomeMessage[result.outcome],
      ...(result.outcome !== ScanOutcome.INVALID_QR && reservation
        ? {
            studentName: reservation.user.name,
            courseTitle: reservation.course.title,
          }
        : {}),
    },
    { status }
  )
}
