'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role, AdSlot } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { requireHttpUrl } from '@/lib/validate-url'

export async function createAd(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== Role.ADMIN) throw new Error('Unauthorized')

  const slot = formData.get('slot') as string
  const imageUrl = requireHttpUrl((formData.get('imageUrl') as string).trim(), 'imageUrl')
  const linkUrlRaw = (formData.get('linkUrl') as string).trim() || null
  const linkUrl = linkUrlRaw ? requireHttpUrl(linkUrlRaw, 'linkUrl') : null
  const startAt = new Date(formData.get('startAt') as string)
  const endAt = new Date(formData.get('endAt') as string)

  if (!Object.values(AdSlot).includes(slot as AdSlot)) throw new Error('Invalid slot')
  if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) throw new Error('Invalid dates')
  if (endAt <= startAt) throw new Error('endAt must be after startAt')

  await prisma.advertisement.create({
    data: { slot: slot as AdSlot, imageUrl, linkUrl, startAt, endAt, isActive: true },
  })

  revalidatePath('/admin/ads')
  revalidatePath('/')
}

export async function toggleAdActive(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== Role.ADMIN) throw new Error('Unauthorized')

  const id = formData.get('id') as string
  const active = formData.get('active') === 'true'
  if (!id) throw new Error('Missing id')

  await prisma.advertisement.update({ where: { id }, data: { isActive: active } })

  revalidatePath('/admin/ads')
  revalidatePath('/')
}
