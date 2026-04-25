import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Role, PaymentStatus } from '@prisma/client'
import Link from 'next/link'

interface SearchParams { month?: string }

export default async function TeacherReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session || session.user.role !== Role.ADMIN) redirect('/login')

  const { id: userId } = await params
  const { month } = await searchParams

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId },
    select: { id: true, displayName: true, commission: { select: { plan: true, rate: true } } },
  })
  if (!profile) redirect('/admin/teachers')

  const dateFilter: { gte?: Date; lte?: Date } = {}
  if (month) {
    const [y, m] = month.split('-').map(Number)
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

  const totals = rows.reduce(
    (acc, r) => ({
      amount: acc.amount + r.amount,
      platformFee: acc.platformFee + r.platformFee,
      teacherAmount: acc.teacherAmount + r.teacherAmount,
    }),
    { amount: 0, platformFee: 0, teacherAmount: 0 }
  )

  const currentMonth = new Date().toISOString().slice(0, 7)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/teachers" className="text-sm text-gray-400 hover:text-gray-600">← 返回</Link>
        <h1 className="text-2xl font-bold">{profile.displayName} — 月結報表</h1>
      </div>

      {/* Filters + export */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <form method="get" className="flex items-center gap-2">
          <label className="text-sm text-gray-600">月份：</label>
          <input
            type="month"
            name="month"
            defaultValue={month ?? currentMonth}
            className="text-sm border rounded px-2 py-1"
          />
          <button
            type="submit"
            className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
          >
            查詢
          </button>
        </form>

        <a
          href={`/api/admin/teachers/${userId}/report${month ? `?month=${month}` : ''}`}
          className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          download
        >
          匯出 CSV
        </a>
      </div>

      {/* Commission info */}
      {profile.commission && (
        <p className="text-sm text-gray-500 mb-4">
          分潤方案：
          {profile.commission.plan === 'PERCENTAGE'
            ? `${(Number(profile.commission.rate) * 100).toFixed(0)}% 抽成`
            : `NT$ ${Number(profile.commission.rate).toLocaleString()} / 月`}
        </p>
      )}

      {/* Table */}
      {rows.length === 0 ? (
        <p className="text-gray-400 text-sm">此期間無付款紀錄。</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">日期</th>
                <th className="px-4 py-3 text-left">課程名</th>
                <th className="px-4 py-3 text-left">學員</th>
                <th className="px-4 py-3 text-right">金額</th>
                <th className="px-4 py-3 text-right">平台抽成</th>
                <th className="px-4 py-3 text-right">老師所得</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 text-gray-500">{row.date}</td>
                  <td className="px-4 py-3">{row.courseTitle}</td>
                  <td className="px-4 py-3 text-gray-600">{row.studentName}</td>
                  <td className="px-4 py-3 text-right">NT$ {row.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-red-600">NT$ {row.platformFee.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">NT$ {row.teacherAmount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold text-sm">
              <tr>
                <td className="px-4 py-3" colSpan={3}>合計（{rows.length} 筆）</td>
                <td className="px-4 py-3 text-right">NT$ {totals.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-red-600">NT$ {Math.round(totals.platformFee * 100) / 100}</td>
                <td className="px-4 py-3 text-right text-green-600">NT$ {Math.round(totals.teacherAmount * 100) / 100}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
