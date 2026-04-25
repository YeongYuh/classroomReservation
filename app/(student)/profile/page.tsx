import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { categorizeReservations } from '@/lib/reservation-categorizer'
import { ReservationCard } from './reservation-card'

interface SearchParams { payment?: string }

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  const { payment } = await searchParams

  const bannerMap: Record<string, { msg: string; cls: string }> = {
    success: { msg: '付款成功！課程已確認預約。', cls: 'bg-green-50 border-green-200 text-green-800' },
    failed: { msg: '付款失敗，請重新嘗試。', cls: 'bg-red-50 border-red-200 text-red-700' },
    cancelled: { msg: '已取消付款。', cls: 'bg-gray-50 border-gray-200 text-gray-700' },
    invalid: { msg: '付款資訊無效。', cls: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
  }

  const banner = payment ? bannerMap[payment] : null

  const rawReservations = session?.user.id
    ? await prisma.reservation.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          courseId: true,
          status: true,
          qrCode: true,
          paidAt: true,
          course: {
            select: {
              title: true,
              location: true,
              startAt: true,
              durationMin: true,
              price: true,
              teacher: { select: { displayName: true, avatarUrl: true } },
              reviews: { where: { userId: session.user.id }, select: { id: true } },
            },
          },
        },
      })
    : []

  const normalized = rawReservations.map((r) => ({
    id: r.id,
    courseId: r.courseId,
    status: r.status,
    qrCode: r.qrCode,
    paidAt: r.paidAt,
    hasReview: r.course.reviews.length > 0,
    course: {
      title: r.course.title,
      location: r.course.location,
      startAt: r.course.startAt,
      durationMin: r.course.durationMin,
      price: r.course.price.toString(),
      teacher: r.course.teacher,
    },
  }))

  const { upcoming, history } = categorizeReservations(normalized)

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">我的課表</h1>

      {banner && (
        <div className={`border rounded-xl px-4 py-3 text-sm mb-6 ${banner.cls}`}>
          {banner.msg}
        </div>
      )}

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3 text-gray-700">即將上課</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400">目前沒有即將到來的課程。</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((r) => (
              <ReservationCard key={r.id} reservation={r} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3 text-gray-700">歷史紀錄</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400">目前沒有歷史紀錄。</p>
        ) : (
          <div className="space-y-3">
            {history.map((r) => (
              <ReservationCard key={r.id} reservation={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
