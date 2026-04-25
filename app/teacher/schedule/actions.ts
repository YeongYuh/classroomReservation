'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createCourseSchema = z.object({
  title: z.string().min(1),
  tags: z.string().default('[]'),
  description: z.string().optional(),
  location: z.string().min(1),
  startAt: z.string().min(1),
  durationMin: z.coerce.number().int().positive(),
  maxSlots: z.coerce.number().int().positive(),
  price: z.coerce.number().nonnegative(),
})

export async function createCourse(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== Role.TEACHER) throw new Error('Unauthorized')

  const parsed = createCourseSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Invalid input: ' + parsed.error.message)

  const { title, tags, description, location, startAt, durationMin, maxSlots, price } = parsed.data

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, isVerified: true },
  })
  if (!profile?.isVerified) throw new Error('Teacher not verified')

  const startDate = new Date(startAt)
  if (startDate <= new Date()) throw new Error('Start time must be in the future')

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
