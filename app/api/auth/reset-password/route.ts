import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { consumeResetToken } from '@/lib/password-reset'

const bodySchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, '密碼至少 8 個字元'),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    )
  }

  const success = await consumeResetToken(parsed.data.token, parsed.data.newPassword)
  if (!success) {
    return NextResponse.json(
      { error: '重設連結無效或已過期' },
      { status: 400 },
    )
  }

  return NextResponse.json({ ok: true })
}
