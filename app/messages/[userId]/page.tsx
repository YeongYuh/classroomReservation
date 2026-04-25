import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { buildThreadKey } from '@/lib/message-access'
import { ConversationView } from './conversation-view'

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { userId: otherUserId } = await params

  if (otherUserId === session.user.id) notFound()

  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { id: true, name: true },
  })
  if (!otherUser) notFound()

  const threadId = buildThreadKey(session.user.id, otherUserId)

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <a href="/profile" className="text-sm text-gray-400 hover:text-gray-600">← 返回</a>
        <h1 className="text-xl font-bold">與 {otherUser.name ?? otherUserId} 的對話</h1>
      </div>
      <ConversationView
        threadId={threadId}
        currentUserId={session.user.id}
        otherUserName={otherUser.name ?? otherUserId}
      />
    </div>
  )
}
