import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ReservationStatus, Prisma } from '@prisma/client'
import { z } from 'zod'
import { validateReview } from '@/lib/review-validation'

const schema = z.object({
  courseId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '資料格式錯誤', details: parsed.error.flatten() }, { status: 400 })
  }

  const { courseId, rating, comment } = parsed.data

  const validation = validateReview({ rating, comment })
  if (!validation.valid) {
    return NextResponse.json({ error: '評價資料不合法', details: validation.errors }, { status: 400 })
  }

  // Verify the user has an ATTENDED reservation for this course
  const reservation = await prisma.reservation.findUnique({
    where: { courseId_userId: { courseId, userId: session.user.id } },
    select: { status: true },
  })

  if (!reservation || reservation.status !== ReservationStatus.ATTENDED) {
    return NextResponse.json({ error: '僅完課學員可以評價' }, { status: 403 })
  }

  try {
    const review = await prisma.review.create({
      data: { courseId, userId: session.user.id, rating, comment },
      select: { id: true, rating: true, comment: true, createdAt: true },
    })
    return NextResponse.json(review, { status: 201 })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ error: '您已評價過此課程' }, { status: 409 })
    }
    throw err
  }
}
