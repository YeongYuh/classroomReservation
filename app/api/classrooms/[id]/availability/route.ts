import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hasConflict } from '@/lib/classroom-conflict'
import { z } from 'zod'

const querySchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const parsed = querySchema.safeParse({
    start: req.nextUrl.searchParams.get('start'),
    end: req.nextUrl.searchParams.get('end'),
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query params' }, { status: 400 })
  }

  const { start, end } = parsed.data
  const newStart = new Date(start)
  const newEnd = new Date(end)

  const classroom = await prisma.classroom.findUnique({
    where: { id, isActive: true },
    select: { id: true, capacity: true },
  })
  if (!classroom) {
    return NextResponse.json({ error: 'Classroom not found' }, { status: 404 })
  }

  const existingBookings = await prisma.classroomBooking.findMany({
    where: { classroomId: id },
    select: { startAt: true, endAt: true },
  })

  const available = !hasConflict(existingBookings, newStart, newEnd)
  return NextResponse.json({ available, capacity: classroom.capacity })
}
