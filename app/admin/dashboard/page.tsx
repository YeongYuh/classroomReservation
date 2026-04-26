import { prisma } from '@/lib/prisma'
import { buildRevenueStats, buildTopTeachers, buildHeatmap } from '@/lib/analytics'
import { PaymentStatus, ReservationStatus } from '@prisma/client'
import HeatmapGrid from './heatmap-grid'

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

function fmt(n: number) {
  return `NT$ ${n.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export default async function AdminDashboardPage() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [allPayments, monthPayments, reservations, courses] = await Promise.all([
    prisma.payment.findMany({
      where: { status: PaymentStatus.COMPLETED },
      select: { amount: true, platformFee: true, teacherAmount: true },
    }),
    prisma.payment.findMany({
      where: {
        status: PaymentStatus.COMPLETED,
        reservation: { course: { startAt: { gte: monthStart } } },
      },
      select: { amount: true, platformFee: true, teacherAmount: true },
    }),
    prisma.reservation.findMany({
      where: {
        status: { in: [ReservationStatus.PAID, ReservationStatus.ATTENDED] },
        course: { startAt: { gte: monthStart } },
      },
      select: {
        course: {
          select: { teacher: { select: { id: true, displayName: true } } },
        },
      },
    }),
    prisma.course.findMany({
      where: {
        startAt: { gte: monthStart },
        reservations: {
          some: { status: { in: [ReservationStatus.PAID, ReservationStatus.ATTENDED] } },
        },
      },
      select: { startAt: true },
    }),
  ])

  const toNum = (p: { amount: unknown; platformFee: unknown; teacherAmount: unknown }) => ({
    amount: Number(p.amount),
    platformFee: Number(p.platformFee),
    teacherAmount: Number(p.teacherAmount),
  })

  const cumulative = buildRevenueStats(allPayments.map(toNum))
  const thisMonth = buildRevenueStats(monthPayments.map(toNum))
  const topTeachers = buildTopTeachers(
    reservations.map((r) => ({
      teacherId: r.course.teacher.id,
      displayName: r.course.teacher.displayName,
    })),
  )
  const heatmap = buildHeatmap(courses.map((c) => c.startAt))

  const monthLabel = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">數據看板</h1>

      {/* ── Revenue ───────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">收入總覽</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <RevenueCard title={`本月收入（${monthLabel}）`} stats={thisMonth} />
          <RevenueCard title="累計收入" stats={cumulative} />
        </div>
      </section>

      {/* ── Top teachers ──────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">本月熱門老師（依預約數）</h2>
        {topTeachers.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-sm">本月尚無付費預約資料</p>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">排名</th>
                  <th className="px-4 py-3 text-left">老師</th>
                  <th className="px-4 py-3 text-right">預約數</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {topTeachers.map((t, i) => (
                  <tr key={t.teacherId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500">#{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{t.displayName}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">{t.reservationCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Heatmap ───────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">熱門時段熱圖（本月）</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">X 軸 = 星期一～日，Y 軸 = 0–23 時</p>
        <HeatmapGrid heatmap={heatmap} weekdayLabels={WEEKDAY_LABELS} />
      </section>
    </div>
  )
}

function RevenueCard({
  title,
  stats,
}: {
  title: string
  stats: { totalRevenue: number; platformFee: number; teacherAmount: number }
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{title}</p>
      <div className="space-y-1">
        <Row label="總收入" value={fmt(stats.totalRevenue)} bold />
        <Row label="平台抽成" value={fmt(stats.platformFee)} />
        <Row label="老師應得" value={fmt(stats.teacherAmount)} />
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={bold ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}>{value}</span>
    </div>
  )
}
