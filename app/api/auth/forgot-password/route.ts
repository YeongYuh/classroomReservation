import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createResetToken } from '@/lib/password-reset'

const bodySchema = z.object({ email: z.email() })

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: true }) // Always 200 to prevent enumeration
  }

  // Fire-and-forget: don't await so timing attacks can't reveal whether email exists
  createResetToken(parsed.data.email).catch(() => {})

  return NextResponse.json({ ok: true })
}
