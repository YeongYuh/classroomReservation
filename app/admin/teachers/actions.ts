'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { validateCommissionSettings } from '@/lib/commission-settings'

export async function approveTeacher(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== Role.ADMIN) throw new Error('Unauthorized')

  const userId = formData.get('userId') as string
  if (!userId) throw new Error('Missing userId')

  await prisma.teacherProfile.update({
    where: { userId },
    data: { isVerified: true },
  })

  revalidatePath('/admin/teachers')
}

export async function setTeacherHidden(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== Role.ADMIN) throw new Error('Unauthorized')

  const userId = formData.get('userId') as string
  const hidden = formData.get('hidden') === 'true'
  if (!userId) throw new Error('Missing userId')

  await prisma.teacherProfile.update({
    where: { userId },
    data: { isHidden: hidden },
  })

  revalidatePath('/admin/teachers')
}

export async function updateCommission(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== Role.ADMIN) throw new Error('Unauthorized')

  const userId = formData.get('userId') as string
  const plan = formData.get('plan') as string
  const rateRaw = formData.get('rate') as string

  if (!userId || !plan || !rateRaw) throw new Error('Missing fields')

  const rate = Number(rateRaw)
  const validation = validateCommissionSettings({ plan: plan as 'PERCENTAGE' | 'MONTHLY', rate })
  if (!validation.valid) throw new Error(validation.error)

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!profile) throw new Error('Teacher not found')

  await prisma.commission.upsert({
    where: { teacherId: profile.id },
    create: { teacherId: profile.id, plan: plan as 'PERCENTAGE' | 'MONTHLY', rate },
    update: { plan: plan as 'PERCENTAGE' | 'MONTHLY', rate },
  })

  revalidatePath('/admin/teachers')
}
