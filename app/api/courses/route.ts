import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CourseStatus, ReservationStatus } from '@prisma/client'

function buildWhere(tag: string, date: string, location: string, teacherName: string) {
  return {
    status: CourseStatus.ACTIVE,
    teacher: {
      isVerified: true,
      isHidden: false,
      ...(teacherName ? { displayName: { contains: teacherName } } : {}),
    },
    ...(location ? { location: { contains: location } } : {}),
    ...(tag ? { tags: { contains: tag } } : {}),
    ...(date
      ? {
          startAt: {
            gte: new Date(`${date}T00:00:00`),
            lt: new Date(`${date}T23:59:59`),
          },
        }
      : {}),
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tag = searchParams.get('tag') ?? ''
  const date = searchParams.get('date') ?? ''
  const location = searchParams.get('location') ?? ''
  const teacherName = searchParams.get('teacherName') ?? ''

  const courses = await prisma.course.findMany({
    where: buildWhere(tag, date, location, teacherName),
    include: {
      teacher: { select: { id: true, displayName: true, avatarUrl: true } },
      _count: {
        select: { reservations: { where: { status: ReservationStatus.PAID } } },
      },
      reviews: { select: { rating: true } },
    },
    orderBy: { startAt: 'asc' },
  })

  const result = courses.map((c) => {
    const paidCount = c._count.reservations
    const avgRating =
      c.reviews.length > 0
        ? c.reviews.reduce((sum, r) => sum + r.rating, 0) / c.reviews.length
        : null
    return {
      id: c.id,
      title: c.title,
      tags: (() => { try { return JSON.parse(c.tags) as string[] } catch { return [] } })(),
      location: c.location,
      startAt: c.startAt.toISOString(),
      durationMin: c.durationMin,
      maxSlots: c.maxSlots,
      price: c.price.toString(),
      teacher: c.teacher,
      paidCount,
      avgRating,
    }
  })

  return NextResponse.json(result)
}
