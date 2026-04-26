'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { Role, UserStatus } from '@prisma/client'

const userSchema = z.object({
  email: z.string().email('請輸入有效 Email'),
  name: z.string().min(1, '請輸入姓名'),
  role: z.nativeEnum(Role),
  status: z.nativeEnum(UserStatus),
})

export async function createUser(formData: FormData) {
  const parsed = userSchema.safeParse({
    email: formData.get('email'),
    name: formData.get('name'),
    role: formData.get('role'),
    status: formData.get('status'),
  })
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)

  const { email, name, role, status } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error('此 Email 已被使用')

  const tempPassword = randomBytes(8).toString('hex')
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role,
      status,
      ...(role === Role.TEACHER
        ? {
            teacherProfile: {
              create: { displayName: name, isVerified: false, isHidden: false },
            },
          }
        : {}),
    },
  })

  revalidatePath('/admin/users')
  redirect(`/admin/users?created=${user.id}&tempPassword=${tempPassword}`)
}

const editSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, '請輸入姓名'),
  role: z.nativeEnum(Role),
  status: z.nativeEnum(UserStatus),
})

export async function updateUser(formData: FormData) {
  const parsed = editSchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    role: formData.get('role'),
    status: formData.get('status'),
  })
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)

  const { id, name, role, status } = parsed.data

  const user = await prisma.user.findUnique({ where: { id }, include: { teacherProfile: true } })
  if (!user) throw new Error('找不到使用者')

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: { name, role, status } })

    if (role === Role.TEACHER && !user.teacherProfile) {
      await tx.teacherProfile.create({
        data: { userId: id, displayName: name, isVerified: false, isHidden: false },
      })
    }
  })

  revalidatePath('/admin/users')
  redirect('/admin/users')
}

export async function deleteUser(formData: FormData) {
  const id = formData.get('id') as string
  if (!id) throw new Error('缺少 id')
  await prisma.user.delete({ where: { id } })
  revalidatePath('/admin/users')
}
