'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { hasConflict } from '@/lib/classroom-conflict'

const createCourseSchema = z.object({
  title: z.string().min(1),
  tags: z.string().default('[]'),
  description: z.string().optional(),
  location: z.string().min(1),
  startAt: z.string().min(1),
  durationMin: z.coerce.number().int().positive(),
  maxSlots: z.coerce.number().int().positive(),
  price: z.coerce.number().nonnegative(),
  classroomId: z.string().optional(),
})

export async function createCourse(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== Role.TEACHER) throw new Error('Unauthorized')

  const parsed = createCourseSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Invalid input: ' + parsed.error.message)

  const { title, tags, description, location, startAt, durationMin, maxSlots, price, classroomId } = parsed.data

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, isVerified: true },
  })
  if (!profile?.isVerified) throw new Error('Teacher not verified')

  const startDate = new Date(startAt)
  if (startDate <= new Date()) throw new Error('Start time must be in the future')
  const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000)

  if (classroomId) {
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId, isActive: true },
      select: { capacity: true },
    })
    if (!classroom) throw new Error('Classroom not found or inactive')
    if (maxSlots > classroom.capacity) {
      throw new Error(`人數上限不能超過教室容量 ${classroom.capacity} 人`)
    }

    await prisma.$transaction(async (tx) => {
      const existingBookings = await tx.classroomBooking.findMany({
        where: { classroomId },
        select: { startAt: true, endAt: true },
      })
      if (hasConflict(existingBookings, startDate, endDate)) {
        throw new Error('該時段教室已被預訂，請選擇其他時間或教室')
      }

      const course = await tx.course.create({
        data: {
          teacherId: profile.id,
          title,
          tags,
          description: description || null,
          location,
          startAt: startDate,
          durationMin,
          maxSlots,
          price,
        },
      })

      await tx.classroomBooking.create({
        data: { classroomId, courseId: course.id, startAt: startDate, endAt: endDate },
      })
    })
  } else {
    await prisma.course.create({
      data: {
        teacherId: profile.id,
        title,
        tags,
        description: description || null,
        location,
        startAt: startDate,
        durationMin,
        maxSlots,
        price,
      },
    })
  }

  revalidatePath('/teacher/schedule')
}

export async function cancelCourse(courseId: string) {
  const session = await auth()
  if (!session || session.user.role !== Role.TEACHER) throw new Error('Unauthorized')

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!profile) throw new Error('Profile not found')

  const course = await prisma.course.findFirst({
    where: { id: courseId, teacherId: profile.id },
  })
  if (!course) throw new Error('Course not found or not owned by teacher')

  await prisma.course.update({
    where: { id: courseId },
    data: { status: 'CANCELLED' },
  })

  revalidatePath('/teacher/schedule')
}
