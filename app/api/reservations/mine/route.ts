import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 })
  }

  const reservations = await prisma.reservation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      courseId: true,
      status: true,
      qrCode: true,
      paidAt: true,
      course: {
        select: {
          title: true,
          location: true,
          startAt: true,
          durationMin: true,
          price: true,
          teacher: { select: { displayName: true, avatarUrl: true } },
          reviews: { where: { userId: session.user.id }, select: { id: true } },
        },
      },
    },
  })

  const serialized = reservations.map((r) => ({
    id: r.id,
    courseId: r.courseId,
    status: r.status,
    qrCode: r.qrCode,
    paidAt: r.paidAt?.toISOString() ?? null,
    hasReview: r.course.reviews.length > 0,
    course: {
      title: r.course.title,
      location: r.course.location,
      startAt: r.course.startAt.toISOString(),
      durationMin: r.course.durationMin,
      price: r.course.price.toString(),
      teacher: r.course.teacher,
    },
  }))

  return NextResponse.json(serialized)
}
