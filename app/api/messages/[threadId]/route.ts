import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canAccessThread } from '@/lib/message-access'

// threadId = sorted "userId1:userId2"
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 })
  }

  const { threadId } = await params
  const [uid1, uid2] = threadId.split(':')

  if (!uid1 || !uid2) {
    return NextResponse.json({ error: '無效的對話 ID' }, { status: 400 })
  }

  if (!canAccessThread(session.user.id, uid1, uid2)) {
    return NextResponse.json({ error: '無權限' }, { status: 403 })
  }

  // Mark messages sent to current user in this thread as read
  await prisma.message.updateMany({
    where: {
      receiverId: session.user.id,
      senderId: session.user.id === uid1 ? uid2 : uid1,
      readAt: null,
    },
    data: { readAt: new Date() },
  })

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: uid1, receiverId: uid2 },
        { senderId: uid2, receiverId: uid1 },
      ],
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      body: true,
      senderId: true,
      readAt: true,
      createdAt: true,
      sender: { select: { name: true } },
    },
  })

  const serialized = messages.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
    readAt: m.readAt?.toISOString() ?? null,
  }))

  return NextResponse.json(serialized)
}
