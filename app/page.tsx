import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { CourseStatus, ReservationStatus, AdSlot } from '@prisma/client'
import { isCourseAvailable, remainingSlots } from '@/lib/course-availability'
import { filterActiveAds } from '@/lib/ads'

interface SearchParams {
  tag?: string
  date?: string
  location?: string
  teacherName?: string
}

async function getCourses(sp: SearchParams) {
  const { tag = '', date = '', location = '', teacherName = '' } = sp

  const courses = await prisma.course.findMany({
    where: {
      status: CourseStatus.ACTIVE,
      teacher: {
        isVerified: true,
        isHidden: false,
        ...(teacherName ? { displayName: { contains: teacherName } } : {}),
      },
      ...(location ? { location: { contains: location } } : {}),
      ...(tag ? { tags: { contains: tag } } : {}),
      ...(date
        ? { startAt: { gte: new Date(`${date}T00:00:00`), lt: new Date(`${date}T23:59:59`) } }
        : {}),
    },
    include: {
      teacher: { select: { id: true, displayName: true, avatarUrl: true } },
      _count: { select: { reservations: { where: { status: ReservationStatus.PAID } } } },
      reviews: { select: { rating: true } },
    },
    orderBy: { startAt: 'asc' },
  })

  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    tags: (() => { try { return JSON.parse(c.tags) as string[] } catch { return [] } })(),
    location: c.location,
    startAt: c.startAt,
    durationMin: c.durationMin,
    maxSlots: c.maxSlots,
    price: c.price.toString(),
    teacher: c.teacher,
    paidCount: c._count.reservations,
    avgRating:
      c.reviews.length > 0
        ? c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length
        : null,
  }))
}

async function getActiveAds() {
  const now = new Date()
  const all = await prisma.advertisement.findMany({
    where: { isActive: true },
    orderBy: { startAt: 'asc' },
  })
  return filterActiveAds(all, now)
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const [courses, ads] = await Promise.all([getCourses(sp), getActiveAds()])

  const banners = ads.filter((a) => a.slot === AdSlot.HOMEPAGE_BANNER)
  const featuredTeachers = ads.filter((a) => a.slot === AdSlot.FEATURED_TEACHER)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Homepage Banner ads ────────────────────────────────────────────── */}
      {banners.length > 0 && (
        <div className="w-full">
          {banners.map((ad) =>
            ad.linkUrl ? (
              <a key={ad.id} href={ad.linkUrl} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ad.imageUrl} alt="廣告" className="w-full object-cover max-h-64" />
              </a>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={ad.id} src={ad.imageUrl} alt="廣告" className="w-full object-cover max-h-64" />
            ),
          )}
        </div>
      )}

      {/* Hero / Search */}
      <div className="bg-indigo-700 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">有氧課程一站式平台</h1>
          <p className="text-indigo-200 mb-8">找到最適合你的課程，立即預約</p>

          <form method="get" action="/" className="bg-white rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">課程類型 / 標籤</label>
              <input
                name="tag"
                defaultValue={sp.tag}
                placeholder="例：Zumba"
                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">地點</label>
              <input
                name="location"
                defaultValue={sp.location}
                placeholder="例：台北"
                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">日期</label>
              <input
                name="date"
                type="date"
                defaultValue={sp.date}
                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">老師姓名</label>
              <input
                name="teacherName"
                defaultValue={sp.teacherName}
                placeholder="老師姓名"
                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                搜尋
              </button>
              {(sp.tag || sp.location || sp.date || sp.teacherName) && (
                <Link
                  href="/"
                  className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  清除篩選
                </Link>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* ── Featured Teacher ads ───────────────────────────────────────────── */}
      {featuredTeachers.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pt-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">推薦老師</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {featuredTeachers.map((ad) => (
              <a
                key={ad.id}
                href={ad.linkUrl ?? '#'}
                className="flex-none w-36 rounded-xl overflow-hidden shadow hover:shadow-md transition-shadow"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ad.imageUrl} alt="推薦老師" className="w-full h-36 object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        {(sp.tag || sp.location || sp.date || sp.teacherName) && (
          <p className="text-sm text-gray-500 mb-4">
            找到 {courses.length} 堂課程
            {sp.tag && <> · 標籤：<span className="font-medium">{sp.tag}</span></>}
            {sp.location && <> · 地點：<span className="font-medium">{sp.location}</span></>}
            {sp.teacherName && <> · 老師：<span className="font-medium">{sp.teacherName}</span></>}
          </p>
        )}

        {courses.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">目前沒有符合條件的課程</p>
            <p className="text-sm">試試調整搜尋條件，或稍後再來看看</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {courses.map((c) => {
              const available = isCourseAvailable(c.paidCount, c.maxSlots)
              const remaining = remainingSlots(c.paidCount, c.maxSlots)
              const startDate = new Date(c.startAt)
              return (
                <Link
                  key={c.id}
                  href={`/courses/${c.id}`}
                  className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 border border-gray-100"
                >
                  {/* Teacher */}
                  <div className="flex items-center gap-2 mb-3">
                    {c.teacher.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.teacher.avatarUrl}
                        alt={c.teacher.displayName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                        {c.teacher.displayName.charAt(0)}
                      </div>
                    )}
                    <span className="text-sm text-gray-600">{c.teacher.displayName}</span>
                    {c.avgRating !== null && (
                      <span className="ml-auto text-sm text-amber-500 font-medium">
                        ★ {c.avgRating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="font-semibold text-gray-900 mb-2 line-clamp-2">{c.title}</h2>

                  {/* Tags */}
                  {c.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {c.tags.map((t) => (
                        <span key={t} className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-xs">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="text-sm text-gray-500 space-y-0.5 mb-3">
                    <p>
                      {startDate.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' })}
                      {' · '}
                      {startDate.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}
                      {c.durationMin} 分鐘
                    </p>
                    <p>{c.location}</p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                    <span className="font-bold text-gray-900">
                      {Number(c.price) === 0 ? '免費' : `NT$ ${Number(c.price).toLocaleString()}`}
                    </span>
                    {available ? (
                      <span className="text-xs text-gray-500">剩餘 {remaining} / {c.maxSlots} 名</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                        已額滿
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
