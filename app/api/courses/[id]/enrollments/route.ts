import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { buildEnrollmentView } from '@/lib/enrollment-view'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== Role.TEACHER) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  const { id: courseId } = await params

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!profile) return NextResponse.json({ error: '老師資料不存在' }, { status: 404 })

  const course = await prisma.course.findFirst({
    where: { id: courseId, teacherId: profile.id },
    select: { id: true, maxSlots: true },
  })
  if (!course) {
    return NextResponse.json({ error: '課程不存在或無權限' }, { status: 403 })
  }

  const reservations = await prisma.reservation.findMany({
    where: { courseId },
    orderBy: { paidAt: 'asc' },
    select: {
      id: true,
      status: true,
      paidAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
  })

  const paidCount = reservations.filter((r) => r.status === 'PAID').length

  return NextResponse.json({
    courseId,
    maxSlots: course.maxSlots,
    paidCount,
    isFull: paidCount >= course.maxSlots,
    enrollments: buildEnrollmentView(reservations),
  })
}
