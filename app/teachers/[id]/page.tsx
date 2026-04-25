import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CourseStatus, ReservationStatus } from '@prisma/client'
import { isCourseAvailable, remainingSlots } from '@/lib/course-availability'

export default async function TeacherPublicPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const profile = await prisma.teacherProfile.findFirst({
    where: { id, isVerified: true, isHidden: false },
    select: {
      id: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      youtubeUrl: true,
      courses: {
        where: { status: CourseStatus.ACTIVE, startAt: { gte: new Date() } },
        orderBy: { startAt: 'asc' },
        select: {
          id: true,
          title: true,
          tags: true,
          location: true,
          startAt: true,
          durationMin: true,
          maxSlots: true,
          price: true,
          _count: { select: { reservations: { where: { status: ReservationStatus.PAID } } } },
          reviews: { select: { rating: true } },
        },
      },
      _count: { select: { courses: { where: { status: CourseStatus.ACTIVE } } } },
    },
  })
  if (!profile) notFound()

  // Aggregate all reviews across the teacher's courses for overall stats
  const allReviews = await prisma.review.findMany({
    where: { course: { teacherId: id } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: { select: { name: true } },
      course: { select: { title: true } },
    },
  })

  const overallAvg =
    allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : null

  const courses = profile.courses.map((c) => {
    const avgRating =
      c.reviews.length > 0
        ? c.reviews.reduce((sum, r) => sum + r.rating, 0) / c.reviews.length
        : null
    return {
      ...c,
      tags: (() => { try { return JSON.parse(c.tags) as string[] } catch { return [] } })(),
      price: c.price.toString(),
      paidCount: c._count.reservations,
      avgRating,
      reviewCount: c.reviews.length,
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile header */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-start gap-5">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="w-24 h-24 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold shrink-0">
                {profile.displayName.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{profile.displayName}</h1>
              <p className="text-sm text-gray-500 mb-1">
                {profile._count.courses} 堂課程
                {overallAvg !== null && (
                  <span className="ml-3">
                    <StarRating rating={overallAvg} />
                    <span className="text-gray-400 text-xs ml-1">({allReviews.length} 則評價)</span>
                  </span>
                )}
              </p>
              {profile.youtubeUrl && (
                <a
                  href={profile.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline"
                >
                  ▶ YouTube 頻道
                </a>
              )}
            </div>
          </div>
          {profile.bio && (
            <p className="text-gray-600 whitespace-pre-line mt-4 text-sm leading-relaxed">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Upcoming courses */}
        <h2 className="text-lg font-bold text-gray-900 mb-4">即將開課</h2>
        {courses.length === 0 ? (
          <p className="text-gray-400 text-sm">目前無即將開始的課程。</p>
        ) : (
          <div className="space-y-3">
            {courses.map((c) => {
              const available = isCourseAvailable(c.paidCount, c.maxSlots)
              const remaining = remainingSlots(c.paidCount, c.maxSlots)
              const startDate = new Date(c.startAt)
              return (
                <Link
                  key={c.id}
                  href={`/courses/${c.id}`}
                  className="block bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">{c.title}</h3>
                      {c.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {c.tags.map((t) => (
                            <span key={t} className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-xs">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-sm text-gray-500">
                        {startDate.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' })}
                        {' · '}
                        {startDate.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}
                        {c.durationMin} 分鐘
                      </p>
                      <p className="text-sm text-gray-500">{c.location}</p>
                      {c.avgRating !== null && (
                        <div className="mt-1">
                          <StarRating rating={c.avgRating} size="sm" />
                          <span className="text-xs text-gray-400 ml-1">({c.reviewCount})</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-900">
                        {Number(c.price) === 0 ? '免費' : `NT$ ${Number(c.price).toLocaleString()}`}
                      </p>
                      {available ? (
                        <p className="text-xs text-gray-400 mt-0.5">剩 {remaining} 名</p>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">已額滿</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Review wall */}
        <h2 className="text-lg font-bold text-gray-900 mt-10 mb-4">學員評價</h2>
        {allReviews.length === 0 ? (
          <p className="text-gray-400 text-sm">目前尚無評價。</p>
        ) : (
          <div className="space-y-3">
            {allReviews.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-800">
                      {r.user.name ?? '匿名學員'}
                    </span>
                    <span className="text-xs text-gray-400">{r.course.title}</span>
                  </div>
                  <StarRating rating={r.rating} />
                </div>
                {r.comment && (
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{r.comment}</p>
                )}
                <p className="text-xs text-gray-300 mt-2">
                  {new Date(r.createdAt).toLocaleDateString('zh-TW')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  const cls = size === 'sm' ? 'text-sm' : 'text-base'
  return (
    <span className={`inline-flex items-center gap-0.5 ${cls}`} aria-label={`評分 ${rating.toFixed(1)}`}>
      {Array.from({ length: 5 }, (_, i) => {
        if (i < full) return <span key={i} className="text-yellow-400">★</span>
        if (i === full && half) return <span key={i} className="text-yellow-300">★</span>
        return <span key={i} className="text-gray-200">★</span>
      })}
      <span className="text-gray-500 text-xs ml-0.5">{rating.toFixed(1)}</span>
    </span>
  )
}
