'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { Role } from '@prisma/client'

const openHourSchema = z.object({
  day: z.number().int().min(0).max(6),
  open: z.string().regex(/^\d{2}:\d{2}$/),
  close: z.string().regex(/^\d{2}:\d{2}$/),
})

const classroomSchema = z.object({
  name: z.string().min(1, '名稱不能為空').max(100),
  capacity: z.coerce.number().int().min(1, '容量至少 1 人').max(500),
  location: z.string().min(1, '地點不能為空').max(200),
  openHours: z.array(openHourSchema).default([]),
})

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== Role.ADMIN) redirect('/login')
}

export async function createClassroom(formData: FormData) {
  await requireAdmin()

  const raw = {
    name: formData.get('name'),
    capacity: formData.get('capacity'),
    location: formData.get('location'),
    openHours: (() => {
      try {
        return JSON.parse(formData.get('openHours') as string || '[]')
      } catch {
        return []
      }
    })(),
  }

  const parsed = classroomSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  await prisma.classroom.create({
    data: {
      ...parsed.data,
      openHours: JSON.stringify(parsed.data.openHours),
    },
  })

  redirect('/admin/classrooms')
}

export async function updateClassroom(id: string, formData: FormData) {
  await requireAdmin()

  const raw = {
    name: formData.get('name'),
    capacity: formData.get('capacity'),
    location: formData.get('location'),
    openHours: (() => {
      try {
        return JSON.parse(formData.get('openHours') as string || '[]')
      } catch {
        return []
      }
    })(),
  }

  const parsed = classroomSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  await prisma.classroom.update({
    where: { id },
    data: {
      ...parsed.data,
      openHours: JSON.stringify(parsed.data.openHours),
    },
  })

  redirect('/admin/classrooms')
}

export async function toggleClassroomActive(id: string) {
  await requireAdmin()

  const classroom = await prisma.classroom.findUniqueOrThrow({ where: { id }, select: { isActive: true } })
  await prisma.classroom.update({
    where: { id },
    data: { isActive: !classroom.isActive },
  })
}
