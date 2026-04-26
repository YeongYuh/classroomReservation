'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { validateCommissionSettings } from '@/lib/commission-settings'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== Role.ADMIN) throw new Error('Unauthorized')
}

export async function createTeacher(formData: FormData): Promise<{ tempPassword?: string; error?: string }> {
  await requireAdmin()

  const email = (formData.get('email') as string).trim().toLowerCase()
  const displayName = (formData.get('displayName') as string).trim()
  const bio = (formData.get('bio') as string | null)?.trim() || null

  if (!email || !displayName) return { error: '請填寫 Email 和顯示名稱' }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: '此 Email 已被使用' }

  const tempPassword = randomBytes(8).toString('hex') // 16-char hex temp password
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  await prisma.user.create({
    data: {
      email,
      role: Role.TEACHER,
      passwordHash,
      teacherProfile: {
        create: { displayName, bio, isVerified: true, isHidden: false },
      },
    },
  })

  revalidatePath('/admin/teachers')
  return { tempPassword }
}

export async function updateTeacher(userId: string, formData: FormData) {
  await requireAdmin()

  const displayName = (formData.get('displayName') as string).trim()
  const bio = (formData.get('bio') as string | null)?.trim() || null

  if (!displayName) throw new Error('顯示名稱不能為空')

  await prisma.teacherProfile.update({
    where: { userId },
    data: { displayName, bio },
  })

  redirect('/admin/teachers')
}

export async function deleteTeacher(userId: string) {
  await requireAdmin()
  // Cascade deletes TeacherProfile, Courses, Reservations, etc.
  await prisma.user.delete({ where: { id: userId } })
  revalidatePath('/admin/teachers')
}

export async function approveTeacher(formData: FormData) {
  await requireAdmin()

  const userId = formData.get('userId') as string
  if (!userId) throw new Error('Missing userId')

  await prisma.teacherProfile.update({
    where: { userId },
    data: { isVerified: true },
  })

  revalidatePath('/admin/teachers')
}

export async function setTeacherHidden(formData: FormData) {
  await requireAdmin()

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
  await requireAdmin()

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
