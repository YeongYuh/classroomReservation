import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CourseStatus, ReservationStatus } from '@prisma/client'
import { isCourseAvailable, remainingSlots } from '@/lib/course-availability'
import { auth } from '@/lib/auth'
import { ReserveButton } from './reserve-button'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  const course = await prisma.course.findFirst({
    where: { id, status: CourseStatus.ACTIVE, teacher: { isVerified: true, isHidden: false } },
    include: {
      teacher: { select: { id: true, displayName: true, avatarUrl: true, bio: true } },
      _count: { select: { reservations: { where: { status: ReservationStatus.PAID } } } },
      reviews: { select: { rating: true, comment: true, user: { select: { name: true } }, createdAt: true } },
    },
  })
  if (!course) notFound()

  const paidCount = course._count.reservations
  const available = isCourseAvailable(paidCount, course.maxSlots)
  const remaining = remainingSlots(paidCount, course.maxSlots)
  const tags: string[] = (() => { try { return JSON.parse(course.tags) } catch { return [] } })()
  const startDate = new Date(course.startAt)
  const avgRating =
    course.reviews.length > 0
      ? course.reviews.reduce((s, r) => s + r.rating, 0) / course.reviews.length
      : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/" className="text-sm text-indigo-600 hover:underline mb-6 inline-block">← 回首頁</Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{course.title}</h1>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {tags.map((t) => (
                <span key={t} className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-xs">{t}</span>
              ))}
            </div>
          )}

          <div className="text-sm text-gray-600 space-y-1 mb-4">
            <p>
              {startDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </p>
            <p>{startDate.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })} · {course.durationMin} 分鐘</p>
            <p>{course.location}</p>
          </div>

          {course.description && (
            <p className="text-gray-600 text-sm whitespace-pre-line mb-4">{course.description}</p>
          )}

          <div className="flex items-center justify-between py-3 border-t border-b border-gray-100 mb-5">
            <span className="text-xl font-bold">
              {Number(course.price) === 0 ? '免費' : `NT$ ${Number(course.price).toLocaleString()}`}
            </span>
            <div className="text-right text-sm">
              {available ? (
                <><p className="text-gray-500">剩餘 {remaining} 名額</p><p className="text-gray-400">共 {course.maxSlots} 名</p></>
              ) : (
                <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-sm font-medium">已額滿</span>
              )}
              {avgRating !== null && <p className="text-amber-500 font-medium mt-1">★ {avgRating.toFixed(1)}</p>}
            </div>
          </div>

          {available ? (
            <ReserveButton
              courseId={course.id}
              isLoggedIn={!!session}
              loginUrl={`/login?callbackUrl=/courses/${course.id}`}
            />
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-sm text-gray-500 font-medium">
              此課程已額滿
            </div>
          )}
        </div>

        {/* Teacher */}
        <Link href={`/teachers/${course.teacher.id}`} className="block bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow p-4">
          <div className="flex items-center gap-3">
            {course.teacher.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={course.teacher.avatarUrl} alt={course.teacher.displayName} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                {course.teacher.displayName.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{course.teacher.displayName}</p>
              {course.teacher.bio && (
                <p className="text-sm text-gray-500 line-clamp-1">{course.teacher.bio}</p>
              )}
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
