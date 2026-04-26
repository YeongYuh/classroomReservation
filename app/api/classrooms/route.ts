import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const classrooms = await prisma.classroom.findMany({
    where: { isActive: true },
    select: { id: true, name: true, capacity: true, location: true, openHours: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(classrooms)
}
