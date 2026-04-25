'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== Role.TEACHER) throw new Error('Unauthorized')

  const displayName = (formData.get('displayName') as string | null)?.trim()
  const bio = (formData.get('bio') as string | null)?.trim() || null
  const youtubeUrl = (formData.get('youtubeUrl') as string | null)?.trim() || null
  const avatarUrl = (formData.get('avatarUrl') as string | null)?.trim() || null
  const certUrlsRaw = formData.get('certUrls') as string | null

  let certUrls: string[] = []
  try {
    const parsed = JSON.parse(certUrlsRaw ?? '[]')
    if (Array.isArray(parsed)) certUrls = parsed.filter((u) => typeof u === 'string')
  } catch {
    certUrls = []
  }

  const profile = await prisma.teacherProfile.update({
    where: { userId: session.user.id },
    data: {
      ...(displayName ? { displayName } : {}),
      bio,
      youtubeUrl,
      avatarUrl,
      certUrls: JSON.stringify(certUrls),
    },
    select: { id: true },
  })

  revalidatePath(`/teachers/${profile.id}`)
  revalidatePath('/teacher/profile')
}
