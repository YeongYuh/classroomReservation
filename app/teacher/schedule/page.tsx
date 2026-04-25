import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ScheduleCalendar } from './schedule-calendar'

export default async function SchedulePage() {
  const session = await auth()
  if (!session) redirect('/login')

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, isVerified: true },
  })

  if (!profile?.isVerified) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <h1 className="text-2xl font-bold mb-4">帳號審核中</h1>
        <p className="text-gray-500">審核通過後即可開始建立課程。</p>
      </div>
    )
  }

  const rawCourses = await prisma.course.findMany({
    where: { teacherId: profile.id },
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
      status: true,
      _count: { select: { reservations: true } },
    },
  })

  const courses = rawCourses.map(c => ({
    ...c,
    tags: (() => { try { return JSON.parse(c.tags) as string[] } catch { return [] } })(),
    price: c.price.toString(),
    startAt: c.startAt.toISOString(),
    status: c.status as string,
  }))

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">課表管理</h1>
      <ScheduleCalendar courses={courses} />
    </div>
  )
}
