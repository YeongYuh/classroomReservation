import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EnrollmentList } from './enrollment-list'

export default async function EnrollmentsPage() {
  const session = await auth()

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: session!.user.id },
    select: { id: true },
  })

  const courses = profile
    ? await prisma.course.findMany({
        where: { teacherId: profile.id },
        orderBy: { startAt: 'desc' },
        select: {
          id: true,
          title: true,
          startAt: true,
          durationMin: true,
          location: true,
          maxSlots: true,
          status: true,
          _count: { select: { reservations: { where: { status: 'PAID' } } } },
        },
      })
    : []

  const serialized = courses.map((c) => ({
    ...c,
    startAt: c.startAt.toISOString(),
    paidCount: c._count.reservations,
  }))

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">預約名單</h1>
      {serialized.length === 0 ? (
        <p className="text-gray-500 text-sm">尚未建立任何課程。</p>
      ) : (
        <EnrollmentList courses={serialized} />
      )}
    </div>
  )
}
