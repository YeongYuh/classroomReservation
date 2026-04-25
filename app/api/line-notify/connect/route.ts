import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Role } from '@prisma/client'

const CLIENT_ID = process.env.LINE_NOTIFY_CLIENT_ID ?? ''
const CALLBACK_URL = process.env.LINE_NOTIFY_CALLBACK_URL ?? 'http://localhost:3000/api/line-notify/callback'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== Role.TEACHER) {
    redirect('/login')
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    scope: 'notify',
    state: session.user.id,
  })

  redirect(`https://notify-bot.line.me/oauth/authorize?${params}`)
}
