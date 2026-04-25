import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { validateMessageBody } from '@/lib/message-access'

const schema = z.object({
  receiverId: z.string().min(1),
  body: z.string().min(1).max(2000),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '資料格式錯誤' }, { status: 400 })
  }

  const { receiverId, body: msgBody } = parsed.data

  const validation = validateMessageBody(msgBody)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  if (receiverId === session.user.id) {
    return NextResponse.json({ error: '無法傳訊給自己' }, { status: 400 })
  }

  // Verify receiver exists
  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true },
  })
  if (!receiver) {
    return NextResponse.json({ error: '收件人不存在' }, { status: 404 })
  }

  const message = await prisma.message.create({
    data: {
      senderId: session.user.id,
      receiverId,
      body: msgBody.trim(),
    },
    select: {
      id: true,
      body: true,
      senderId: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ ...message, createdAt: message.createdAt.toISOString() }, { status: 201 })
}

// GET /api/messages — returns unread count for current user
export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 })
  }

  const unreadCount = await prisma.message.count({
    where: { receiverId: session.user.id, readAt: null },
  })

  return NextResponse.json({ unreadCount })
}
