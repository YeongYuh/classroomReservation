import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PaymentStatus, Role } from '@prisma/client'

// LINE Pay redirects user here when they cancel on the payment page.
// Only mark PENDING payments as FAILED — never degrade an already-COMPLETED payment,
// which would corrupt the ledger even if someone hits this URL with a known orderId.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('orderId') ?? ''

  if (orderId) {
    await prisma.payment
      .update({
        where: { reservationId: orderId, status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.FAILED },
      })
      .catch(() => {
        // Ignore — record may not exist or may already be non-PENDING
      })
  }

  redirect('/profile?payment=cancelled')
}

// Admin-only: manually mark a pending payment as failed
export async function POST(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const orderId = body.orderId as string | undefined

  if (!orderId) return NextResponse.json({ error: '缺少 orderId' }, { status: 400 })

  const updated = await prisma.payment
    .update({
      where: { reservationId: orderId, status: PaymentStatus.PENDING },
      data: { status: PaymentStatus.FAILED },
    })
    .catch(() => null)

  if (!updated) return NextResponse.json({ error: '找不到或已非 PENDING 狀態' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
