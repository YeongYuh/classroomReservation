import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyQrPayload } from '@/lib/qr'

const QR_SECRET = process.env.QR_SECRET ?? 'dev-qr-secret'

// GET /api/qr/:reservationId?payload=<qr-payload>
// Used by teacher scanning screen to verify QR code and mark attendance
export async function GET(
  request: Request,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 })
  }

  const { reservationId } = await params
  const { searchParams } = new URL(request.url)
  const payload = searchParams.get('payload') ?? ''

  const { valid } = verifyQrPayload(payload, QR_SECRET)
  if (!valid) {
    return NextResponse.json({ error: 'QR Code 無效' }, { status: 400 })
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      user: { select: { name: true } },
      course: { select: { title: true, teacherId: true } },
    },
  })

  if (!reservation) {
    return NextResponse.json({ error: '預約不存在' }, { status: 404 })
  }

  // Only the teacher who owns the course or an admin can verify
  const isTeacherOwner = reservation.course.teacherId === session.user.id
  const isAdmin = session.user.role === 'ADMIN'
  if (!isTeacherOwner && !isAdmin) {
    return NextResponse.json({ error: '無權限' }, { status: 403 })
  }

  return NextResponse.json({
    valid: true,
    reservationId,
    studentName: reservation.user.name,
    courseTitle: reservation.course.title,
    status: reservation.status,
  })
}
