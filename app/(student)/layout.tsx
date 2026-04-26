import Link from 'next/link'
import { UnreadBadge } from '@/components/unread-badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogoutButton } from '@/components/logout-button'
import { auth } from '@/lib/auth'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const isLoggedIn = !!session
  const isAdmin = session?.user.role === 'ADMIN'
  const isTeacher = session?.user.role === 'TEACHER'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold text-indigo-600 dark:text-indigo-400">有氧課程</Link>
          <nav className="flex items-center gap-3">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">探索課程</Link>
            {isLoggedIn ? (
              <>
                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    className="text-sm bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    後台管理
                  </Link>
                )}
                {isTeacher && (
                  <Link
                    href="/teacher/schedule"
                    className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  >
                    老師後台
                  </Link>
                )}
                <UnreadBadge />
                <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">我的課表</Link>
                <LogoutButton className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100" />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  登入
                </Link>
                <Link
                  href="/register"
                  className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  免費註冊
                </Link>
              </>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </header>
      {children}
    </div>
  )
}
