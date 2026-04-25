import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

const CLIENT_ID = process.env.LINE_NOTIFY_CLIENT_ID ?? ''
const CLIENT_SECRET = process.env.LINE_NOTIFY_CLIENT_SECRET ?? ''
const CALLBACK_URL = process.env.LINE_NOTIFY_CALLBACK_URL ?? 'http://localhost:3000/api/line-notify/callback'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code') ?? ''
  const state = searchParams.get('state') ?? '' // userId stored in state

  if (!code || !state) {
    redirect('/teacher/profile?notify=error')
  }

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://notify-bot.line.me/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: CALLBACK_URL,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    })

    if (!tokenRes.ok) {
      redirect('/teacher/profile?notify=error')
    }

    const { access_token } = await tokenRes.json() as { access_token: string }

    await prisma.teacherProfile.update({
      where: { userId: state },
      data: { lineNotifyToken: access_token },
    })

    redirect('/teacher/profile?notify=connected')
  } catch {
    redirect('/teacher/profile?notify=error')
  }
}
