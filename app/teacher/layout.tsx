import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Role } from '@prisma/client'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { canTeacherAccessDashboard } from '@/lib/teacher-verification'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogoutButton } from '@/components/logout-button'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== Role.TEACHER) redirect('/login')

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: session.user.id },
    select: { isVerified: true },
  })

  if (!canTeacherAccessDashboard(profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow p-8 text-center space-y-4">
          <div className="text-5xl">⏳</div>
          <h1 className="text-2xl font-bold">帳號審核中</h1>
          <p className="text-gray-500">
            您的老師帳號正在等待管理員審核，審核通過後即可使用老師後台功能。
          </p>
          <p className="text-sm text-gray-400">如有疑問請聯繫平台客服。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      <nav className="w-56 bg-indigo-800 dark:bg-indigo-950 text-white flex flex-col gap-1 p-4">
        <p className="text-xs uppercase tracking-widest text-indigo-300 mb-4">老師後台</p>
        <Link href="/teacher/schedule" className="px-3 py-2 rounded hover:bg-indigo-700 dark:hover:bg-indigo-900 text-sm">
          課表管理
        </Link>
        <Link href="/teacher/enrollments" className="px-3 py-2 rounded hover:bg-indigo-700 dark:hover:bg-indigo-900 text-sm">
          預約名單
        </Link>
        <Link href="/teacher/scan" className="px-3 py-2 rounded hover:bg-indigo-700 dark:hover:bg-indigo-900 text-sm">
          掃描簽到
        </Link>
        <Link href="/teacher/profile" className="px-3 py-2 rounded hover:bg-indigo-700 dark:hover:bg-indigo-900 text-sm">
          個人檔案
        </Link>
        <div className="mt-auto pt-4 flex flex-col gap-2">
          <ThemeToggle />
          <LogoutButton className="text-xs text-indigo-300 hover:text-white text-left px-1 transition-colors" />
        </div>
      </nav>
      <main className="flex-1 p-8 bg-gray-50 dark:bg-gray-900">{children}</main>
    </div>
  )
}
