import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { shouldAutoSuspend } from '@/lib/auto-suspend'

// Vercel Cron calls this with an Authorization header bearing CRON_SECRET.
function isCronAuthorized(req: Request): boolean {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return auth === `Bearer ${secret}`
}

export async function GET(req: Request): Promise<NextResponse> {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  // Fetch all MONTHLY teachers with their commission and any payment this month.
  const teachers = await prisma.teacherProfile.findMany({
    where: {
      commission: { plan: 'MONTHLY' },
    },
    select: {
      id: true,
      commission: { select: { billingDay: true } },
    },
  })

  const paidThisMonth = await prisma.monthlyPayment.findMany({
    where: {
      yearMonth,
      teacherId: { in: teachers.map((t) => t.id) },
    },
    select: { teacherId: true },
  })
  const paidSet = new Set(paidThisMonth.map((p) => p.teacherId))

  const toSuspend: string[] = []
  for (const teacher of teachers) {
    const billingDay = teacher.commission?.billingDay ?? null
    if (
      shouldAutoSuspend({
        plan: 'MONTHLY',
        billingDay,
        today,
        hasPaymentThisMonth: paidSet.has(teacher.id),
      })
    ) {
      toSuspend.push(teacher.id)
    }
  }

  if (toSuspend.length > 0) {
    await prisma.teacherProfile.updateMany({
      where: { id: { in: toSuspend } },
      data: { isHidden: true },
    })
  }

  return NextResponse.json({ suspended: toSuspend.length, ids: toSuspend })
}
