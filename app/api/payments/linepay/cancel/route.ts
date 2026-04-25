import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PaymentStatus } from '@prisma/client'

// LINE Pay redirects user here when they cancel on the payment page
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('orderId') ?? ''

  if (orderId) {
    await prisma.payment
      .update({
        where: { reservationId: orderId },
        data: { status: PaymentStatus.FAILED },
      })
      .catch(() => {
        // Ignore — payment record might not exist yet
      })
  }

  redirect('/profile?payment=cancelled')
}

// Used programmatically (e.g., admin cancels order)
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const orderId = body.orderId as string | undefined

  if (!orderId) return NextResponse.json({ error: '缺少 orderId' }, { status: 400 })

  await prisma.payment
    .update({
      where: { reservationId: orderId },
      data: { status: PaymentStatus.FAILED },
    })
    .catch(() => null)

  return NextResponse.json({ ok: true })
}
