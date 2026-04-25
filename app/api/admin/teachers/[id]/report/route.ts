import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role, PaymentStatus } from '@prisma/client'
import { buildReportCsv } from '@/lib/report-csv'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== Role.ADMIN) {
    return new Response(JSON.stringify({ error: '權限不足' }), { status: 403 })
  }

  const { id: userId } = await params
  const { searchParams } = new URL(request.url)
  const yearMonth = searchParams.get('month') // e.g. "2026-05"

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId },
    select: { id: true, displayName: true },
  })
  if (!profile) {
    return new Response(JSON.stringify({ error: '老師不存在' }), { status: 404 })
  }

  const dateFilter: { gte?: Date; lte?: Date } = {}
  if (yearMonth) {
    const [y, m] = yearMonth.split('-').map(Number)
    if (y && m) {
      dateFilter.gte = new Date(y, m - 1, 1)
      dateFilter.lte = new Date(y, m, 0, 23, 59, 59, 999)
    }
  }

  const payments = await prisma.payment.findMany({
    where: {
      status: PaymentStatus.COMPLETED,
      reservation: { course: { teacherId: profile.id } },
      ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
    },
    orderBy: { createdAt: 'asc' },
    select: {
      platformFee: true,
      teacherAmount: true,
      createdAt: true,
      reservation: {
        select: {
          user: { select: { name: true } },
          course: { select: { title: true, price: true } },
        },
      },
    },
  })

  const rows = payments.map((p) => ({
    date: p.createdAt.toISOString().slice(0, 10),
    courseTitle: p.reservation.course.title,
    studentName: p.reservation.user.name ?? '—',
    amount: Math.round(Number(p.reservation.course.price)),
    platformFee: Math.round(Number(p.platformFee) * 100) / 100,
    teacherAmount: Math.round(Number(p.teacherAmount) * 100) / 100,
  }))

  const csv = buildReportCsv(rows)
  // Strip characters that could break Content-Disposition header (header injection)
  const safeName = profile.displayName.replace(/[^\w一-鿿-]/g, '_')
  const safeMonth = (yearMonth ?? 'all').replace(/[^\w-]/g, '')
  const filename = `report_${safeName}_${safeMonth}.csv`

  return new Response('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
